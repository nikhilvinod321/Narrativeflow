# Installation Guide (Student Edition)

This guide walks you through a full local setup of NarrativeFlow with explanations for each step.

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

### Ollama — Recommended Models

Ollama runs offline; pick a model that fits your VRAM:

| Model | VRAM | Notes |
|-------|------|-------|
| llama3.2 | ~3 GB | Best small model |
| mistral | ~4 GB | Strong all-rounder |
| llama3.1:8b | ~5 GB | Good quality |
| qwen2.5:7b (default) | ~5 GB | Strong, good context |
| qwen2.5:14b | ~9 GB | High quality |

## 4.5) Alternative: Cloud AI API Keys

If you don't want to run Ollama locally, you can use a cloud AI provider instead.
API keys are configured through the **Settings page** after you log in — no `.env` changes needed.

Supported providers:

| Provider | Key prefix | Where to get one |
|----------|-----------|------------------|
| OpenAI | `sk-...` | https://platform.openai.com/api-keys |
| Anthropic | `sk-ant-...` | https://console.anthropic.com/ |
| Google Gemini | `AIza...` | https://aistudio.google.com/app/apikey |

Once saved in Settings, NarrativeFlow automatically detects the provider from the key prefix and uses that provider for all story generation. Only one provider is active at a time; deactivating it reverts to Ollama.

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

## 7.1) MP3 Export Support

`lameenc` is included in `requirements.txt` and is installed automatically with `pip install -r requirements.txt`.

No extra steps are needed. It provides in-process WAV→MP3 conversion for the audiobook export feature without requiring ffmpeg or any system-level binaries.

To verify:

```
python -c "import lameenc; print(lameenc.__version__)"
```

## 8) Quick Verification Checklist

- Backend health: `/health` returns status
- Ollama: `ollama run qwen2.5:7b` works
- Embeddings: `ollama pull nomic-embed-text` installed
- Frontend: page loads at `localhost:3000`
- Image generation: `/api/ai/image/status` shows available (if SD is running)
- TTS: `/api/ai/tts/status` shows available backends
- MP3 support: `python -c "import lameenc"` succeeds
- Audiobook export: `GET /api/audiobook/{story_id}/export?format=mp3` returns a ZIP
- Terms page: `localhost:3000/terms` loads
- Privacy page: `localhost:3000/privacy` loads
- Setup guide: visible on the `localhost:3000` home page under the "Setup Guide" nav link

## 9) Common Errors

- Backend fails to start: check `.env` DB URLs and database status
- Images not generating: SD WebUI not running or wrong base URL
- TTS missing: Kokoro files not found, Edge TTS blocked
- CORS errors: confirm `NEXT_PUBLIC_API_URL` and backend CORS settings

## 10) Next Steps

- Read docs/ARCHITECTURE.md for system overview
- Read docs/RAG.md for memory system details
- Try generating a short story and saving images
