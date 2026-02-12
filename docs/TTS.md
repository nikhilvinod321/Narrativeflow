# Text-to-Speech (TTS) - Student Deep Dive

This document explains how NarrativeFlow converts text into audio, including backends, configuration, and storage.

## 0) Learning Goals

- Understand why multiple TTS backends exist.
- Trace the TTS request flow.
- Learn how audio files are generated and served.

## 1) Components

- backend/app/services/tts_service.py
- backend/app/routes/ai_generation.py (TTS endpoints)
- backend/static/tts_audio (output files)

## 2) Why Multiple Backends?

TTS systems can fail for many reasons: missing models, hardware limitations, or network issues. NarrativeFlow uses:

- Kokoro-82M ONNX (local, fast, offline)
- Edge TTS (online fallback)

This ensures that audio generation works even if local models are not installed.

## 3) Generation Flow

1. Client sends text, voice, speed, and optional language hints.
2. Backend chooses a backend based on availability.
3. Audio is generated and written to disk.
4. Response includes the audio file path and metadata.

## 4) Audio Storage

Generated audio files are stored in:

- backend/static/tts_audio

Because FastAPI mounts `/static`, the audio can be played directly by the browser.

## 5) Parameters

- voice: selects a voice profile
- speed: playback speed multiplier
- language: used as a hint for pronunciation

## 6) Endpoints

- POST `/api/ai/tts/generate`
- GET `/api/ai/tts/voices`
- GET `/api/ai/tts/status`

## 7) Common Issues

- If audio fails, check if the Kokoro model exists on disk.
- If Edge TTS is blocked, check network access.
- Long text may produce large audio files; consider chunking.

## 8) Exercises

1. Generate speech at different speeds and compare results.
2. Switch voices and evaluate clarity.
3. Try a long passage and observe file sizes.

## 9) Summary

TTS in NarrativeFlow is a simple service wrapper with reliable fallbacks. It transforms text into audio, saves the file, and serves it back to the client.# Text-to-Speech (TTS) - Deep Dive

This document describes the text-to-speech system, backends, and API surface.

## 1) Components

- backend/app/services/tts_service.py
- backend/app/routes/ai_generation.py (TTS endpoints)

## 2) Backends

- Primary: Kokoro-82M ONNX (local)
- Fallback: Edge TTS (online)

## 3) Features

- Voice selection
- Speed control
- Language hints
- Audio file storage in `static/tts_audio`

## 4) Endpoints

- POST `/api/ai/tts/generate`
- GET `/api/ai/tts/voices`
- GET `/api/ai/tts/status`

## 5) Generation Flow

1. Client submits text and voice configuration.
2. Backend selects the appropriate TTS backend.
3. Audio is generated and saved to disk.
4. Response includes the audio file path and metadata.

## 6) Error Handling

- If local backend is unavailable, fallback backend is used if configured.
- Errors are returned with descriptive messages for UI display.
