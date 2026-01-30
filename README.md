# NarrativeFlow — Interactive AI Story Co-Writing Platform

A production-grade web application for writing novels, screenplays, and episodic fiction with an AI partner. Built with FastAPI, Next.js, PostgreSQL, and local AI models for text, image generation, and text-to-speech.

![NarrativeFlow](https://img.shields.io/badge/Version-2.0-blue) ![Python](https://img.shields.io/badge/Python-3.11+-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 🌟 Features

### AI-Powered Writing
- **Context-Aware Generation**: AI remembers your story's characters, plots, and world rules
- **Consistency Engine**: Automatic checking for character behavior drift, timeline issues, POV problems
- **Long-Term Memory**: RAG-based memory using ChromaDB vector embeddings for semantic context retrieval
- **Story Branching**: Generate multiple story directions (2-5 paths) with customizable preview lengths (100-1500 words)

### Multi-Modal AI Features
- **🎨 Multi-Style Image Generation**: Generate story illustrations with 14 different art styles using local SD-Turbo model
- **🔊 Text-to-Speech**: Listen to your story with Kokoro-82M TTS (with Edge TTS fallback)
- **📷 Image-to-Story**: Upload images and generate story content inspired by them
- **🖼️ Story-to-Image**: Convert story passages into visual art

### Image Generation Art Styles
| Style | Description |
|-------|-------------|
| Studio Ghibli | Hayao Miyazaki-inspired soft watercolor animation |
| Anime/Manga | Japanese animation with cel shading |
| Photorealistic | 8K UHD professional photography style |
| Fantasy Art | Epic fantasy with dramatic lighting |
| Watercolor | Traditional soft brushstroke painting |
| Oil Painting | Classical museum-quality fine art |
| Comic Book | Bold superhero/graphic novel style |
| Cyberpunk | Neon-lit futuristic cityscapes |
| Steampunk | Victorian brass and steam machinery |
| Dark/Gothic | Moody atmospheric shadows |
| Minimalist | Clean modern design |
| Pixel Art | Retro 16-bit gaming aesthetic |
| Impressionist | Monet-style light and color |
| Art Nouveau | Alphonse Mucha-inspired decorative |

### Story Management
- **Multi-Chapter Support**: Full chapter management with word counts and navigation
- **Character Profiles**: Track character traits, relationships, appearance, and development arcs
- **Character Extraction**: Auto-extract characters from your story content
- **Plotline Tracking**: Main plots, subplots, and their interconnections
- **Story Bible**: Centralized world rules and lore management
- **Image Gallery**: Save and organize generated images by story

### Editor Features
- **Rich Text Editing**: TipTap-powered editor with formatting tools
- **Auto-Save**: Automatic saving with cloud sync status
- **AI Panel**: Side panel for generation controls, recaps, and consistency checks
- **Export Options**: Export stories in multiple formats

## 🏗 Architecture

```
├── backend/
│   ├── app/
│   │   ├── config.py              # Application configuration
│   │   ├── database.py            # Database setup and async sessions
│   │   ├── main.py                # FastAPI application entry
│   │   ├── models/                # SQLAlchemy models
│   │   │   ├── user.py            # User accounts
│   │   │   ├── story.py           # Stories with genre/tone
│   │   │   ├── chapter.py         # Story chapters
│   │   │   ├── character.py       # Character profiles
│   │   │   ├── plotline.py        # Story plotlines
│   │   │   ├── story_bible.py     # World rules & lore
│   │   │   ├── image.py           # Generated images metadata
│   │   │   ├── embedding.py       # Vector embeddings
│   │   │   └── generation.py      # AI generation history
│   │   ├── routes/                # API endpoints
│   │   │   ├── auth.py            # Authentication
│   │   │   ├── stories.py         # Story CRUD
│   │   │   ├── chapters.py        # Chapter CRUD
│   │   │   ├── characters.py      # Character management
│   │   │   ├── plotlines.py       # Plotline management
│   │   │   ├── story_bible.py     # Story bible & world rules
│   │   │   ├── ai_generation.py   # AI content generation
│   │   │   ├── ai_tools.py        # AI utilities (recap, etc.)
│   │   │   ├── images.py          # Image gallery
│   │   │   ├── memory.py          # RAG memory system
│   │   │   └── export.py          # Story export
│   │   └── services/              # Business logic
│   │       ├── gemini_service.py      # Ollama AI service
│   │       ├── ghibli_image_service.py # SD-Turbo image gen
│   │       ├── tts_service.py         # Text-to-speech
│   │       ├── image_service.py       # Image utilities
│   │       ├── memory_service.py      # RAG memory
│   │       ├── consistency_engine.py  # Story consistency
│   │       ├── prompt_builder.py      # AI prompt construction
│   │       ├── story_service.py       # Story operations
│   │       ├── chapter_service.py     # Chapter operations
│   │       └── character_service.py   # Character operations
│   ├── chroma_db/                 # Vector database storage
│   ├── static/
│   │   ├── generated_images/      # AI-generated images
│   │   └── tts_audio/             # Generated audio files
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js pages
│   │   │   ├── auth/              # Login/register
│   │   │   ├── dashboard/         # Story dashboard
│   │   │   └── stories/
│   │   │       ├── new/           # Create new story
│   │   │       └── [id]/          # Story editor
│   │   │           ├── characters/ # Character pages
│   │   │           ├── bible/      # Story bible
│   │   │           └── gallery/    # Image gallery
│   │   ├── components/
│   │   │   ├── editor/            # TipTap editor
│   │   │   ├── features/          # Feature components
│   │   │   │   ├── BranchingChoices.tsx  # Story branching UI
│   │   │   │   ├── ImageToStory.tsx      # Image to story
│   │   │   │   ├── StoryToImage.tsx      # Story to image
│   │   │   │   └── TTSPlayer.tsx         # Audio player
│   │   │   ├── layout/            # Layout components
│   │   │   └── ui/                # UI primitives
│   │   └── lib/
│   │       ├── api.ts             # API client
│   │       ├── store.ts           # Zustand stores
│   │       └── utils.ts           # Utilities
│   └── package.json
```

## 🤖 AI Models Used

### Text Generation
- **Model**: [Ollama](https://ollama.ai) with `qwen2.5:7b` model (runs locally)

### Image Generation
- **Model**: [SD-Turbo](https://huggingface.co/stabilityai/sd-turbo) (Stable Diffusion optimized for speed)
- **Optimization**: DirectML for AMD/Intel integrated graphics support
- **Features**: 14 art styles, seed reproducibility, customizable dimensions

### Text-to-Speech
- **Primary**: [Kokoro-82M](https://github.com/hexgrad/kokoro) - Lightweight 82M parameter model
- **Fallback**: Microsoft Edge TTS (online)
- **Voices**: American male/female, British male/female

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- [Ollama](https://ollama.ai) installed with `qwen2.5:7b` model
- 8GB+ RAM (16GB recommended for image generation)

### Backend Setup

1. **Clone and navigate to backend:**
```bash
git clone <repository-url>
cd NarrativeFlow2/backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
Create `.env` file in the backend directory:
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/narrativeflow

# AI
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Security
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Paths
STATIC_PATH=./static
CHROMA_PATH=./chroma_db
```

5. **Setup PostgreSQL with pgvector:**
```bash
# Create database
createdb narrativeflow

# Enable pgvector extension
psql -d narrativeflow -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

6. **Setup Ollama:**
```bash
# Install Ollama from https://ollama.ai
# Pull the model
ollama pull qwen2.5:7b

# Verify it's running
ollama run qwen2.5:7b "Hello"
```

7. **Download TTS model (optional but recommended):**

Download [Kokoro v1.0](https://github.com/hexgrad/kokoro) model files to `backend/`:
```bash
cd backend

# Download Kokoro ONNX model (~310MB)
curl -L -o kokoro-v1.0.onnx https://github.com/hexgrad/kokoro/releases/download/v1.0/kokoro-v1.0.onnx

# Download voice data (~27MB)
curl -L -o voices-v1.0.bin https://github.com/hexgrad/kokoro/releases/download/v1.0/voices-v1.0.bin
```

Or download manually from: https://github.com/hexgrad/kokoro/releases/tag/v1.0

> **Note:** If Kokoro is not available, the app falls back to Microsoft Edge TTS (requires internet).

8. **Run the backend server:**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- Documentation: `http://localhost:8000/docs`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. **Run the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create new user account |
| POST | `/api/v1/auth/login` | Login and get JWT token |
| GET | `/api/v1/auth/me` | Get current user profile |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stories` | List all user's stories |
| POST | `/api/v1/stories` | Create new story |
| GET | `/api/v1/stories/{id}` | Get story details |
| PUT | `/api/v1/stories/{id}` | Update story |
| DELETE | `/api/v1/stories/{id}` | Delete story |

### Chapters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stories/{story_id}/chapters` | List all chapters |
| POST | `/api/v1/stories/{story_id}/chapters` | Create new chapter |
| GET | `/api/v1/stories/{story_id}/chapters/{id}` | Get chapter content |
| PUT | `/api/v1/stories/{story_id}/chapters/{id}` | Update chapter |
| DELETE | `/api/v1/stories/{story_id}/chapters/{id}` | Delete chapter |

### Characters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stories/{story_id}/characters` | List all characters |
| POST | `/api/v1/stories/{story_id}/characters` | Create character |
| PUT | `/api/v1/stories/{story_id}/characters/{id}` | Update character |
| DELETE | `/api/v1/stories/{story_id}/characters/{id}` | Delete character |
| POST | `/api/v1/stories/{story_id}/characters/extract` | Auto-extract characters from story |

### AI Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/generate` | Generate story content |
| POST | `/api/v1/ai/generate/stream` | Stream generated content (SSE) |
| POST | `/api/v1/ai/rewrite` | Rewrite selected text |
| POST | `/api/v1/ai/dialogue` | Generate dialogue |
| POST | `/api/v1/ai/branching` | Generate story branches |

### AI Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/tools/recap` | Generate story recap |
| POST | `/api/v1/ai/tools/consistency-check` | Run consistency analysis |
| POST | `/api/v1/ai/tools/summarize` | Summarize content |
| GET | `/api/v1/ai/tools/ghibli-presets` | Get available art styles |

### Image Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/tools/story-to-image` | Generate image from story text |
| POST | `/api/v1/ai/tools/image-to-story` | Generate story from uploaded image |
| POST | `/api/v1/ai/tools/story-to-image/save` | Save generated image to gallery |

### Image Gallery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stories/{story_id}/images` | Get story's saved images |
| DELETE | `/api/v1/images/{id}` | Delete saved image |

### Text-to-Speech
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/tools/tts` | Generate speech from text |
| GET | `/api/v1/ai/tools/tts/voices` | Get available TTS voices |

### Memory (RAG)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/memory/embed` | Create embeddings for text |
| POST | `/api/v1/memory/search` | Semantic search in story context |
| DELETE | `/api/v1/memory/{story_id}` | Clear story memory |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/export/{story_id}` | Export story in various formats |

## 🛠 Usage Guide

### Creating a New Story
1. Log in or create an account
2. Click "New Story" on the dashboard
3. Fill in story details (title, genre, tone, setting)
4. Set word target per generation session

### Using Story Branching
1. Open a story and click the "Branch" icon in the AI panel
2. Adjust the number of paths (2-5)
3. Set word target for each preview (100-1500 words)
4. Click "Generate Branches"
5. Read each option and select your preferred path

### Generating Images
1. Select text in your story or write a description
2. Click "Story to Image" in the toolbar
3. Choose an art style from 14 available options
4. Adjust settings (seed, dimensions) if desired
5. Generate and optionally save to your gallery

### Using Text-to-Speech
1. Select text you want to hear
2. Click the TTS button
3. Choose a voice (male/female, American/British)
4. Listen and adjust speed if needed

### Managing Characters
1. Navigate to Characters tab
2. Add characters manually or use "Extract Characters"
3. Edit traits, relationships, and development arcs
4. AI will reference character info during generation

## 🛡 Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL support
- **PostgreSQL** - Primary database with pgvector extension
- **Ollama** - Local LLM runtime (qwen2.5:7b)
- **SD-Turbo** - Fast image generation with DirectML
- **Kokoro-82M** - Lightweight text-to-speech
- **ChromaDB** - Vector store for RAG memory

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **TipTap** - Rich text editor
- **Zustand** - State management
- **React Query** - Server state management
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
- `backend/static/tts_audio/` - Generated audio files

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
