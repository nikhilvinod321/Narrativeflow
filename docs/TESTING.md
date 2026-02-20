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

## 7.5) Audiobook

- Generate audio for a chapter and verify the file is created in static/tts_audio
- Download a chapter as WAV and confirm playback
- Download a chapter as MP3 and confirm the file is a valid MP3
- Export all chapters as ZIP in MP3 format and verify filenames and contents
- Verify that missing lameenc does not crash the server (should fallback to WAV)

Why: validates the full audiobook pipeline including format conversion.

## 8) Export

- DOCX, PDF, EPUB, Markdown, Text
- Images appear in DOCX/PDF/EPUB

Why: verifies output formats and image embedding.

## 8.5) Theme

- Toggle between light and dark mode from the TopBar button
- Verify the `dark`/`light` class is applied to `<html>`
- Reload the page and confirm the theme persists (stored in `localStorage['nf-theme']`)
- Open in a browser with `prefers-color-scheme: dark` and verify the default matches system preference

Why: ensures the FOUC prevention script, ThemeProvider, and localStorage round-trip all work correctly.

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
- Audiobook: per-chapter generate, WAV download, MP3 download, ZIP export
- Theme toggle: light↔dark switch, persistence across reload, system preference default
- Terms page: loads at /terms
- Privacy page: loads at /privacy
