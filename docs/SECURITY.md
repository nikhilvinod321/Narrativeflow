# Security and Access Control - Student Deep Dive

This document explains how authentication and authorization work in NarrativeFlow.

## 1) Authentication (JWT)

Authentication is handled with JSON Web Tokens (JWT):

1. User logs in with credentials.
2. Backend returns a JWT.
3. Client includes the JWT in future requests.

The JWT proves identity without storing session state on the server.

## 2) Authorization (Ownership Checks)

Most endpoints are story-scoped. The backend checks:

- The story exists.
- The current user is the story author (`story.author_id == current_user.id`).

This prevents users from accessing or modifying other users' stories.

Note: the ownership field on the Story model is `author_id`, not `user_id`. All route handlers (including the audiobook routes) must use `story.author_id` for this check.

## 3) CORS

CORS is configured to allow local frontend origins. This is required for browser requests to a different port.

## 4) Data Privacy

By default, AI models run locally:

- Ollama for text and embeddings
- SD-Turbo for images
- Kokoro for TTS

External network usage is limited to:

- Edge TTS fallback (audio)
- Cloud AI providers (OpenAI / Anthropic / Google Gemini) **only if** the user configures an API key in Settings

## 5) API Key Storage

When a user adds an external AI provider key:

- The key is stored in the `UserApiKeys` database table, linked to the user account.
- Keys are **never** transmitted to any third party other than the provider selected by the user.
- Key detection is automatic from the prefix: `sk-ant-` → Anthropic, `AIza` → Gemini, everything else → OpenAI.
- Only one provider can be `is_active=True` at a time. When active, all generation routes use that provider instead of Ollama.
- Keys can be deleted from Settings at any time.

## 5) Common Risks

- Leaked JWT tokens (mitigate by storing securely)
- Unvalidated input (mitigate with Pydantic validation)
- Exposing static file paths incorrectly

## 6) Exercises

1. Inspect a JWT payload and identify fields.
2. Try calling a story endpoint with another user's token and verify it fails.
3. Add a new authorization check in a route.

## 7) Summary

Security in NarrativeFlow relies on JWT-based auth and strict story ownership checks. This is a standard approach for modern web apps.# Security and Access Control - Deep Dive

This document covers authentication, authorization, and data access controls.

## 1) Authentication

- JWT-based auth
- Tokens returned on login and used for protected routes

## 2) Authorization

- All story-scoped routes verify ownership using `story.author_id == current_user.id`
- Story, chapter, character, plotline, image, and audiobook operations are protected
- The ownership field is `author_id` (not `user_id`) on the Story model

## 3) CORS

- CORS allows local frontend origins
- Credentials are enabled for authenticated requests

## 4) Data Privacy

- AI models run locally by default (Ollama, SD-Turbo, Kokoro)
- External calls are only used for Edge TTS fallback, or cloud AI providers when the user has enabled an API key

## 5) API Key Storage

- External AI provider keys (OpenAI, Anthropic, Gemini) are stored in the `UserApiKeys` DB table, per user
- Keys are only transmitted to the provider chosen by the user; NarrativeFlow never logs or proxies them
- One provider can be active at a time; deactivating reverts generation to Ollama
- Key prefix detection: `sk-ant-` → Anthropic, `AIza` → Gemini, `sk-` → OpenAI
