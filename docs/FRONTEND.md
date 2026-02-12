# Frontend Architecture - Student Deep Dive

This document explains how the frontend is structured and how it connects to the backend.

## 0) Learning Goals

- Understand Next.js App Router structure.
- Learn how UI state is managed with Zustand.
- Trace API calls from UI to backend.

## 1) App Router Structure

- Root: frontend/src/app
- Main editor: /stories/[id]
- Gallery: /stories/[id]/gallery
- Characters and story bible are route children under /stories/[id]

Each route is a React component that renders a page and pulls data via the API client.

## 2) State Management

The frontend uses Zustand for:

- Auth state (logged in user)
- Editor state (current chapter, unsaved changes)
- UI state (panel open/closed)

This keeps state centralized and predictable.

## 3) API Client

- File: frontend/src/lib/api.ts
- Wraps Axios and exposes typed methods
- Keeps all HTTP calls in one place

## 4) Editor Page Composition

The editor page composes:

- Sidebar navigation
- StoryEditor and EditorToolbar
- RightPanel for AI tools
- Feature modals (branching, TTS, image generation)

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
- Character and story bible pages are route children of /stories/[id]

## 2) State Management

- Zustand stores for auth, editor state, and UI state
- API client wraps Axios requests

## 3) Layout

- Sidebar navigation
- RightPanel for AI tools
- TopBar actions

## 4) Editor Flow

- StoryEditor (TipTap)
- EditorToolbar for formatting and media
- BookReader and preview modes

## 5) Modals and Features

- BranchingChoices
- StoryToImage
- ImageToStory
- TTSPlayer

## 6) API Integration

- All calls are centralized in frontend/src/lib/api.ts
