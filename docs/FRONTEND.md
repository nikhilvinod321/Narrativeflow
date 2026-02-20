# Frontend Architecture - Student Deep Dive

This document explains how the frontend is structured and how it connects to the backend.

## 1) App Router Structure

- Root: frontend/src/app
- Main editor: /stories/[id]
- Gallery: /stories/[id]/gallery
- Characters and Narrative Codex are route children under /stories/[id]
- /terms — Terms of Service (humorous, open-source focused)
- /privacy — Privacy Policy (local-first, no telemetry)
- / (home) — landing page includes an Ollama setup guide and cloud API key instructions

Each route is a React component that renders a page and pulls data via the API client.

## 2) State Management

The frontend uses Zustand for:

- Auth state (logged in user)
- Editor state (current chapter, unsaved changes)
- UI state (panel open/closed)

This keeps state centralized and predictable.

## 2.5) Theme System (Light / Dark Mode)

NarrativeFlow supports full light and dark themes with no flash on load.

### How it works

- **`frontend/src/lib/theme.tsx`** — `ThemeProvider` wraps the app; exposes `useTheme()` hook with `theme`, `setTheme`, and `toggleTheme`.
- **`frontend/src/components/theme/ThemeToggle.tsx`** — Sun/Moon icon button placed in `TopBar`. Calls `toggleTheme()` on click.
- **`frontend/src/app/globals.css`** — defines all color tokens as CSS variables on `:root` (light defaults) and `html.dark` (dark overrides).
- **`tailwind.config.js`** — `darkMode: 'class'`; every Tailwind color (`background`, `surface`, `accent`, `text-*`) resolves to a CSS variable, so a single class toggle on `<html>` switches the entire palette.

### FOUC prevention

`frontend/src/app/layout.tsx` injects an inline `<Script strategy="beforeInteractive">` that runs before React hydrates:

1. Reads `localStorage['nf-theme']`
2. Falls back to `prefers-color-scheme` if nothing is stored
3. Adds the resolved class (`dark` or `light`) to `<html>` and sets `data-theme` attribute

This ensures the correct theme is applied before the first paint.

### Persistence

The chosen theme is saved to `localStorage` under the key `nf-theme`. It persists across page reloads and browser restarts.

### Color token groups

| Group | Tokens |
|-------|--------|
| background | DEFAULT, secondary, tertiary, elevated |
| surface | DEFAULT, hover, active, border |
| accent | DEFAULT, hover, muted, subtle |
| text | primary, secondary, tertiary, muted |
| Semantic | success, warning, error (each with muted) |

### Exercises

1. Add a new color token in `globals.css` for both light and dark, then use it in a component.
2. Read `useTheme()` in a component and conditionally render different content.

## 3) API Client

- File: frontend/src/lib/api.ts
- Wraps Axios and exposes typed methods
- Keeps all HTTP calls in one place

## 4) Editor Page Composition

The editor page composes:

- Sidebar navigation
- StoryEditor and EditorToolbar
- RightPanel for AI tools
- Feature modals (branching, TTS, image generation, Audiobook)

## 5) Preview and Reader

- Preview uses the same HTML content
- BookReader renders a page-flip UI with pagination heuristics

## 6) Exercises

1. Add a new button that calls an existing API endpoint.
2. Add a new Zustand slice for feature state.
3. Move a feature into a modal and wire it to UI state.

## 7) Summary

The frontend is a modular React app with centralized state, a single API client, and a clear separation between layout, editor, and feature modals.# Frontend Architecture - Deep Dive

This document covers the frontend structure and major flows.

## 1) Next.js App Router

- App root: frontend/src/app
- Editor route: /stories/[id]
- Gallery route: /stories/[id]/gallery
- Character and Narrative Codex pages are route children of /stories/[id]

## 2) State Management

- Zustand stores for auth, editor state, and UI state
- API client wraps Axios requests

## 3) Layout

- Sidebar navigation
- RightPanel for AI tools
- TopBar actions (including `ThemeToggle` button)

## 3.5) Theme System (Light / Dark Mode)

- `frontend/src/lib/theme.tsx` — `ThemeProvider` + `useTheme()` hook (`theme`, `setTheme`, `toggleTheme`)
- `frontend/src/components/theme/ThemeToggle.tsx` — Sun/Moon icon button in TopBar
- `frontend/src/app/globals.css` — CSS variables on `:root` (light) and `html.dark` (dark)
- `tailwind.config.js` — `darkMode: 'class'`; all colors are CSS-variable tokens
- `frontend/src/app/layout.tsx` — inline `<Script>` prevents flash (FOUC) by applying theme class before React paint
- Persisted in `localStorage['nf-theme']`; falls back to `prefers-color-scheme`

## 4) Editor Flow

- StoryEditor (TipTap)
- EditorToolbar for formatting and media
- BookReader and preview modes

## 5) Modals and Features

- BranchingChoices
- StoryToImage
- ImageToStory
- TTSPlayer
- AudiobookModal (voice picker, WAV/MP3 format selector, per-chapter download list, full ZIP export)

## 6) API Integration

- All calls are centralized in frontend/src/lib/api.ts
- `exportAudiobook(storyId, voice, speed, format)` — triggers ZIP download
- `downloadChapterAudio(storyId, chapterId, voice, speed, format)` — downloads a single chapter
