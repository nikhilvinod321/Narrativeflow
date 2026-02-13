# RAG System (Retrieval-Augmented Generation) - Student Deep Dive

This document explains RAG in a way a student can learn from first principles, then connect those ideas to NarrativeFlow's implementation. It covers the why, the how, and the trade-offs.

## 1) What Is RAG?

RAG is a strategy to improve text generation by retrieving relevant information and inserting it into the prompt. Instead of hoping the model "remembers" everything, we give it the most relevant chunks at the moment of generation.

In NarrativeFlow, RAG is used to:

- Keep character facts consistent (names, traits, relationships).
- Reuse world rules and Narrative Codex details.
- Recall earlier scenes when continuing a chapter.

## 2) Core Concepts (Student-Friendly)

### 2.1 Embeddings

An embedding is a vector (a long list of numbers) that represents the meaning of text. Similar meanings are close together in vector space.

Key idea: If two pieces of text are about the same thing, their embeddings will be near each other. This lets us do semantic search instead of keyword search.

### 2.2 Cosine Similarity

Cosine similarity measures the angle between two vectors:

$$\text{similarity} = \frac{A \cdot B}{\|A\| \|B\|}$$

NarrativeFlow uses cosine distance in ChromaDB and converts it to a score:

$$\text{score} = 1 - \text{distance}$$

### 2.3 Approximate Nearest Neighbor (ANN)

Searching exact nearest neighbors in high dimensions is expensive. ANN methods (like HNSW) give near-best results fast. Chroma uses HNSW by default.

## 3) RAG Pipeline in NarrativeFlow

The pipeline is implemented in:

- backend/app/services/memory_service.py
- backend/app/models/embedding.py
- backend/app/routes/memory.py

### Step 1: Chunking

We split chapter content into chunks. Chunking uses:

- Scene separators (***, ---, ___, ###)
- Paragraph boundaries
- Overlap between chunks

Defaults:

- `chunk_size = 1000` characters
- `chunk_overlap = 200` characters

Why overlap? It prevents cutting in the middle of important context. Overlap ensures the tail of one chunk appears in the next chunk so retrieval doesn't miss transitions.

### Step 2: Metadata Extraction

Each chunk is enriched with metadata so later filters can be applied. The metadata includes:

- Characters mentioned (string match)
- Scene type (dialogue, action, description, etc.)
- Emotional tone (keyword heuristics)
- Importance score (1-10)
- Key events (simple regex patterns)

This metadata is used for better filtering and for debug visibility.

### Step 3: Embedding Generation

NarrativeFlow calls Ollama's embedding endpoint:

- Endpoint: `POST /api/embeddings`
- Model: `nomic-embed-text`
- Dimension: 768

If embedding fails, the system stores a zero vector so the pipeline does not crash.

### Step 4: Storage

Two layers are used:

- PostgreSQL stores embeddings for persistence.
- ChromaDB stores embeddings for fast similarity search.

Collections:

- `story_{story_id}` for chapter chunks
- `story_{story_id}_characters` for character memory
- `story_{story_id}_bible` for Narrative Codex memory

### Step 5: Retrieval

When the user asks for generation, the system embeds the query (usually recent content) and retrieves:

- Chapters: top 5
- Characters: top 3
- Narrative Codex: top 3

These are gathered in parallel with asyncio.

### Step 6: Prompt Injection

Retrieved chunks are injected into the prompt with labels like:

- `[Previous Scene]`
- `[Character Info]`
- `[WORLD]`

The prompt builder then composes the final prompt used by the AI model.

## 4) Data Structures (Simplified)

### StoryEmbedding (chapter chunk)

- `content` (chunk text)
- `embedding` (vector)
- `chunk_index`, `start_position`, `end_position`
- `key_entities`, `key_events`, `emotional_tone`

### CharacterEmbedding (character memory)

- `content` (profile, backstory, voice, goals)
- `embedding`

## 5) Tuning and Trade-offs

### Chunk Size

- Larger chunks = more context per chunk but less precise retrieval.
- Smaller chunks = more precise retrieval but higher storage cost.

### Overlap

- More overlap improves continuity but increases storage and retrieval cost.
- Less overlap is cheaper but can split important info.

### top_k

- Higher top_k provides more context but increases prompt size.
- Lower top_k keeps prompts shorter but risks missing info.

## 6) Debugging and Evaluation

To evaluate RAG quality, check:

- Are retrieved chunks relevant to the query?
- Are important facts missing from retrieval?
- Do generated continuations contradict earlier facts?

Practical debugging steps:

- Use `/api/memory/search` with a direct query.
- Check if embeddings exist for a chapter.
- Rebuild embeddings with `/api/memory/embed-all`.

## 7) Student Exercises

1) Change `chunk_size` and observe retrieval differences.
2) Build a test story with repeated names and see if retrieval selects the right scenes.
3) Reduce top_k and check how generation quality changes.

## 8) Summary

RAG turns story memory into a searchable vector index. The design is simple but effective: split, embed, store, retrieve, inject. The quality depends on chunking and embedding choice more than any one trick.# RAG System (Retrieval-Augmented Generation) - Deep Dive

This document explains how NarrativeFlow implements long-term narrative memory using RAG. It covers chunking, embedding generation, metadata extraction, storage, retrieval, and prompt injection.

## 1) Purpose and Scope

RAG is used to:

- Preserve narrative continuity across chapters.
- Retrieve character facts and world rules at generation time.
- Reduce contradictions by grounding AI outputs in previously written content.

The implementation lives primarily in:

- backend/app/services/memory_service.py
- backend/app/models/embedding.py
- backend/app/routes/memory.py

## 2) Data Sources

The RAG system indexes three sources:

1. Chapter content (episodic memory)
2. Character profiles (character memory)
3. Narrative Codex entries (canonical memory)

Each source gets its own Chroma collection and uses the same embedding model.

## 3) Chunking Algorithm

### 3.1 Scene and Paragraph Splits

- The chunker looks for explicit scene breaks using this regex:
  - ***
  - ---
  - ___
  - ###
- After splitting on scene breaks, each scene is split by paragraph boundaries.

### 3.2 Chunk Size and Overlap

- `chunk_size` default: 1000 characters
- `chunk_overlap` default: 200 characters

Paragraphs are appended to the current chunk until the size would exceed `chunk_size`. When a chunk is emitted, the next chunk begins with the overlap tail of the previous chunk to preserve continuity.

### 3.3 Chunk Output

Each chunk is stored with:

- `text`: chunk content
- `start`: character offset in original chapter
- `end`: character offset in original chapter

These offsets support traceability and potential future highlighting.

## 4) Metadata Extraction

Each chunk is enriched with metadata before embedding:

### 4.1 Character Mentions

- Character names are matched via substring search (case-insensitive).
- The resulting `characters` list is stored with the chunk.

### 4.2 Scene Type

Regex patterns classify the chunk as one of:

- dialogue
- action
- description
- introspection
- flashback
- revelation

### 4.3 Emotional Tone

Keyword heuristics map chunks to:

- tense
- sad
- happy
- angry
- mysterious
- romantic

### 4.4 Importance Score

Importance is computed as a simple heuristic (1-10):

- +1 if at least one character appears
- +1 if more than two characters appear
- +2 for revelation scenes
- +1 for dialogue scenes
- +1 for action scenes

The score is capped at 10.

### 4.5 Key Event Extraction

Simple regex patterns identify event-like phrases, such as:

- "X died"
- "the Y exploded"

Events are stored in `key_events`.

## 5) Embedding Generation

### 5.1 Model and Endpoint

Embeddings are generated via Ollama:

- Endpoint: POST /api/embeddings
- Model: nomic-embed-text
- Dimension: 768

### 5.2 Flow

- Each chunk text is cleaned and sent to Ollama.
- If embedding fails or returns empty, a zero vector is stored to avoid pipeline failure.

## 6) Storage Layers

### 6.1 PostgreSQL

Embeddings are stored in:

- story_embeddings (chapter chunks)
- character_embeddings (character profile slices)

The embedding itself is stored as an array of floats (ARRAY(Float)).

### 6.2 ChromaDB

Chroma is the fast vector index for retrieval. Collections include:

- story_{story_id}
- story_{story_id}_characters
- story_{story_id}_bible

The collection uses HNSW with cosine distance.

## 7) Retrieval

### 7.1 Query Embedding

The input query is embedded using the same model (nomic-embed-text). This ensures vector space alignment.

### 7.2 Chroma Query

Chroma is queried with:

- `n_results` (top_k)
- `where` filters (exclude chapter, content type, min importance)

### 7.3 Score Normalization

Chroma returns distances. They are converted to a similarity score:

score = 1 - distance

### 7.4 Result Format

Each result includes:

- content
- score
- metadata
- source (chapter, character, bible)

## 8) Multi-Source Retrieval

`retrieve_all_relevant_context()` runs three retrievals in parallel:

- Chapter context (top 5)
- Character context (top 3)
- Narrative Codex context (top 3)

This produces a structured object with separate lists for each source.

## 9) Prompt Injection

Retrieved content is tagged and injected into the prompt builder:

- [Previous Scene] for chapter memory
- [Character Info] for character memory
- [WORLD] for Narrative Codex rules

This improves continuity while keeping the prompt structured.

## 10) Embedding Lifecycle

Embeddings are created or updated when:

- A chapter is generated and saved
- The memory embed endpoints are called
- A chapter is edited (embeddings are refreshed)
- Characters are created or updated (character embeddings refreshed)

## 11) Failure Modes and Fallbacks

- If Ollama embedding fails, a zero vector is stored to avoid crashes.
- If Chroma is unavailable, the system gracefully returns empty retrieval results.
- The generation pipeline still works without retrieval, but with reduced long-term memory.

## 12) Configuration

Relevant config keys:

- CHROMA_PERSIST_DIRECTORY
- EMBEDDING_MODEL
- EMBEDDING_DIMENSION
- CHUNK_SIZE
- CHUNK_OVERLAP
- OLLAMA_BASE_URL

## 13) Performance Notes

- Chunk size and overlap are tuned for narrative prose and can be adjusted.
- Retrieval is parallelized using asyncio gather.
- Chroma provides O(log n) approximate nearest neighbor search using HNSW.
