# Backend Architecture - Student Deep Dive

This document explains the backend from a student perspective, focusing on structure, flow, and responsibilities.

## 0) Learning Goals

- Understand how FastAPI routes map to services.
- Learn how async DB sessions work.
- See how background tasks are used.

## 1) Entry Point

- File: backend/app/main.py
- Creates the FastAPI app, configures CORS, mounts static files, and includes routers.

## 2) Router Structure

Routers are organized by domain:

- auth
- stories
- chapters
- characters
- plotlines
- story_bible
- ai_generation
- ai_tools
- memory
- export
- images

This organization keeps API endpoints discoverable and maintainable.

## 3) Services Layer

Services are responsible for business logic. The router should be thin and delegate to services.

Key services include:

- GeminiService: Ollama text generation
- MemoryService: RAG chunking, embeddings, retrieval
- ConsistencyEngine: rule-based and AI consistency checks
- Image services: Stable Diffusion WebUI and SD-Turbo
- TTS service: Kokoro and Edge fallback
- CRUD services for story, chapter, character

## 4) Async Database Sessions

The backend uses SQLAlchemy async sessions. Each request gets a session via dependency injection. This ensures:

- Safe concurrency
- Automatic cleanup after request

## 5) Background Tasks

Some operations are heavy and run in the background:

- Embedding a chapter after generation
- Updating the story bible after chapter edits

This prevents the UI from waiting too long on expensive tasks.

## 6) Static Files

The backend serves:

- Images in `static/generated_images`
- Uploaded images in `static/uploads`
- Audio in `static/tts_audio`

These are mounted under `/static` for easy access by the frontend.

## 7) Error Handling

- Uses HTTPException with status codes
- Logs errors for debugging
- Returns clear messages for client UI

## 8) Exercises

1. Add a new endpoint and a matching service method.
2. Write a background task that runs after chapter save.
3. Add a new router group and mount it in main.py.

## 9) Summary

The backend is a classic service-oriented FastAPI app with async DB access, background tasks, and clear separation between routes and logic.# Backend Architecture - Deep Dive

This document covers the backend structure and operational flow.

## 1) FastAPI Application

- Entry: backend/app/main.py
- Routers: auth, stories, chapters, characters, plotlines, story_bible, ai_generation, ai_tools, memory, export, images
- Static files are served from /static

## 2) Services Layer

- PromptBuilder: builds prompts for AI generation
- GeminiService: Ollama text generation wrapper
- MemoryService: chunking, embedding, retrieval
- ConsistencyEngine: rule-based + AI checks
- Image services: Stable Diffusion WebUI and SD-Turbo
- TTS service: Kokoro and Edge

## 3) Data Access

- SQLAlchemy async sessions
- CRUD services per model

## 4) Background Tasks

- Chapter embedding updates
- Story bible updates after chapter edits

## 5) Error Handling

- HTTP exceptions with explicit status codes
- Logging for API errors and AI failures
