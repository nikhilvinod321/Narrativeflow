# Database Model - Student Deep Dive

This document explains the main database models and how they relate to each other.

## 0) Learning Goals

- Understand how core entities connect.
- Recognize which tables are used for RAG and images.
- Understand why embeddings are stored as arrays.

## 1) Core Entities

- User
- Story
- Chapter
- Character
- Plotline
- StoryBible
- WorldRule
- GeneratedImage

## 2) Relationships (Conceptual)

- A User has many Stories.
- A Story has many Chapters, Characters, Plotlines, and Images.
- A Story has one StoryBible with many WorldRules.

## 3) Embedding Tables

Two tables store embeddings:

- StoryEmbedding (chapter chunks)
- CharacterEmbedding (character slices)

Each embedding is stored as an array of floats because pgvector is optional in this setup.

## 4) Why Store Embeddings in Postgres?

- Persistence across restarts
- Ability to inspect and debug values
- ChromaDB stores indexes for fast retrieval

## 5) Static Files

- Images: backend/static/generated_images
- Uploads: backend/static/uploads
- Audio: backend/static/tts_audio

The DB stores only paths to these files, not the file content itself.

## 6) Exercises

1. Query all chapters for a story and compute total word count.
2. Find all images attached to a story.
3. Inspect a StoryEmbedding row and verify the chunk text.

## 7) Summary

The data model is designed to keep stories structured while allowing AI features like embeddings and images to attach cleanly.# Database Model - Deep Dive

This document describes the primary data models used by NarrativeFlow.

## Core Models

- User
- Story
- Chapter
- Character
- Plotline
- StoryBible
- WorldRule
- GeneratedImage

## Embedding Models

- StoryEmbedding (chapter chunk vectors)
- CharacterEmbedding (character profile vectors)

## Storage Notes

- Embeddings are stored as float arrays in Postgres
- ChromaDB is used as a fast vector index

## Static Assets

- Generated images: backend/static/generated_images
- Uploads: backend/static/uploads
- TTS audio: backend/static/tts_audio
