# AI Generation Pipeline - Student Deep Dive

This document explains how NarrativeFlow builds prompts, uses RAG context, and calls Ollama to generate text.

## 1) Key Components

- PromptBuilder: builds system/context/user prompts
- GeminiService: wraps Ollama API calls
- MemoryService: provides RAG context
- AI routes: `/api/ai/*` and `/api/ai-tools/*`

## 2) Prompt Structure

The prompt is built in three parts:

1. System prompt: rules and role instructions
2. Context: story overview, characters, plotlines, story bible, RAG results
3. User prompt: recent text + user direction + word target

Why this matters:

- System prompt sets the AI's role and tone.
- Context anchors the AI to known facts.
- User prompt tells the AI what to do next.

## 3) RAG Injection

RAG adds retrieved chunks labeled by source:

- [Previous Scene]
- [Character Info]
- [WORLD]

This reduces contradictions by giving the model verified facts.

## 4) Ollama Request

GeminiService calls Ollama:

- Endpoint: `/api/generate`
- Payload includes:
  - `model`
  - `prompt`
  - `options` (temperature, top_p, top_k, num_predict)

The response contains:

- `response` (generated text)
- token counts if supported

## 5) Streaming vs Non-Streaming

### Non-Streaming

- Single response after full generation.
- Easier to manage for smaller outputs.

### Streaming (SSE)

- Tokens are streamed as they arrive.
- UI can display partial text immediately.
- After streaming ends, content is saved to the chapter.

## 6) Feature-Specific Flows

### Rewrite

- Uses selected text + instructions.
- Output is a rewritten block of prose.

### Dialogue

- Uses a character profile and scene context.
- Ensures voice consistency.

### Brainstorm

- Produces multiple creative directions.

### Branching

- Generates multiple JSON options in parallel.
- Each branch contains title, description, tone, and preview.

### Summarize / Recap

- Uses tighter prompts and lower token caps.
- Returns structured summaries for quick reference.

## 7) Token Controls

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

## 8) Common Pitfalls

- Too much context can drown out the user prompt.
- Too little context increases contradictions.
- Very low token caps can cut off sentences.
- High temperature can harm continuity.

## 9) Exercises

1. Compare outputs using different temperature values.
2. Reduce token caps and observe truncation.
3. Remove RAG context and observe consistency drift.

## 10) Summary

The AI pipeline is a carefully structured chain: build prompts, inject context, call the model, and return output with proper limits. Understanding each step makes it easier to tune quality and performance.
