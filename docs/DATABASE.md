# Database Model - Student Deep Dive

This document explains the main database models and how they relate to each other.

## 1) Core Entities

- User
- Story
- Chapter
- Character
- Plotline
- StoryBible
- WorldRule
- GeneratedImage

## 1.5) User Settings Models

- **UserAiSettings** — per-user token limit overrides. One row per user (nullable columns = use system default). Editable via the Settings page.
- **UserApiKeys** — per-user external AI provider keys. One row per `(user, provider)`. Fields: `provider` (openai/anthropic/gemini), `api_key`, `preferred_model`, `is_active`. Only one provider can be `is_active=True` at a time; when active, all generation routes use that provider instead of Ollama.

## 2) Relationships (Conceptual)

- A User has many Stories.
- A Story has many Chapters, Characters, Plotlines, and Images.
- A Story has one StoryBible with many WorldRules.

## 3) Embedding Tables

Two tables store embeddings:

- StoryEmbedding (chapter chunks)
- CharacterEmbedding (character slices)

Each embedding is stored as an array of floats because pgvector is optional in this setup.

## 4) Why Store Embeddings in Postgres?

- Persistence across restarts
- Ability to inspect and debug values
- ChromaDB stores indexes for fast retrieval

## 5) Static Files

- Images: `backend/static/generated_images/`
- Uploads: `backend/static/uploads/`
- TTS audio (single): `backend/static/tts_audio/{uuid}.wav`
- Audiobook audio: `backend/static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav`

The DB stores only paths to image files. Audiobook audio existence is checked at request time via `Path.exists()`; no audio paths are stored in the database.

## 6) Exercises

1. Query all chapters for a story and compute total word count.
2. Find all images attached to a story.
3. Inspect a StoryEmbedding row and verify the chunk text.

## 7) Summary

The data model is designed to keep stories structured while allowing AI features like embeddings and images to attach cleanly.# Database Model - Deep Dive

This document describes the primary data models used by NarrativeFlow.

## Core Models

- User
- Story
- Chapter
- Character
- Plotline
- StoryBible
- WorldRule
- GeneratedImage

## User Settings Models

- **UserAiSettings** — per-user token limit overrides (one row per user, nullable fields fall back to system defaults)
- **UserApiKeys** — external AI provider keys per user; `(user_id, provider)` unique; `is_active=True` marks the chosen provider

## Embedding Models

- StoryEmbedding (chapter chunk vectors)
- CharacterEmbedding (character profile vectors)

## Storage Notes

- Embeddings are stored as float arrays in Postgres
- ChromaDB is used as a fast vector index

## Static Assets

- Generated images: `backend/static/generated_images/`
- Uploads: `backend/static/uploads/`
- TTS audio (single clips): `backend/static/tts_audio/{uuid}.wav`
- Audiobook audio: `backend/static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav`

Audiobook paths are not stored in the DB — the manifest endpoint checks file existence at request time.
