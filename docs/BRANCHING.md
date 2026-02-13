# Story Branching - Student Deep Dive

This document explains how NarrativeFlow generates multiple story paths and why branching is useful for interactive writing.

## 1) Why Branching?

Branching helps writers explore possibilities without committing to a single direction. It is like brainstorming, but with actual prose previews.

## 2) Endpoint

- POST `/api/ai/branches`

## 3) Input Parameters

- `story_id`, `chapter_id`
- `num_branches` (2-5)
- `word_target` per branch

## 4) Generation Flow

1. Backend loads story, chapter, characters, plotlines, and Narrative Codex.
2. A prompt template requests JSON output with:
   - title
   - description
   - tone
   - preview (actual prose)
3. Multiple branches are generated in parallel.
4. Each branch is capped by a token limit derived from word target.

## 5) Output Format

Each branch includes:

- id
- title
- description
- tone
- preview

The preview is real prose, not a summary.

## 6) Selecting a Branch

When a user selects a branch, the preview can be appended to the chapter and embedded into RAG memory so the new path becomes canonical.

## 7) Common Pitfalls

- If previews are too short, increase `word_target`.
- If JSON is malformed, adjust prompt or reduce randomness.

## 8) Exercises

1. Generate branches with different word targets and compare detail.
2. Force a specific tone and observe the change in voice.
3. Select a branch and verify it appears in the chapter.

## 9) Summary

Branching is structured AI brainstorming. It returns usable prose and keeps options open before you commit.# Story Branching - Deep Dive

This document explains how branching story choices are generated.

## 1) Endpoint

- POST `/api/ai/branches`

## 2) Flow

1. Backend loads story, chapter, characters, plotlines, and Narrative Codex.
2. A prompt template requests JSON output with title, description, tone, and preview.
3. Multiple branches are generated in parallel with varied tones.
4. Previews are capped by a token limit derived from the word target.

## 3) Output

Each branch includes:

- id
- title
- description
- tone
- preview (prose continuation)

## 4) Selecting a Branch

Selected branch previews can be appended to the chapter and embedded for RAG.
