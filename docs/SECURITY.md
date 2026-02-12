# Security and Access Control - Student Deep Dive

This document explains how authentication and authorization work in NarrativeFlow.

## 0) Learning Goals

- Understand JWT authentication.
- Know how story ownership is enforced.
- Recognize common security risks.

## 1) Authentication (JWT)

Authentication is handled with JSON Web Tokens (JWT):

1. User logs in with credentials.
2. Backend returns a JWT.
3. Client includes the JWT in future requests.

The JWT proves identity without storing session state on the server.

## 2) Authorization (Ownership Checks)

Most endpoints are story-scoped. The backend checks:

- The story exists.
- The current user is the story author.

This prevents users from accessing or modifying other users' stories.

## 3) CORS

CORS is configured to allow local frontend origins. This is required for browser requests to a different port.

## 4) Data Privacy

By default, AI models run locally:

- Ollama for text and embeddings
- SD-Turbo for images
- Kokoro for TTS

External network usage is limited to Edge TTS fallback.

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

- All story-scoped routes verify ownership
- Story, chapter, character, plotline, and image operations are protected

## 3) CORS

- CORS allows local frontend origins
- Credentials are enabled for authenticated requests

## 4) Data Privacy

- AI models run locally by default (Ollama, SD-Turbo, Kokoro)
- External calls are only used for Edge TTS fallback
