# Configuration - Student Deep Dive

This document explains the configuration values and how to reason about them.

## 1) Where Config Lives

- Backend: backend/app/config.py (Pydantic settings)
- Backend env: backend/.env
- Frontend env: frontend/.env.local

## 2) Core Backend Settings

- APP_NAME, APP_VERSION
- ENVIRONMENT (development, production)
- DEBUG (enables hot reload and extra logging)

## 3) Database Settings

- DATABASE_URL (async)
- DATABASE_URL_SYNC (sync)

These define where PostgreSQL lives. The async URL is used by FastAPI routes.

## 4) AI Settings — Local (Ollama)

These control the default local AI model:

- OLLAMA_BASE_URL (default: `http://localhost:11434`)
- OLLAMA_MODEL (default: `qwen2.5:7b`)

Ollama runs fully offline on your machine. No data leaves your computer.

## 4.5) AI Settings — External API Keys

Users can optionally configure a cloud AI provider instead of Ollama. This is done through the Settings page (no `.env` changes needed).

Supported providers and their key prefixes:

| Provider | Key prefix | Default model |
|----------|-----------|---------------|
| OpenAI | `sk-...` | `gpt-4o-mini` |
| Anthropic | `sk-ant-...` | `claude-3-5-haiku-latest` |
| Google Gemini | `AIza...` | `gemini-1.5-flash` |

Keys are stored in the database (`UserApiKeys` table) linked to the user account. Only one provider can be active at a time. When a provider is active, all generation routes use it instead of Ollama.

To revert to Ollama, deactivate the external key in Settings.

## 5) RAG Settings

- CHROMA_PERSIST_DIRECTORY
- EMBEDDING_MODEL (nomic-embed-text)
- EMBEDDING_DIMENSION (768)
- CHUNK_SIZE (default 1000)
- CHUNK_OVERLAP (default 200)

Guidance:

- Larger chunk size = fewer chunks, less precise retrieval.
- More overlap = better continuity but more storage.

## 6) Per-Feature Token Limits

These control output length and compute cost. All values are set in `.env` (or use the defaults in `config.py`). Per-user overrides are stored in the `UserAiSettings` database table and editable via the Settings page.

| Setting | Default | Notes |
|---------|---------|-------|
| MAX_TOKENS_STORY_GENERATION | 900 | Main chapter continuation |
| MAX_TOKENS_RECAP | 600 | Story recap |
| MAX_TOKENS_SUMMARY | 300 | Chapter summary |
| MAX_TOKENS_GRAMMAR | 600 | Grammar check |
| MAX_TOKENS_BRANCHING | 250 | Each branch option |
| MAX_TOKENS_STORY_TO_IMAGE_PROMPT | 250 | Visual prompt generation |
| MAX_TOKENS_IMAGE_TO_STORY | 600 | Image-to-story description |
| MAX_TOKENS_CHARACTER_EXTRACTION | 900 | Auto-extract characters |
| MAX_TOKENS_REWRITE | 500 | Rewrite selected text |
| MAX_TOKENS_STORY_BIBLE | 400 | Story bible generation |
| MAX_TOKENS_STORY_BIBLE_UPDATE | 300 | Incremental bible update |
| MAX_TOKENS_IMPORT_STORY | 2000 | Story import processing |
| MAX_TOKENS_DIALOGUE | 350 | Dialogue generation (backend only\*) |
| MAX_TOKENS_BRAINSTORM | 400 | Brainstorm (backend only\*) |

\* `MAX_TOKENS_DIALOGUE` and `MAX_TOKENS_BRAINSTORM` exist in the backend config and database but are not shown in the Settings UI.

Lower values are faster, but may truncate outputs.

## 7) Image Generation Settings

- SD_BASE_URL (Stable Diffusion WebUI)

If SD WebUI runs on a different host or port, update this value.

## 8) Frontend Settings

- NEXT_PUBLIC_API_URL

This points the frontend to the backend API base URL.

## 9) Exercises

1. Reduce `MAX_TOKENS_STORY_GENERATION` and observe the output length.
2. Increase `CHUNK_SIZE` and test RAG retrieval results.
3. Change `SD_BASE_URL` and verify image generation.

## 10) Summary

Configuration is the main control panel for performance and quality. Small changes here can greatly affect the user experience.# Configuration - Deep Dive

This document enumerates the key configuration values used by NarrativeFlow.

## Backend (.env)

Core:

- APP_NAME
- APP_VERSION
- ENVIRONMENT
- DEBUG

Database:

- DATABASE_URL
- DATABASE_URL_SYNC

AI:

- OLLAMA_BASE_URL — local Ollama server URL (default: http://localhost:11434)
- OLLAMA_MODEL — model name for local generation (e.g. qwen2.5:7b)
- GEMINI_MODEL, GEMINI_VISION_MODEL — legacy compat aliases for OLLAMA_MODEL

External API providers (configured via Settings UI, stored in DB — not in .env):

- OpenAI: key prefix `sk-`, default model `gpt-4o-mini`
- Anthropic: key prefix `sk-ant-`, default model `claude-3-5-haiku-latest`
- Google Gemini: key prefix `AIza`, default model `gemini-1.5-flash`
- Preferred model per provider is stored alongside the key and can be changed in Settings

RAG:

- CHROMA_PERSIST_DIRECTORY
- EMBEDDING_MODEL
- EMBEDDING_DIMENSION
- CHUNK_SIZE
- CHUNK_OVERLAP

Per-feature token limits (set in .env, overridable per-user via Settings — stored in `UserAiSettings` table):

- MAX_TOKENS_STORY_GENERATION (default 900)
- MAX_TOKENS_RECAP (default 600)
- MAX_TOKENS_SUMMARY (default 300)
- MAX_TOKENS_GRAMMAR (default 600)
- MAX_TOKENS_BRANCHING (default 250)
- MAX_TOKENS_STORY_TO_IMAGE_PROMPT (default 250)
- MAX_TOKENS_IMAGE_TO_STORY (default 600)
- MAX_TOKENS_CHARACTER_EXTRACTION (default 900)
- MAX_TOKENS_REWRITE (default 500)
- MAX_TOKENS_STORY_BIBLE (default 400)
- MAX_TOKENS_STORY_BIBLE_UPDATE (default 300)
- MAX_TOKENS_IMPORT_STORY (default 2000)
- MAX_TOKENS_DIALOGUE (default 350 — backend only, not shown in Settings UI)
- MAX_TOKENS_BRAINSTORM (default 400 — backend only, not shown in Settings UI)

Image generation:

- SD_BASE_URL (Stable Diffusion WebUI)

## Frontend (.env.local)

- NEXT_PUBLIC_API_URL
