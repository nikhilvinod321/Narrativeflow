# AI Generation Pipeline - Student Deep Dive

This document explains how NarrativeFlow builds prompts, uses RAG context, and calls Ollama to generate text.

## 1) Key Components

- PromptBuilder: builds system/context/user prompts
- GeminiService: wraps Ollama API calls and dispatches to external providers
- ExternalAIService (`external_ai_service.py`): routes to OpenAI, Anthropic, or Google Gemini
- MemoryService: provides RAG context
- AI routes: `/api/ai/*` and `/api/ai-tools/*`

## 2) Prompt Structure

The prompt is built in three parts:

1. System prompt: rules and role instructions
2. Context: story overview, characters, plotlines, Narrative Codex, RAG results
3. User prompt: recent text + user direction + word target

Why this matters:

- System prompt sets the AI's role and tone.
- Context anchors the AI to known facts.
- User prompt tells the AI what to do next.

## 3) RAG Injection

RAG adds retrieved chunks labeled by source:

- [Previous Scene]
- [Character Info]
- [WORLD]

This reduces contradictions by giving the model verified facts.

## 4) Provider Dispatch

Every generation call goes through `GeminiService._dispatch(user_config, ...)`. The `user_config` is resolved per-user by `get_user_ai_config()` in `token_settings.py`:

```
user_config = {
    "provider": "ollama" | "openai" | "anthropic" | "gemini",
    "api_key": str | None,
    "model": str
}
```

- If `provider == "ollama"` (default), the request goes to the local Ollama server.
- Otherwise it goes to `ExternalAIService.generate_external()` which calls the appropriate cloud API.
- The active provider is determined by whether the user has set an API key with `is_active=True` in the database.

## 5) Ollama Request (Local / Offline)

When provider is `ollama`, GeminiService calls the local server:

- Endpoint: `{OLLAMA_BASE_URL}/api/generate`
- Payload includes:
  - `model` (resolved from runtime model name)
  - `prompt`
  - `options` (temperature, top_p, top_k, num_predict)

The response contains:

- `response` (generated text)
- token counts if supported

## 5.1) External Provider Requests (Cloud / API Key)

When an external provider is active, `external_ai_service.py` is called instead:

| Provider | API Endpoint | Auth | Default model |
|----------|-------------|------|---------------|
| OpenAI | `api.openai.com/v1/chat/completions` | Bearer `sk-...` | `gpt-4o-mini` |
| Anthropic | `api.anthropic.com/v1/messages` | `x-api-key: sk-ant-...` | `claude-3-5-haiku-latest` |
| Google Gemini | `generativelanguage.googleapis.com/...` | `?key=AIza...` | `gemini-1.5-flash` |

Available models per provider:

- **OpenAI**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Anthropic**: claude-opus-4-5, claude-sonnet-4-5, claude-3-5-sonnet-latest, claude-3-5-haiku-latest, claude-3-haiku-20240307
- **Gemini**: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash

The preferred model is stored per user in the `UserApiKeys` table and can be changed in Settings.

## 6) Streaming vs Non-Streaming

### Non-Streaming

- Single response after full generation.
- Easier to manage for smaller outputs.

### Streaming (SSE)

- Tokens are streamed as they arrive.
- UI can display partial text immediately.
- After streaming ends, content is saved to the chapter.

## 7) Feature-Specific Flows

### Rewrite

- Uses selected text + instructions.
- Output is a rewritten block of prose.

### Dialogue

- Uses a character profile and scene context.
- Ensures voice consistency.

### Brainstorm

- Produces multiple creative directions.

### Branching

- Generates multiple JSON options in parallel.
- Each branch contains title, description, tone, and preview.

### Summarize / Recap

- Uses tighter prompts and lower token caps.
- Returns structured summaries for quick reference.

## 8) Token Controls

All token limits are configurable in `.env` and can also be overridden per-user via the Settings page. Per-user overrides are stored in the `UserAiSettings` database table. If no override is set, the system-wide default from `config.py` is used.

| Setting | Default | Feature |
|---------|---------|--------|
| MAX_TOKENS_STORY_GENERATION | 900 | Chapter continuation |
| MAX_TOKENS_RECAP | 600 | Story recap |
| MAX_TOKENS_SUMMARY | 300 | Chapter summary |
| MAX_TOKENS_GRAMMAR | 600 | Grammar check |
| MAX_TOKENS_BRANCHING | 250 | Each branch option |
| MAX_TOKENS_REWRITE | 500 | Rewrite selection |
| MAX_TOKENS_STORY_TO_IMAGE_PROMPT | 250 | Visual prompt |
| MAX_TOKENS_IMAGE_TO_STORY | 600 | Image description |
| MAX_TOKENS_CHARACTER_EXTRACTION | 900 | Auto-extract characters |
| MAX_TOKENS_STORY_BIBLE | 400 | Bible generation |
| MAX_TOKENS_STORY_BIBLE_UPDATE | 300 | Incremental bible update |
| MAX_TOKENS_IMPORT_STORY | 2000 | Story import |
| MAX_TOKENS_DIALOGUE | 350 | Dialogue (backend only) |
| MAX_TOKENS_BRAINSTORM | 400 | Brainstorm (backend only) |

Why this matters: token caps directly control latency and cost (or local compute usage). Caps for Dialogue and Brainstorm exist in the backend but are not exposed in the Settings UI.

## 9) Common Pitfalls

- Too much context can drown out the user prompt.
- Too little context increases contradictions.
- Very low token caps can cut off sentences.
- High temperature can harm continuity.

## 10) Exercises

1. Compare outputs using different temperature values.
2. Reduce token caps and observe truncation.
3. Remove RAG context and observe consistency drift.
4. Configure an OpenAI API key in Settings, generate a chapter, then switch back to Ollama and compare outputs.

## 11) Summary

The AI pipeline is a carefully structured chain: build prompts, inject context, dispatch to the active provider (local Ollama or a cloud API), and return output with proper limits. The provider is hot-swappable per user — no server restart required.
