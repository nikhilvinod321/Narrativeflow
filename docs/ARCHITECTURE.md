# System Architecture - Student Deep Dive

This document explains the full system architecture in a learning-oriented way. It focuses on how data flows through the app and why the architecture is structured this way.

## 0) Learning Goals

You should be able to:

- Explain the client-server model used here.
- Trace a user action from UI to database and back.
- Identify which service owns which responsibility.
- Understand how AI services are integrated.

## 1) The Big Picture

NarrativeFlow is a web app with three major layers:

1. Frontend (Next.js) - user interface
2. Backend (FastAPI) - business logic and APIs
3. Data + AI services - PostgreSQL, ChromaDB, Ollama, Stable Diffusion

At a high level, the browser calls the FastAPI backend. The backend talks to databases and local AI services, then returns results to the browser.

## 2) High-Level Diagram

```
Browser (Next.js UI)
        |
        v
FastAPI API layer
        |
        +--> PostgreSQL (core data)
        |
        +--> ChromaDB (vector retrieval)
        |
        +--> Ollama (text + embeddings)
        |
        +--> SD WebUI / SD-Turbo (images)
        |
        +--> TTS (Kokoro / Edge)
```

## 3) Backend Responsibilities

### 3.1 API Layer

Routers are grouped by domain:

- stories, chapters, characters, plotlines
- story_bible
- ai_generation and ai_tools
- memory (RAG)
- export and images

Each router validates requests, enforces permissions, and calls services.

### 3.2 Service Layer

The service layer handles logic and integrates AI models:

- PromptBuilder assembles prompts.
- GeminiService calls Ollama.
- MemoryService handles RAG (chunking, embeddings, retrieval).
- ConsistencyEngine runs rule-based and AI checks.
- Image services integrate Stable Diffusion or SD-Turbo.
- TTS service generates audio.

### 3.3 Data Layer

- PostgreSQL stores structured data (stories, chapters, characters, plotlines, images).
- ChromaDB stores vector indexes for fast semantic search.
- Static files store generated images and audio.

## 4) Frontend Responsibilities

The frontend is responsible for:

- Rendering the editor (TipTap)
- Managing UI state (Zustand)
- Calling API endpoints
- Showing feature modals (branching, image generation, TTS)

Key routes:

- `/stories/[id]` for the editor
- `/stories/[id]/gallery` for images
- `/stories/[id]/characters` and `/stories/[id]/bible`

## 5) Example Data Flow (Story Continuation)

1. User clicks Generate.
2. Frontend calls `/api/ai/generate`.
3. Backend loads story, chapter, characters, plotlines, story bible.
4. RAG retrieval pulls context from ChromaDB.
5. PromptBuilder assembles prompt.
6. GeminiService calls Ollama and returns text.
7. Chapter is updated and embeddings refreshed.
8. Response is sent back to UI.

## 6) Example Data Flow (Image Generation)

1. User opens Story-to-Image modal and submits text.
2. Backend builds a visual prompt.
3. Stable Diffusion WebUI generates the image.
4. Image is saved to `/static/generated_images`.
5. Path and base64 are returned to UI.
6. User can save it to the gallery (metadata stored in DB).

## 7) Why This Architecture Works for Learning

This architecture is a common pattern in production web apps:

- Clear separation between UI and backend.
- Services isolate complex logic.
- Databases store durable data; vector stores handle semantic search.
- AI models are treated as external services with well-defined inputs and outputs.

## 8) Exercises

1. Trace a request from the UI to the DB for a chapter save.
2. Trace a RAG retrieval from query to prompt.
3. Identify where token limits are enforced.

## 9) Summary

NarrativeFlow uses a classic layered architecture with clear boundaries. This makes it easier to scale, debug, and teach, because each part has a single responsibility.# System Architecture

This document describes the NarrativeFlow architecture, including backend services, frontend modules, data flow, AI integrations, and storage.

## 1) High-Level Overview

NarrativeFlow is a client-server web application:

- Frontend: Next.js 14 (App Router) with TipTap editor
- Backend: FastAPI (async) with SQLAlchemy + PostgreSQL
- AI Models: Ollama for text and embeddings, Stable Diffusion for images, Kokoro/Edge for TTS
- Vector Store: ChromaDB for RAG retrieval

## 2) Backend Architecture

### 2.1 FastAPI App

- App entry: backend/app/main.py
- Routers grouped by domain: stories, chapters, characters, plotlines, story_bible, ai_generation, ai_tools, memory, export, images
- Static files served from /static (generated images and TTS audio)

### 2.2 Services Layer

Key services:

- GeminiService: Ollama wrapper for text generation, summaries, story bible, character extraction
- MemoryService: chunking, embedding, Chroma storage, retrieval
- ConsistencyEngine: rule-based checks + AI analysis
- ImageGenerationService: Stable Diffusion WebUI integration
- GhibliImageService: SD-Turbo diffusers pipeline with style presets
- TTSService: Kokoro ONNX + Edge fallback
- StoryService / ChapterService / CharacterService: core CRUD and helpers

### 2.3 Persistence

- PostgreSQL stores primary entities and embedding arrays
- ChromaDB stores vector indexes per story
- Static files stored in backend/static:
  - generated_images
  - uploads
  - tts_audio

## 3) Frontend Architecture

### 3.1 Editor Page

- Route: frontend/src/app/stories/[id]/page.tsx
- Composition:
  - Sidebar navigation
  - StoryEditor (TipTap) + EditorToolbar
  - RightPanel for AI tools
  - Feature modals (Branching, Story-to-Image, Image-to-Story, TTS)

### 3.2 TipTap Editor

- Extensions: StarterKit, Typography, Highlight, TextStyle, FontFamily, ResizableImage
- Content stored as HTML and sent to backend
- Selection state supports rewrite and quick actions

### 3.3 Reader and Preview

- BookReader uses HTMLFlipBook for page turning
- Preview renders the same HTML content
- Print uses an iframe and waits for image loads

## 4) AI Data Flow

### 4.1 Text Generation

1. Frontend collects user direction and word target
2. Backend loads story, chapter, characters, plotlines, story bible
3. MemoryService retrieves RAG context
4. PromptBuilder assembles system + context + user prompts
5. GeminiService sends prompt to Ollama
6. Response appended to chapter, embeddings updated

### 4.2 Streaming Generation

- SSE endpoint streams tokens as they arrive
- Client appends text live
- Chapter saved after generation completes

### 4.3 Recap and Tools

- Recap builds a summary prompt from story state
- Grammar check expects JSON output and parses responses
- Summarize uses a targeted system prompt

## 5) RAG Pipeline (Summary)

- Chunking by scenes and paragraphs
- Metadata extraction (characters, scene type, tone, importance)
- Embeddings via Ollama (nomic-embed-text, 768 dims)
- Storage in Postgres and Chroma
- Retrieval with cosine similarity and filters
- Prompt injection with source tags

(See docs/RAG.md for full details.)

## 6) Image Generation Pipeline

### 6.1 Story-to-Image

1. Backend builds a detailed visual prompt
2. If image generation enabled, Stable Diffusion WebUI is called
3. Image saved to static/generated_images
4. Response includes base64 and file path

### 6.2 Character Portraits

- Uses character attributes to build prompts
- Stores and reuses seeds for visual consistency

### 6.3 Ghibli / Styled Generation

- Uses diffusers SD-Turbo pipeline
- Style presets add prompt and negative prompt modifiers
- Optimized for low VRAM with 4 steps and guidance 0

## 7) Export Pipeline

- HTML cleaned via BeautifulSoup
- Images resolved to /static and embedded
- DOCX uses python-docx
- PDF uses ReportLab
- EPUB uses ebooklib
- Markdown/Text strip HTML

## 8) Auth and Security

- JWT-based auth
- Per-story authorization checks on all protected endpoints
- CORS configured for local development

## 9) Configuration and Environments

- Backend .env config via Pydantic Settings
- Per-feature token limits for all AI actions
- Frontend uses NEXT_PUBLIC_API_URL for API base

## 10) Scaling Considerations

- Ollama and SD are local services; scale by separating into their own hosts
- ChromaDB persistence can be moved to shared storage
- Large generations should use streaming to reduce latency
- Embedding refresh can be moved to background tasks
