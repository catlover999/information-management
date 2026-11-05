import { getOpenRouterConfig, OpenRouterEnvConfig } from '../config/env';
import { InventoryItem } from '../models/inventory';

export const OPENROUTER_CHAT_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions';

export const RECOGNITION_PROMPT_INSTRUCTION = `Analyze the supplied photograph and identify which items from the provided inventory checklist are visibly present.

Only identify items that can reasonably be recognized in the image.

Match recognized items against the supplied inventory IDs.

Do not invent items.
Do not return items that are not in the supplied inventory.
Do not guess when visual evidence is insufficient.

Return only the IDs of clearly identified items using the required JSON schema.`;

export const PANTRY_RECOGNITION_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'pantry_recognition',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        foundItemIds: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['foundItemIds'],
      additionalProperties: false,
    },
  },
} as const;

export type RecognitionErrorCode =
  | 'EMPTY_INVENTORY'
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'INSUFFICIENT_CREDITS'
  | 'UNSUPPORTED_MODEL'
  | 'IMAGE_PROCESSING_ERROR'
  | 'NETWORK_ERROR'
  | 'OPENROUTER_ERROR'
  | 'INVALID_JSON'
  | 'MISSING_FIELDS'
  | 'UNKNOWN_INVENTORY_ID';

export class RecognitionServiceError extends Error {
  public readonly code: RecognitionErrorCode;
  public readonly userMessage: string;

  constructor(code: RecognitionErrorCode, userMessage: string) {
    super(userMessage);
    this.name = 'RecognitionServiceError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

export { RecognitionServiceError as OpenRouterRecognitionError };

export interface RecognitionPayloadItem {
  id: string;
  name: string;
}

export interface PantryRecognitionResponse {
  foundItemIds: string[];
}

function redactSecrets(text: string, apiKey?: string): string {
  if (!text) {
    return '';
  }
  let sanitized = text;
  if (apiKey && apiKey.length >= 6) {
    sanitized = sanitized.split(apiKey).join('[REDACTED]');
  }
  sanitized = sanitized.replace(/sk-or-v1-[a-zA-Z0-9]+/g, '[REDACTED]');
  return sanitized;
}

/**
 * Validates the raw JSON string returned by the AI against the required schema
 * and verifies that every returned ID exists in the current inventory.
 * Deduplicates valid IDs before returning.
 */
export function validateAndNormalizeRecognitionResponse(
  rawContent: string,
  validInventoryIds: Set<string>,
): string[] {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new RecognitionServiceError(
      'INVALID_JSON',
      'The AI model returned an empty response. Your inventory was not changed.',
    );
  }

  let parsed: unknown;
  try {
    // Strip markdown code fences if a provider wrapped the JSON output
    const trimmed = rawContent
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(trimmed);
  } catch {
    throw new RecognitionServiceError(
      'INVALID_JSON',
      'Received an invalid JSON response from the recognition service. Your inventory remains unchanged.',
    );
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    throw new RecognitionServiceError(
      'MISSING_FIELDS',
      'Recognition response must be a JSON object. Your inventory remains unchanged.',
    );
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);

  if (!Object.prototype.hasOwnProperty.call(record, 'foundItemIds')) {
    throw new RecognitionServiceError(
      'MISSING_FIELDS',
      'Recognition response is missing the required "foundItemIds" field. Your inventory remains unchanged.',
    );
  }

  if (keys.some(k => k !== 'foundItemIds')) {
    throw new RecognitionServiceError(
      'MISSING_FIELDS',
      'Recognition response contained unexpected fields. Your inventory remains unchanged.',
    );
  }

  const rawIds = record.foundItemIds;
  if (!Array.isArray(rawIds)) {
    throw new RecognitionServiceError(
      'MISSING_FIELDS',
      'Recognition field "foundItemIds" must be an array of item IDs. Your inventory remains unchanged.',
    );
  }

  const deduplicated: string[] = [];
  const seen = new Set<string>();

  for (const entry of rawIds) {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new RecognitionServiceError(
        'MISSING_FIELDS',
        'Recognition response contained a non-string item ID. Your inventory remains unchanged.',
      );
    }

    const id = entry.trim();
    if (!validInventoryIds.has(id)) {
      throw new RecognitionServiceError(
        'UNKNOWN_INVENTORY_ID',
        `Recognition response included an unknown inventory ID ("${id}"). Your inventory remains unchanged.`,
      );
    }

    if (!seen.has(id)) {
      seen.add(id);
      deduplicated.push(id);
    }
  }

  return deduplicated;
}

/**
 * Builds the OpenRouter Chat Completions request body for pantry item recognition.
 */
export function buildOpenRouterRequestBody(
  model: string,
  inventoryItems: InventoryItem[],
  imageDataUrl: string,
) {
  const checklist: RecognitionPayloadItem[] = inventoryItems.map(item => ({
    id: item.id,
    name: item.name,
  }));

  return {
    model,
    temperature: 0,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: RECOGNITION_PROMPT_INSTRUCTION,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${RECOGNITION_PROMPT_INSTRUCTION}\n\nInventory Checklist JSON:\n${JSON.stringify(
              checklist,
            )}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ],
    response_format: PANTRY_RECOGNITION_RESPONSE_FORMAT,
  };
}

/**
 * Sends a single vision recognition request to OpenRouter and returns the
 * validated, deduplicated list of matched inventory item IDs.
 * Never retries automatically to protect the API budget.
 */
export async function identifyPantryItemsFromPhoto(params: {
  imageDataUrl: string;
  inventoryItems: InventoryItem[];
  configOverride?: Partial<OpenRouterEnvConfig>;
  fetchImpl?: typeof fetch;
}): Promise<{ foundItemIds: string[]; modelUsed: string }> {
  const {
    imageDataUrl,
    inventoryItems,
    configOverride,
    fetchImpl = fetch,
  } = params;

  if (!inventoryItems || inventoryItems.length === 0) {
    throw new RecognitionServiceError(
      'EMPTY_INVENTORY',
      'Your pantry inventory is currently empty. Add items to your checklist before scanning.',
    );
  }

  if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
    throw new RecognitionServiceError(
      'IMAGE_PROCESSING_ERROR',
      'The captured photo could not be encoded for analysis. Please retake the photo.',
    );
  }

  const envConfig = getOpenRouterConfig();
  const apiKey = (configOverride?.apiKey ?? envConfig.apiKey).trim();
  const model = (configOverride?.model ?? envConfig.model).trim();

  if (!apiKey) {
    throw new RecognitionServiceError(
      'MISSING_API_KEY',
      'OpenRouter API key is missing. Please set OPENROUTER_API_KEY in your .env file.',
    );
  }

  if (!model) {
    throw new RecognitionServiceError(
      'UNSUPPORTED_MODEL',
      'OpenRouter model ID is missing. Please configure OPENROUTER_MODEL in your .env file.',
    );
  }

  const requestBody = buildOpenRouterRequestBody(
    model,
    inventoryItems,
    imageDataUrl,
  );

  let response: Response;
  try {
    response = await fetchImpl(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pantrylens.app',
        'X-Title': 'PantryLens Android App',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : '';
    const safeMsg = redactSecrets(rawMsg, apiKey);
    throw new RecognitionServiceError(
      'NETWORK_ERROR',
      `Network connection failed. Please check your internet connection and try again.${
        safeMsg ? ` (${safeMsg})` : ''
      }`,
    );
  }

  let responseText = '';
  try {
    responseText = await response.text();
  } catch {
    throw new RecognitionServiceError(
      'NETWORK_ERROR',
      'Failed to read response from OpenRouter. Your inventory was not changed.',
    );
  }

  if (!response.ok) {
    let apiErrorMessage = '';
    try {
      const errorJson = JSON.parse(responseText);
      apiErrorMessage = redactSecrets(
        String(errorJson?.error?.message || errorJson?.message || ''),
        apiKey,
      );
    } catch {
      apiErrorMessage = redactSecrets(responseText.slice(0, 160), apiKey);
    }

    const lowerMsg = apiErrorMessage.toLowerCase();

    if (response.status === 401 || response.status === 403) {
      throw new RecognitionServiceError(
        'INVALID_API_KEY',
        'Invalid or unauthorized OpenRouter API key. Please check your credentials.',
      );
    }

    if (
      response.status === 402 ||
      lowerMsg.includes('credit') ||
      lowerMsg.includes('budget') ||
      lowerMsg.includes('insufficient')
    ) {
      throw new RecognitionServiceError(
        'INSUFFICIENT_CREDITS',
        'OpenRouter API credits or budget limit reached. Please check your OpenRouter account balance.',
      );
    }

    if (
      response.status === 404 ||
      (response.status === 400 &&
        (lowerMsg.includes('model') ||
          lowerMsg.includes('vision') ||
          lowerMsg.includes('image') ||
          lowerMsg.includes('structured') ||
          lowerMsg.includes('response_format') ||
          lowerMsg.includes('json_schema')))
    ) {
      throw new RecognitionServiceError(
        'UNSUPPORTED_MODEL',
        `The configured model ("${model}") is unavailable or does not support vision with structured JSON outputs.`,
      );
    }

    throw new RecognitionServiceError(
      'OPENROUTER_ERROR',
      apiErrorMessage
        ? `OpenRouter service error (${response.status}): ${apiErrorMessage}`
        : `OpenRouter request failed with status ${response.status}. Your inventory was not changed.`,
    );
  }

  let completionPayload: Record<string, unknown>;
  try {
    completionPayload = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    throw new RecognitionServiceError(
      'INVALID_JSON',
      'OpenRouter returned a malformed response payload. Your inventory remains unchanged.',
    );
  }

  // Check if OpenRouter returned an in-body error object
  if (completionPayload.error) {
    const errObj = completionPayload.error as {
      code?: number;
      message?: string;
    };
    const safeErr = redactSecrets(String(errObj?.message || ''), apiKey);
    if (
      errObj?.code === 402 ||
      safeErr.toLowerCase().includes('credit') ||
      safeErr.toLowerCase().includes('budget')
    ) {
      throw new RecognitionServiceError(
        'INSUFFICIENT_CREDITS',
        'OpenRouter API credits or budget limit reached.',
      );
    }
    throw new RecognitionServiceError(
      'OPENROUTER_ERROR',
      safeErr || 'OpenRouter returned an error while processing the image.',
    );
  }

  const choices = completionPayload.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new RecognitionServiceError(
      'MISSING_FIELDS',
      'OpenRouter response did not contain any completion choices. Your inventory remains unchanged.',
    );
  }

  const firstChoice = choices[0] as {
    message?: { content?: unknown };
  };
  const messageContent = firstChoice?.message?.content;

  if (typeof messageContent !== 'string') {
    throw new RecognitionServiceError(
      'MISSING_FIELDS',
      'OpenRouter response did not include text content. Your inventory remains unchanged.',
    );
  }

  const validInventoryIds = new Set(inventoryItems.map(item => item.id));
  const validatedIds = validateAndNormalizeRecognitionResponse(
    messageContent,
    validInventoryIds,
  );

  return {
    foundItemIds: validatedIds,
    modelUsed: model,
  };
}
