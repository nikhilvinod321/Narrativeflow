# Installation Guide (Student Edition)

This guide walks you through a full local setup of NarrativeFlow with explanations for each step.

## 0) Learning Goals

- Understand why each dependency is required.
- Set up the backend, frontend, and AI services.
- Verify each subsystem with a quick check.

## 1) Prerequisites

Install these first:

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Ollama (for local LLM + embeddings)

Optional (for extra features):

- Stable Diffusion WebUI (for image generation)
- Kokoro model files (for local TTS)

## 2) Clone the Project

```
cd <your-workspace>
git clone <repository-url>
cd Narrativeflow2
```

## 3) Backend Setup

### 3.1 Create a Virtual Environment

```
cd backend
python -m venv venv
venv\Scripts\activate
```

### 3.2 Install Dependencies

```
pip install -r requirements.txt
```

### 3.3 Configure Environment

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/narrativeflow
DATABASE_URL_SYNC=postgresql://user:password@localhost:5432/narrativeflow

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

CHROMA_PERSIST_DIRECTORY=./chroma_db
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=768
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### 3.4 Setup PostgreSQL

```
createdb narrativeflow
psql -d narrativeflow -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Note: pgvector is optional in this codebase, but recommended for future performance.

### 3.5 Start Backend

```
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify:

- Open `http://localhost:8000/health`

## 4) Ollama Setup

Install Ollama, then pull models:

```
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

Verify:

```
ollama run qwen2.5:7b "Hello"
```

## 5) Frontend Setup

```
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run the frontend:

```
npm run dev
```

Verify:

- Open `http://localhost:3000`

## 6) Optional: Image Generation

### 6.1 Stable Diffusion WebUI (Automatic1111)

1. Install WebUI: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Run with API enabled:

```
python launch.py --api
```

Default URL: `http://localhost:7860`

### 6.2 SD-Turbo (Diffusers)

This is included in requirements. If you want the SD-Turbo pipeline, install:

```
pip install diffusers transformers accelerate torch onnxruntime-directml
```

## 7) Optional: Text-to-Speech (Kokoro)

Download Kokoro model files into `backend/`:

- kokoro-v1.0.onnx
- voices-v1.0.bin

After placing them, TTS will use Kokoro locally. If not found, it falls back to Edge TTS.

## 8) Quick Verification Checklist

- Backend health: `/health` returns status
- Ollama: `ollama run qwen2.5:7b` works
- Embeddings: `ollama pull nomic-embed-text` installed
- Frontend: page loads at `localhost:3000`
- Image generation: `/api/ai/image/status` shows available (if SD is running)
- TTS: `/api/ai/tts/status` shows available backends

## 9) Common Errors

- Backend fails to start: check `.env` DB URLs and database status
- Images not generating: SD WebUI not running or wrong base URL
- TTS missing: Kokoro files not found, Edge TTS blocked
- CORS errors: confirm `NEXT_PUBLIC_API_URL` and backend CORS settings

## 10) Next Steps

- Read docs/ARCHITECTURE.md for system overview
- Read docs/RAG.md for memory system details
- Try generating a short story and saving images
