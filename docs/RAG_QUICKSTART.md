# RAG Quickstart (Student Version)

This is a simple, hands-on guide to test RAG in NarrativeFlow.

## Step 1: Create Content

Write or generate at least one chapter. RAG only works when there is content to embed.

## Step 2: Verify Embeddings

Embeddings are created when chapters are saved. You can also force embedding:

- POST `/api/memory/embed-chapter`
- POST `/api/memory/embed-all`

## Step 3: Test Retrieval

Call:

- POST `/api/memory/search`

Use a query that references something in your story. The response should return relevant chunks.

## Step 4: Observe Generation

Generate a continuation and check whether the model references retrieved context correctly.

## Step 5: Troubleshoot

- If retrieval returns nothing, check embedding creation.
- If results are irrelevant, adjust chunk size or query text.

## Summary

RAG is easy to test: write, embed, search, generate. Use this flow to validate the memory system.# RAG Quickstart

This is a short operational guide to the RAG system.

1. Write or generate a chapter.
2. Embeddings are created automatically when chapters are saved.
3. Use `/api/memory/search` to test retrieval.
4. If needed, run `/api/memory/embed-all` to rebuild embeddings.
