declare const process: {
  env: {
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
  };
};

export const DEFAULT_OPENROUTER_MODEL = 'qwen/qwen3-vl-8b-instruct';

export interface OpenRouterEnvConfig {
  apiKey: string;
  model: string;
}

/**
 * Retrieves the OpenRouter configuration from environment variables (.env).
 * Never logs or exposes the API key.
 */
export function getOpenRouterConfig(): OpenRouterEnvConfig {
  const rawApiKey = process.env.OPENROUTER_API_KEY ?? '';
  const rawModel = process.env.OPENROUTER_MODEL ?? '';

  return {
    apiKey: rawApiKey.trim(),
    model: rawModel.trim() || DEFAULT_OPENROUTER_MODEL,
  };
}
