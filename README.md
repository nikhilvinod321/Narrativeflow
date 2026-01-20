# NarrativeFlow — Interactive AI Story Co-Writing Platform

A production-grade web application for writing novels, screenplays, and episodic fiction with an AI partner. Built with FastAPI, Next.js, PostgreSQL, and Google Gemini AI.

## 🌟 Features

### AI-Powered Writing
- **Three Writing Modes**: AI-Lead, User-Lead, and Co-Author modes
- **Context-Aware Generation**: AI remembers your story's characters, plots, and world rules
- **Consistency Engine**: Automatic checking for character behavior drift, timeline issues, POV problems
- **Long-Term Memory**: RAG-based memory using vector embeddings for semantic context retrieval

### Story Management
- **Multi-Chapter Support**: Full chapter management with word counts and navigation
- **Character Profiles**: Track character traits, relationships, and development arcs
- **Plotline Tracking**: Main plots, subplots, and their interconnections
- **Story Bible**: Centralized world rules and lore management

### Editor Features
- **Rich Text Editing**: TipTap-powered editor with formatting tools
- **Auto-Save**: Automatic saving with cloud sync status
- **AI Panel**: Side panel for generation controls, recaps, and consistency checks
- **Export Options**: Export to various formats

## 🏗 Architecture

```
├── backend/
│   ├── app/
│   │   ├── config.py          # Application configuration
│   │   ├── database.py        # Database setup and session
│   │   ├── main.py            # FastAPI application entry
│   │   ├── models/            # SQLAlchemy models
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic & AI services
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities, API client, stores
│   └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Google Gemini API key

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/narrativeflow
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET_KEY=your-secret-key
```

5. **Initialize database:**
```bash
# Make sure PostgreSQL is running with pgvector extension
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

6. **Run the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

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
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. **Run the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user profile

### Stories
- `GET /api/v1/stories` - List all stories
- `POST /api/v1/stories` - Create new story
- `GET /api/v1/stories/{id}` - Get story details
- `PUT /api/v1/stories/{id}` - Update story
- `DELETE /api/v1/stories/{id}` - Delete story

### Chapters
- `GET /api/v1/stories/{story_id}/chapters` - List chapters
- `POST /api/v1/stories/{story_id}/chapters` - Create chapter
- `PUT /api/v1/stories/{story_id}/chapters/{id}` - Update chapter

### AI Generation
- `POST /api/v1/ai/generate` - Generate story content
- `POST /api/v1/ai/generate/stream` - Stream generated content
- `POST /api/v1/ai/rewrite` - Rewrite selected text
- `POST /api/v1/ai/dialogue` - Generate dialogue

### AI Tools
- `POST /api/v1/ai/tools/recap` - Generate story recap
- `POST /api/v1/ai/tools/consistency-check` - Run consistency analysis
- `POST /api/v1/ai/tools/summarize` - Summarize content

## 🎨 Writing Modes

### AI-Lead Mode
The AI takes creative control. Give it a direction and it generates compelling narrative.

### User-Lead Mode  
You write, the AI assists. Get suggestions, completions, and consistency checks.

### Co-Author Mode
True collaboration. Take turns writing, building on each other's contributions.

## 🛡 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL** - Database with pgvector for embeddings
- **Google Gemini** - AI language model
- **ChromaDB** - Vector store for RAG

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **TipTap** - Rich text editor
- **Zustand** - State management
- **React Query** - Server state management
- **Framer Motion** - Animations

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

---

Built with ❤️ for storytellers everywhere.
