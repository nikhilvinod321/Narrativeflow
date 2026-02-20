# NarrativeFlow - Interactive AI Story Co-Writing Platform

A production-grade web application for writing novels, screenplays, and episodic fiction with an AI partner. NarrativeFlow combines a rich TipTap editor, long-term memory with RAG, consistency checks, multi-modal generation (text, image, TTS), audiobook export, and production-ready export/print workflows. The backend is FastAPI + PostgreSQL, and local AI models are used via Ollama and Stable Diffusion. Cloud AI providers (OpenAI, Anthropic, Google Gemini) are also supported via user-configured API keys.

## Table of Contents

- Features and how they work
- Editor (TipTap)
- AI generation pipeline
- Multi-provider AI (Ollama + cloud)
- RAG system and embedding algorithm
- Consistency engine
- Image generation and gallery
- Text-to-speech and Audiobook export
- Light / dark mode
- Preview, BookReader, and print
- Export system
- API endpoints
- Configuration and token controls
- [docs/INSTALLATION.md](docs/INSTALLATION.md)
- Setup and running

## Features and How They Work

### Core Story Management

- Multi-story dashboard with CRUD for stories and chapters.
- Each story stores genre, tone, POV, tense, writing style, and word count for prompt construction.
- Characters and plotlines are first-class models; Narrative Codex stores world rules and lore.
- Chapters are saved as HTML from the editor (TipTap) and rendered back into preview and export flows.

### AI-Assisted Writing

- Continuation generation uses a structured prompt composed from story metadata, active plotlines, character profiles, Narrative Codex rules, recent chapter content, and RAG-retrieved context.
- Generation settings use tuned temperature/top-p/top-k values in the Ollama request.
- Streaming generation uses Server-Sent Events (SSE) and appends to the chapter once complete.
- Quick actions: rewrite and summarize are triggered from the right panel. Rewrite uses the selected text and instructions. Summarize returns a compact summary string (shown in the recap modal in the current UI).
- Dialogue and brainstorming tools generate voice-consistent dialogue and multiple creative directions for the next scene.
- Recap generates a structured overview of events, character states, and unresolved threads.
- Grammar and style checks return JSON with issues (type, severity, location, suggestion) and strengths.

### Story Branching

- Generates multiple possible next paths in parallel with tone variation (tense, romantic, mysterious, etc.).
- Each branch is a JSON object containing a title, description, tone, and preview (actual story prose).
- Preview length is controlled by a word target per branch and capped by a token limit.

### Character Tools

- Character extraction uses AI to parse story content and return structured JSON.
- Character analysis compares a character profile against current content and flags voice or behavior drift.
- Character image prompts can be saved with a seed for visual consistency across generations.

### Image Generation

- Story-to-image: the backend builds a detailed image prompt from story content and style preferences, then optionally calls local Stable Diffusion to generate an image and returns both the prompt and image.
- Image-to-story: upload an image and generate story passages inspired by it.
- Character portrait generation builds prompts from character attributes, then optionally generates a portrait and stores the seed.
- Scene image generation builds prompts from description, setting, mood, time-of-day, and character summaries.
- Ghibli-style generation uses SD-Turbo (diffusers) with style presets and optional DirectML acceleration for low-VRAM systems.
- The image gallery saves generated images with metadata, tags, and story linkage.

### Text-to-Speech (TTS) and Audiobook

- Primary backend: Kokoro-82M onnx model for local TTS.
- Fallback backend: Edge TTS for environments without Kokoro.
- Supports voice selection, speed control, and language hints.
- **Audiobook feature**: generates TTS audio per chapter stored at a deterministic path (`static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav`).
- Download individual chapters as WAV or MP3 (via `lameenc` — pure Python, no ffmpeg required).
- Export all chapters as a ZIP archive in WAV or MP3 format.
- Frontend Audiobook modal: voice picker, WAV/MP3 format selector, per-chapter download list with individual generate/download buttons, and "All Chapters ZIP" export.

### Preview, BookReader, and Print

- Preview mode renders editor HTML into a read-only view.
- BookReader uses HTMLFlipBook to paginate content with a text-height heuristic and renders a page-flip UI.
- Print uses a hidden iframe and waits for images to load before triggering `print()`, so images are reliably included.

### Export System

- Export formats: DOCX, EPUB, PDF, Markdown, Text, JSON, Outline.
- HTML is cleaned using BeautifulSoup before conversion.
- Image sources are resolved against `/static` and embedded in EPUB/PDF/DOCX.
- Markdown and text exports strip HTML and preserve paragraph structure.

## Editor (TipTap)

The editor is implemented in `StoryEditor.tsx` using TipTap with the following configuration:

- Extensions: StarterKit, Placeholder, CharacterCount, Typography, Highlight, TextStyle, FontFamily, and a custom ResizableImage extension.
- Word count and character count are displayed in a sticky footer using TipTap character count storage.
- Selection tracking is exposed to enable quick actions and rewrite flows.
- Images can be inserted via URL or uploaded to the backend. Uploaded images are stored in `/static/uploads` and inserted with the correct URL.
- The toolbar includes: bold/italic/strike, headings (h1-h3), blockquote, lists, horizontal rule, highlight, font family picker, undo/redo, and image insert modal.

Auto-save flow:

- The editor emits `onUpdate` with HTML content.
- The page layer triggers `api.updateChapter()` for persistence.
- Ctrl/Cmd+S triggers a save action.

## AI Generation Pipeline

### Prompt Construction

Prompt assembly happens in `PromptBuilder` and is segmented into:

- System prompt derived from story configuration and generation constraints.
- Context: story overview, character profiles, active plotlines, Narrative Codex rules, and RAG-retrieved context.
- User prompt: recent chapter content and user direction with word target.

The prompt builder also uses soft budget hints for context sections (character, plot, world rules, recent content, retrieved memory) to keep prompts under control.

### Generation Call

- `GeminiService` resolves the active AI provider per user via `get_user_ai_config()`. If no external key is active, it calls Ollama locally.
- For Ollama: sends POST to `{OLLAMA_BASE_URL}/api/generate` with `model`, `prompt`, `stream`, and `options`.
- For cloud providers: delegates to `ExternalAIService` which calls the appropriate REST API.
- Options include `temperature`, `top_p`, `top_k`, and `num_predict` (token cap).
- Generation results include `tokens_used` and `generation_time_ms` where supported.

## Multi-Provider AI (Ollama + Cloud)

NarrativeFlow supports two AI modes that can be switched at any time from the Settings page, no server restart required:

### Ollama (Default — Local / Offline)

- Runs fully on your machine. No data leaves your computer.
- Configure `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `.env`.
- Recommended models: `llama3.2` (3 GB), `mistral` (4 GB), `qwen2.5:7b` (5 GB), `qwen2.5:14b` (9 GB).

### Cloud API Keys (OpenAI / Anthropic / Gemini)

Users can add an API key in **Settings → AI Provider**. The provider is detected from the key prefix:

| Provider | Key prefix | Default model |
|----------|-----------|---------------|
| OpenAI | `sk-...` | `gpt-4o-mini` |
| Anthropic | `sk-ant-...` | `claude-3-5-haiku-latest` |
| Google Gemini | `AIza...` | `gemini-1.5-flash` |

- Keys are stored in the `user_api_keys` database table, per user.
- Only one provider can be active at a time. Deactivating reverts to Ollama.
- Keys are never transmitted to NarrativeFlow servers — only to the selected provider's API.
- The preferred model per provider can be changed from the Settings page.

### Token Control (Per Feature)

Token caps are configurable via environment variables and enforced per feature (story generation, recap, summary, grammar, branching, story-to-image prompt, image-to-story, character extraction, rewrite, dialogue, brainstorming, Narrative Codex). See Configuration section for exact env names.

## RAG System and Embedding Algorithm

The RAG (Retrieval-Augmented Generation) system is implemented in `MemoryService` and is used to provide long-term narrative memory.

### 1) Chunking Algorithm

- The chapter content is split into semantic chunks using scene breaks and paragraphs.
- Scene breaks are detected using a regex for `***`, `---`, `___`, or `###` style separators.
- Paragraphs are merged into chunks up to `chunk_size` characters (default: 1000).
- Each chunk overlaps the previous chunk by `chunk_overlap` characters (default: 200) for continuity.

Output per chunk:

- `text`: chunk content
- `start` and `end` character offsets in the original chapter

### 2) Metadata Extraction

For each chunk, the system extracts:

- Characters mentioned (string match against known character names)
- Scene type using regex patterns (dialogue, action, description, introspection, flashback, revelation)
- Emotional tone using keyword heuristics (tense, sad, happy, angry, mysterious, romantic)
- Importance score (1-10) based on presence of characters, scene type, and action/revelation cues
- Key events using simple heuristic patterns (e.g., "X died", "the Y exploded")

### 3) Embedding Generation

Embeddings are generated via Ollama's embedding API:

- Endpoint: `POST /api/embeddings`
- Model: `nomic-embed-text`
- Dimension: 768

Each chunk is embedded and stored. The embedding is stored as a float array in Postgres (`ARRAY(Float)`), and as a vector in ChromaDB for fast similarity search.

### 4) Storage

Two storage layers are used:

- PostgreSQL (tables `story_embeddings` and `character_embeddings`) for persistence.
- ChromaDB (PersistentClient) for fast similarity search with HNSW and cosine distance.

Chroma collections:

- `story_{story_id}` for chapter chunks
- `story_{story_id}_characters` for character profile slices
- `story_{story_id}_bible` for Narrative Codex entries

### 5) Retrieval

- A query string is embedded with the same model.
- ChromaDB is queried with cosine distance and optional filters (exclude chapter, content type, minimum importance).
- Distances are converted to scores: `score = 1 - distance`.
- Results are returned with content, score, and metadata.

### 6) Multi-Source RAG Assembly

`retrieve_all_relevant_context()` runs three retrievals in parallel:

- Chapter context (episodic memory)
- Character context (profile/backstory/voice)
- Narrative Codex context (world rules, locations, glossary, themes)

The result is injected into the prompt with source tags:

- `[Previous Scene] ...`
- `[Character Info] ...`
- `[WORLD] ...`

### 7) Embedding Lifecycle

- Embeddings are created when chapters are generated or explicitly embedded.
- Embeddings are refreshed when a chapter is updated.
- Memory retrieval is used during generation and recap building.

## Consistency Engine

Consistency analysis combines rule-based heuristics and AI evaluation:

- Character behavior and speaking style checks
- POV and tense consistency checks
- World rule and timeline checks
- Tone drift detection

The AI-backed deep analysis provides structured issues with severity and suggestions.

## Image Generation and Gallery

### Stable Diffusion WebUI (Automatic1111)

- Base URL is configurable (default: `http://localhost:7860`).
- Images are generated via `/sdapi/v1/txt2img`.
- Generated images are saved to `static/generated_images` and returned as base64 plus file path.
- Style presets add extra descriptive tokens (anime, photorealistic, fantasy, etc.).

### SD-Turbo Styled Generation

- SD-Turbo is loaded via diffusers for fast generation.
- Styles are defined as prompt + negative prompt pairs.
- Default settings: 4 steps, guidance scale 0, 512x512.

### Gallery Storage

- Gallery saves the generated image path, metadata, prompt, seed, style, and tags.
- Images are linked to stories and optionally to characters.

## Text-to-Speech

- Backend supports multiple TTS backends (Kokoro, Edge TTS).
- Generates audio files stored in `static/tts_audio`.
- Response includes voice metadata and estimated duration.

## Audiobook Export

- Generates per-chapter TTS audio cached at `static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav`.
- Single-chapter download: `GET /api/audiobook/{story_id}/chapter/{chapter_id}/download?format=wav|mp3`.
- Full audiobook ZIP: `GET /api/audiobook/{story_id}/export?format=wav|mp3`.
- MP3 conversion uses `lameenc` (pure Python — no ffmpeg or system binaries needed).
- Manifest endpoint returns chapter list with `has_audio`, `audio_url`, and `estimated_minutes` per chapter.

## Light / Dark Mode

- Two full themes: **dark** (default) and **light**.
- The `ThemeToggle` button (Sun/Moon icon) lives in the TopBar and is available on every page.
- Theme is persisted to `localStorage['nf-theme']` and restored on page load.
- Falls back to the OS `prefers-color-scheme` setting when no preference is stored.
- A blocking inline script in `layout.tsx` applies the theme class before React hydrates, preventing flash of unstyled content (FOUC).
- All colors are CSS custom properties defined in `globals.css` under `:root` (light) and `html.dark` (dark), mapped to Tailwind via `tailwind.config.js` with `darkMode: 'class'`.

## Preview, BookReader, and Print

### Preview Mode

- Renders TipTap HTML directly and normalizes local `src` paths to `/static`.

### BookReader

- Converts HTML into a paginated set of pages using a line-height and character-width heuristic.
- Images are resized to a max height and normalized to backend URLs.
- Font size controls re-render pagination to avoid overflow.

### Print

- A hidden iframe is injected and populated with cleaned HTML.
- The print process waits for all images to complete loading before calling `print()`.

## Export System

- HTML is cleaned via BeautifulSoup with repeated unescape handling for doubly-encoded content.
- DOCX conversion uses python-docx and respects headings, paragraphs, and image embedding.
- PDF uses ReportLab with text flowables and embedded images.
- EPUB uses ebooklib and embeds images into the book's assets.
- Markdown and text exports strip HTML tags and preserve paragraphs.

## API Endpoints (Current)

Base prefix: `/api`

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Stories

- GET `/api/stories`
- POST `/api/stories`
- GET `/api/stories/{id}`
- PUT `/api/stories/{id}`
- DELETE `/api/stories/{id}`

### Chapters

- POST `/api/chapters` (body includes `story_id`)
- GET `/api/chapters/story/{story_id}`
- GET `/api/chapters/{chapter_id}`
- PATCH `/api/chapters/{chapter_id}`
- PUT `/api/chapters/{chapter_id}/content`
- DELETE `/api/chapters/{chapter_id}`
- POST `/api/chapters/story/{story_id}/reorder`
- GET `/api/chapters/{chapter_id}/context`

### Characters

- POST `/api/characters`
- GET `/api/characters/story/{story_id}`
- GET `/api/characters/story/{story_id}/main`
- GET `/api/characters/{character_id}`
- PATCH `/api/characters/{character_id}`
- PATCH `/api/characters/{character_id}/state`
- POST `/api/characters/{character_id}/relationships`
- DELETE `/api/characters/{character_id}`
- POST `/api/characters/story/{story_id}/extract-from-content`

### Plotlines

- POST `/api/plotlines`
- GET `/api/plotlines/story/{story_id}`
- GET `/api/plotlines/{plotline_id}`
- PATCH `/api/plotlines/{plotline_id}`
- DELETE `/api/plotlines/{plotline_id}`

### Narrative Codex

- GET `/api/story-bible/story/{story_id}`
- PATCH `/api/story-bible/story/{story_id}`
- POST `/api/story-bible/story/{story_id}/rules`
- GET `/api/story-bible/story/{story_id}/rules`
- PATCH `/api/story-bible/rules/{rule_id}`
- DELETE `/api/story-bible/rules/{rule_id}`
- POST `/api/story-bible/story/{story_id}/locations`
- POST `/api/story-bible/story/{story_id}/glossary`
- POST `/api/story-bible/story/{story_id}/generate`
- POST `/api/story-bible/story/{story_id}/update-from-content`

### AI Generation

- POST `/api/ai/generate`
- POST `/api/ai/generate/stream`
- POST `/api/ai/rewrite`
- POST `/api/ai/dialogue`
- POST `/api/ai/brainstorm`
- POST `/api/ai/branches`
- POST `/api/ai/image-prompt`
- POST `/api/ai/image-to-story`
- POST `/api/ai/story-to-image`
- POST `/api/ai/tts/generate`
- GET  `/api/ai/tts/voices`
- GET  `/api/ai/tts/status`
- GET  `/api/ai/image/status`
- POST `/api/ai/image/character-portrait`
- POST `/api/ai/image/scene`
- POST `/api/ai/image/save-character-prompt`
- GET  `/api/ai/image/consistency-tips`
- GET  `/api/ai/ghibli/status`
- GET  `/api/ai/ghibli/presets`
- GET  `/api/ai/image/styles`
- POST `/api/ai/ghibli/generate`
- POST `/api/ai/ghibli/character`
- POST `/api/ai/ghibli/scene`

### AI Tools

- POST `/api/ai-tools/recap`
- POST `/api/ai-tools/grammar-check`
- POST `/api/ai-tools/quick-check`
- POST `/api/ai-tools/summarize`
- POST `/api/ai-tools/analyze-character`
- GET  `/api/ai-tools/story/{story_id}/stats`

### Memory (RAG)

- POST `/api/memory/embed-chapter`
- POST `/api/memory/embed-all`
- POST `/api/memory/search`
- GET  `/api/memory/context/{story_id}`

### Export

- GET `/api/export/{story_id}/docx`
- GET `/api/export/{story_id}/epub`
- GET `/api/export/{story_id}/pdf`
- GET `/api/export/{story_id}/markdown`
- GET `/api/export/{story_id}/text`
- GET `/api/export/{story_id}/json`
- GET `/api/export/{story_id}/outline`

### Images (Gallery)

- POST `/api/images/upload`
- POST `/api/images`
- GET  `/api/images/story/{story_id}`
- GET  `/api/images/{image_id}`
- PATCH `/api/images/{image_id}`
- DELETE `/api/images/{image_id}`
- POST `/api/images/{image_id}/favorite`

### Audiobook

- GET  `/api/audiobook/{story_id}` — manifest (chapter list with audio status)
- POST `/api/audiobook/{story_id}/chapter/{chapter_id}` — generate/regenerate chapter audio
- GET  `/api/audiobook/{story_id}/chapter/{chapter_id}/download?format=wav|mp3`
- DELETE `/api/audiobook/{story_id}/chapter/{chapter_id}` — delete cached audio
- GET  `/api/audiobook/{story_id}/export?format=wav|mp3` — ZIP of all chapters

### Settings / AI Provider Keys

- GET  `/api/settings/ai-settings` — get user token limit overrides
- PATCH `/api/settings/ai-settings` — update token limits
- GET  `/api/settings/model` — current model name
- PATCH `/api/settings/model` — change active Ollama model
- GET  `/api/settings/api-providers` — list configured external providers
- POST `/api/settings/api-keys` — save/update an external API key
- DELETE `/api/settings/api-keys/{provider}` — remove a key
- POST `/api/settings/api-keys/{provider}/activate` — set provider as active

### Import

- GET `/api/import/supported-formats`

## Configuration and Token Controls

Backend `.env` keys (see `backend/.env.example` for all values):

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

CHROMA_PERSIST_DIRECTORY=./chroma_db
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=768
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

MAX_TOKENS_STORY_GENERATION=900
MAX_TOKENS_RECAP=600
MAX_TOKENS_SUMMARY=300
MAX_TOKENS_GRAMMAR=600
MAX_TOKENS_BRANCHING=250
MAX_TOKENS_STORY_TO_IMAGE_PROMPT=250
MAX_TOKENS_IMAGE_TO_STORY=600
MAX_TOKENS_CHARACTER_EXTRACTION=900
MAX_TOKENS_REWRITE=500
MAX_TOKENS_STORY_BIBLE=400
MAX_TOKENS_STORY_BIBLE_UPDATE=300
MAX_TOKENS_IMPORT_STORY=2000
# Backend-only (not shown in Settings UI):
MAX_TOKENS_DIALOGUE=350
MAX_TOKENS_BRAINSTORM=400
```

All token limits can also be overridden **per user** via the Settings page. Per-user values are stored in the `user_ai_settings` database table.

**External AI provider keys** are configured through the Settings page (not in `.env`). One provider can be active at a time; when active it is used instead of Ollama for all generation. See [Multi-Provider AI](#multi-provider-ai-ollama--cloud) above.

Frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Setup and Running

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (pgvector optional; embeddings are stored in arrays)
- Ollama with `qwen2.5:7b` and `nomic-embed-text` **or** a cloud AI API key (OpenAI / Anthropic / Gemini)

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.
- **Framer Motion** - Animations
- **Lucide Icons** - Icon library

## 🔧 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8000
kill -9 <PID>
```

**Ollama not connecting:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
ollama serve
```

**Image generation slow/failing:**
- Ensure you have sufficient GPU memory (4GB+ recommended)
- Check DirectML is properly installed
- Reduce image resolution if needed

### Frontend Issues

**API connection errors:**
- Verify backend is running on port 8000
- Check CORS settings in backend config
- Ensure `.env.local` has correct API URL

**TipTap editor not loading:**
```bash
npm install @tiptap/react @tiptap/starter-kit
```

## 📁 Directory Structure

### Static Files
- `backend/static/generated_images/` - AI-generated images
- `backend/static/tts_audio/` - Single TTS audio clips (`{uuid}.wav`)
- `backend/static/tts_audio/audiobook/{story_id}/` - Cached audiobook chapter audio (`chapter_{chapter_id}.wav`)

### Database Files
- `backend/chroma_db/` - ChromaDB vector embeddings
- PostgreSQL stores all relational data

### Model Files
- `backend/kokoro-v1.0.onnx` - TTS model
- `backend/voices-v1.0.bin` - TTS voice data (if using Kokoro)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear description

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for local LLM support
- [Stability AI](https://stability.ai) for SD-Turbo
- [Kokoro](https://github.com/hexgrad/kokoro) for lightweight TTS
- [TipTap](https://tiptap.dev) for the editor framework

---

Built with ❤️ for storytellers everywhere.
