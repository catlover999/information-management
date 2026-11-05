# AI Usage & OpenRouter Vision Integration (`AI_USAGE.md`)

## 1. Runtime AI Provider & Endpoint

PantryLens integrates directly with **OpenRouter** from the React Native mobile client using the standard OpenRouter Chat Completions API:

- **Provider**: [OpenRouter](https://openrouter.ai/)
- **Endpoint**: `POST https://openrouter.ai/api/v1/chat/completions`
- **Service Implementation**: [`src/services/openRouterService.ts`](./src/services/openRouterService.ts)
- **Environment Configuration**: [`src/config/env.ts`](./src/config/env.ts) & [`babel.config.js`](./babel.config.js)

### Environment Variables (`.env`)

Credentials and model selection are configured through the project's `.env` file and injected at bundle time via `babel.config.js` (`inlineDotEnvPlugin`):

```dotenv
OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=qwen/qwen3-vl-8b-instruct
```

> **Security Note (Proof-of-Concept)**:
> Because PantryLens calls OpenRouter directly from the mobile application without an intermediate backend or proxy, the API key is bundled into the client application and could be extracted from a compiled APK. This architecture is intended strictly for a limited-budget proof-of-concept and should not be treated as production-secure. The application redacts the API key from all error messages and never logs it.

---

## 2. Configured Vision Model (`OPENROUTER_MODEL`)

- **Default / Configured Model**: `qwen/qwen3-vl-8b-instruct`
- **Verification**: Queried against OpenRouter's live `/api/v1/models` catalog and verified to support both:
  1. **Multimodal image input**: `architecture.input_modalities` includes `"image"` and `"text"`.
  2. **JSON Schema Structured Outputs**: `supported_parameters` includes `"response_format"` and `"structured_outputs"`.
- **Cost Efficiency**: Low-cost open-weight vision-language model ($0.25 / 1M input tokens, $0.75 / 1M output tokens), ideal for operating within a strict $5 API budget.
- **Configurability**: Changing `OPENROUTER_MODEL` in `.env` switches the active vision model without code changes.

---

## 3. Image Recognition Workflow

1. **Photo Capture (`ScanScreen.tsx`)**:
   - The user opens the **Scan** tab, frames their pantry supplies, and taps the shutter button to capture a photo using `react-native-vision-camera`.
   - Capturing a photo **never** triggers an automatic API request; the user first reviews the captured photo preview.
2. **Client-Side Compression & Base64 Encoding (`src/utils/imageProcessor.ts`)**:
   - When the user explicitly taps **"Identify Items"**, the captured image is loaded via `react-native-nitro-image` (`Images.loadFromFileAsync`).
   - If either dimension exceeds `768px`, the image is proportionally resized so the longest edge is `768px` (`resizeAsync`).
   - The resized image is compressed to JPEG (`quality: 72`) via `toEncodedImageDataAsync('jpg', 72)` and encoded into a base64 data URL (`data:image/jpeg;base64,...`).
   - This keeps payload sizes small (~40–90 KB) and minimizes token usage.
3. **OpenRouter Multimodal Request (`src/services/openRouterService.ts`)**:
   - Retrieves the current inventory from application state (`InventoryContext`) and maps each item to `{ id, name }`.
   - Sends the system/user recognition instruction, the JSON-serialized inventory list (`id` and `name`), and the `image_url` data URL in a single `POST` request to `https://openrouter.ai/api/v1/chat/completions`.
   - Duplicate simultaneous requests are blocked via both React state and a synchronous `useRef` lock (`isIdentifyingRef`).
4. **Validation & Checklist Synchronization (`src/hooks/useInventory.ts`)**:
   - The response is parsed and strictly validated (`validateAndNormalizeRecognitionResponse`):
     - Must be a valid JSON object containing only `foundItemIds: string[]`.
     - Every returned ID must exist in the current inventory checklist; any unknown ID or malformed payload is rejected immediately.
     - Duplicate IDs are deduplicated while preserving order.
   - Only after validation succeeds does `applyRecognizedItems` update the inventory:
     - Items whose IDs appear in `foundItemIds` are marked `checked: true`.
     - All other inventory items are marked `checked: false`.
     - All item names, IDs, categories, storage locations, expiry dates, notes, and custom drag-and-drop ordering are preserved and persisted to `AsyncStorage`.
   - If any network, API, or validation error occurs, the existing inventory remains completely untouched and a themed error message is shown.

---

## 4. Structured JSON Outputs (`response_format`)

Every recognition request enforces OpenRouter Structured Outputs using `response_format` with `strict: true`:

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "pantry_recognition",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "foundItemIds": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": ["foundItemIds"],
      "additionalProperties": false
    }
  }
}
```

Expected model output:

```json
{
  "foundItemIds": [
    "item-001",
    "item-002"
  ]
}
```

---

## 5. AI Coding Tools & Models Used During Development

- **AI Coding Assistant**: Google DeepMind **Antigravity** agentic coding assistant (pair-programming environment used to architect, implement, test, and verify Phase 1 and Phase 2 of PantryLens).
