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

## 4) AI Settings

- OLLAMA_BASE_URL
- OLLAMA_MODEL

These control which local model is used for text generation.

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

These control output length and compute cost:

- MAX_TOKENS_STORY_GENERATION
- MAX_TOKENS_RECAP
- MAX_TOKENS_SUMMARY
- MAX_TOKENS_GRAMMAR
- MAX_TOKENS_BRANCHING
- MAX_TOKENS_STORY_TO_IMAGE_PROMPT
- MAX_TOKENS_IMAGE_TO_STORY
- MAX_TOKENS_CHARACTER_EXTRACTION
- MAX_TOKENS_REWRITE
- MAX_TOKENS_DIALOGUE
- MAX_TOKENS_BRAINSTORM
- MAX_TOKENS_STORY_BIBLE
- MAX_TOKENS_STORY_BIBLE_UPDATE

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

- OLLAMA_BASE_URL
- OLLAMA_MODEL
- GEMINI_MODEL (compat)
- GEMINI_VISION_MODEL (compat)

RAG:

- CHROMA_PERSIST_DIRECTORY
- EMBEDDING_MODEL
- EMBEDDING_DIMENSION
- CHUNK_SIZE
- CHUNK_OVERLAP

Per-feature token limits:

- MAX_TOKENS_STORY_GENERATION
- MAX_TOKENS_RECAP
- MAX_TOKENS_SUMMARY
- MAX_TOKENS_GRAMMAR
- MAX_TOKENS_BRANCHING
- MAX_TOKENS_STORY_TO_IMAGE_PROMPT
- MAX_TOKENS_IMAGE_TO_STORY
- MAX_TOKENS_CHARACTER_EXTRACTION
- MAX_TOKENS_REWRITE
- MAX_TOKENS_DIALOGUE
- MAX_TOKENS_BRAINSTORM
- MAX_TOKENS_STORY_BIBLE
- MAX_TOKENS_STORY_BIBLE_UPDATE

Image generation:

- SD_BASE_URL (Stable Diffusion WebUI)

## Frontend (.env.local)

- NEXT_PUBLIC_API_URL
