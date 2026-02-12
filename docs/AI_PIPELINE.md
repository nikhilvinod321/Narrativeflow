# AI Generation Pipeline - Student Deep Dive

This document teaches the AI generation pipeline from a student perspective: what each step does, why it exists, and how it is implemented in NarrativeFlow.

## 0) Learning Goals

You should be able to:

- Explain how prompts are constructed and why structure matters.
- Describe sampling controls (temperature, top_p, top_k).
- Trace a generation request from UI to response.
- Understand streaming vs non-streaming output.

## 1) Key Components

- PromptBuilder: builds system/context/user prompts
- GeminiService: wraps Ollama API calls
- MemoryService: provides RAG context
- AI routes: `/api/ai/*` and `/api/ai-tools/*`

## 2) Writing Modes (Why They Matter)

Writing modes change the sampling settings:

- AI-Lead: more creative, higher temperature
- User-Lead: more precise, lower temperature
- Co-Author: balanced

Higher temperature increases randomness. Lower temperature makes outputs more conservative.

## 3) Prompt Structure

The prompt is built in three parts:

1. System prompt: rules and role instructions
2. Context: story overview, characters, plotlines, story bible, RAG results
3. User prompt: recent text + user direction + word target

Why this matters:

- System prompt sets the AI's role and tone.
- Context anchors the AI to known facts.
- User prompt tells the AI what to do next.

## 4) RAG Injection

RAG adds retrieved chunks labeled by source:

- [Previous Scene]
- [Character Info]
- [WORLD]

This reduces contradictions by giving the model verified facts.

## 5) Ollama Request

GeminiService calls Ollama:

- Endpoint: `/api/generate`
- Payload includes:
  - `model`
  - `prompt`
  - `options` (temperature, top_p, top_k, num_predict)

The response contains:

- `response` (generated text)
- token counts if supported

## 6) Streaming vs Non-Streaming

### Non-Streaming

- Single response after full generation.
- Easier to manage for smaller outputs.

### Streaming (SSE)

- Tokens are streamed as they arrive.
- UI can display partial text immediately.
- After streaming ends, content is saved to the chapter.

## 7) Feature-Specific Flows

### Rewrite

- Uses selected text + instructions.
- Output is a rewritten block of prose.

### Dialogue

- Uses a character profile and scene context.
- Ensures voice consistency.

### Brainstorm

- AI-Lead mode for idea diversity.
- Produces multiple creative directions.

### Branching

- Generates multiple JSON options in parallel.
- Each branch contains title, description, tone, and preview.

### Summarize / Recap

- Uses tighter prompts and lower token caps.
- Returns structured summaries for quick reference.

## 8) Token Controls

Per-feature token limits are configurable in `.env`:

- MAX_TOKENS_STORY_GENERATION
- MAX_TOKENS_RECAP
- MAX_TOKENS_SUMMARY
- MAX_TOKENS_GRAMMAR
- MAX_TOKENS_BRANCHING
- MAX_TOKENS_REWRITE
- MAX_TOKENS_DIALOGUE
- MAX_TOKENS_BRAINSTORM

Why this matters: token caps directly control latency and cost (or local compute usage).

## 9) Common Pitfalls

- Too much context can drown out the user prompt.
- Too little context increases contradictions.
- Very low token caps can cut off sentences.
- High temperature can harm continuity.

## 10) Exercises

1. Compare outputs using different writing modes.
2. Reduce token caps and observe truncation.
3. Remove RAG context and observe consistency drift.

## 11) Summary

The AI pipeline is a carefully structured chain: build prompts, inject context, call the model, and return output with proper limits. Understanding each step makes it easier to tune quality and performance.# AI Generation Pipeline - Deep Dive

This document describes how NarrativeFlow builds prompts, uses RAG context, and calls Ollama to generate text.

## 1) Components

- backend/app/services/gemini_service.py (Ollama wrapper)
- backend/app/services/prompt_builder.py
- backend/app/routes/ai_generation.py
- backend/app/routes/ai_tools.py

## 2) Writing Modes

- AI-Lead: higher creativity
- User-Lead: higher precision
- Co-Author: balanced

The mode controls temperature and sampling parameters in the generation options.

## 3) Prompt Builder

PromptBuilder constructs:

- System prompt (tone, genre, writing mode)
- Context block (story overview, character summaries, plotlines, story bible rules)
- RAG retrieved context
- User prompt (recent content and direction)

## 4) RAG Injection

The MemoryService returns three sources of context:

- Chapters (previous scenes)
- Characters (profiles and voice)
- Story bible (world rules and locations)

Each is tagged before being inserted into the prompt.

## 5) Generation Calls

GeminiService sends a request to Ollama:

- Endpoint: /api/generate
- Options: temperature, top_p, top_k, num_predict
- Returns: content, token counts, timing

## 6) Streaming

- Streaming uses SSE and yields chunks of text as they arrive.
- Chapter content is saved once the stream completes.

## 7) Feature-Specific Flows

- Rewrite: uses selected text and instructions.
- Dialogue: uses character profile and scene context.
- Brainstorm: uses AI-Lead mode and returns multiple ideas.
- Branching: generates multiple JSON options in parallel.
- Summary/Recap: uses targeted prompts and lower token caps.

## 8) Token Controls

Per-feature token caps are enforced via environment variables, such as:

- MAX_TOKENS_STORY_GENERATION
- MAX_TOKENS_RECAP
- MAX_TOKENS_SUMMARY
- MAX_TOKENS_GRAMMAR
- MAX_TOKENS_BRANCHING
- MAX_TOKENS_REWRITE
- MAX_TOKENS_DIALOGUE
- MAX_TOKENS_BRAINSTORM
