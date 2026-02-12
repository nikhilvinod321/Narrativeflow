# Testing Guide (Student Version)

This document outlines practical manual tests for the system and explains why each test matters.

## 1) Editor Tests

- Formatting: bold, italic, headings
- Image insertion: upload and gallery
- Word count updates
- Ctrl/Cmd+S save

Why: ensures content is stored correctly and can be exported.

## 2) Preview and BookReader

- Preview renders HTML correctly
- BookReader pagination does not cut off text
- Font size changes reflow pages

Why: ensures reading modes work and users can review content.

## 3) Print

- Print includes images
- Print layout matches preview

Why: ensures physical output is correct.

## 4) AI Generation

- Continuation generation
- Streaming generation
- Rewrite and summarize

Why: verifies prompt building and model integration.

## 5) RAG

- `/api/memory/search` returns relevant chunks
- Embedding rebuild works

Why: validates memory system.

## 6) Image Generation

- Story-to-image prompt generation
- SD WebUI generation (if enabled)
- Gallery save and retrieval

Why: ensures image pipeline works end-to-end.

## 7) TTS

- Audio generation with default voice
- Speed changes

Why: ensures TTS backends are usable.

## 8) Export

- DOCX, PDF, EPUB, Markdown, Text
- Images appear in DOCX/PDF/EPUB

Why: verifies output formats and image embedding.

## 9) Exercises

1. Create a test checklist and mark pass/fail.
2. Try a story with embedded images and export to all formats.
3. Write a short story and validate RAG retrieval.# Testing Notes

This document lists manual checks used during development.

- Editor: formatting, images, and autosave
- Preview and BookReader pagination
- Print with image loading
- Export: DOCX, PDF, EPUB, Markdown, Text
- AI generation and streaming
- RAG retrieval via /api/memory/search
- Image generation and gallery saving
- TTS generation and playback
