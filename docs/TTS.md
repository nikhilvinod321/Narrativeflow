# Text-to-Speech (TTS) - Student Deep Dive

This document explains how NarrativeFlow converts text into audio, including backends, configuration, and storage.

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

TTS in NarrativeFlow is a simple service wrapper with reliable fallbacks. It transforms text into audio, saves the file, and serves it back to the client.

## 10) Audiobook Feature

The audiobook system builds on TTS to produce audio for entire stories, chapter by chapter.

### 10.1 Route File

- backend/app/routes/audiobook.py

### 10.2 Endpoints

- `GET /api/audiobook/{story_id}` — manifest: full chapter list with `has_audio`, `audio_url`, `estimated_minutes` per chapter
- `POST /api/audiobook/{story_id}/chapter/{chapter_id}` — generate (or regenerate) TTS audio for a chapter; accepts `voice` and `speed` in request body
- `GET /api/audiobook/{story_id}/chapter/{chapter_id}/download?format=wav|mp3` — generate-if-needed and stream chapter audio as a file download
- `DELETE /api/audiobook/{story_id}/chapter/{chapter_id}` — delete cached audio so the chapter can be regenerated
- `GET /api/audiobook/{story_id}/export?format=wav|mp3` — download all chapters as a ZIP archive

### 10.3 Audio File Storage

Audio files are stored on disk (not in the database):

```
backend/static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav
```

Served via FastAPI's static mount at:

```
/static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav
```

The manifest endpoint checks `Path.exists()` on each expected path to populate `has_audio` and `audio_url`. The estimated duration uses 150 words-per-minute narration rate.

### 10.4 Format Selection

Both download and export endpoints accept a `format` query parameter:

- `?format=wav` — raw WAV output (default)
- `?format=mp3` — MP3 output via lameenc (pure Python, no ffmpeg required)

### 10.4 MP3 Conversion

MP3 encoding is provided by `lameenc` (listed in requirements.txt):

- `_wav_to_mp3(wav_path, bitrate=128)` helper converts WAV to MP3 in memory
- Falls back gracefully to WAV if lameenc is not installed
- No external binaries or system dependencies required

### 10.5 Frontend Integration

- The Audiobook modal lives in frontend/src/app/stories/[id]/page.tsx
- Voice picker and Format selector (WAV/MP3) are shown side-by-side
- "All Chapters ZIP" button triggers the `/export` endpoint
- Per-chapter Download buttons with individual spinners use the `/download` endpoint

### 10.6 Exercises

1. Generate all chapters and compare WAV vs MP3 file sizes.
2. Change the bitrate constant in `_wav_to_mp3` and observe audio quality.
3. Test the ZIP export and verify each chapter file uses the correct extension.

# Text-to-Speech (TTS) - Deep Dive

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

## 6) Audiobook Feature

The audiobook route generates per-chapter audio and provides download and export endpoints.

### Route File
- backend/app/routes/audiobook.py

### Endpoints
- `GET /api/audiobook/{story_id}` — manifest (chapter list with `has_audio`, `audio_url`, `estimated_minutes`)
- `POST /api/audiobook/{story_id}/chapter/{chapter_id}` — generate / regenerate chapter audio
- `GET /api/audiobook/{story_id}/chapter/{chapter_id}/download?format=wav|mp3`
- `DELETE /api/audiobook/{story_id}/chapter/{chapter_id}` — delete cached audio
- `GET /api/audiobook/{story_id}/export?format=wav|mp3` — ZIP of all chapter audio

### Audio File Storage
Files live at `static/tts_audio/audiobook/{story_id}/chapter_{chapter_id}.wav` on disk, served via the `/static` mount. The DB stores no audio paths; existence is checked at request time.

### MP3 Support
- `lameenc` (>=1.7.0) provides in-process WAV→MP3 conversion
- No ffmpeg or system binaries required
- `_wav_to_mp3(wav_path, bitrate=128)` — falls back to WAV if lameenc is unavailable
- Both download and export endpoints respect the `format` query parameter

## 7) Error Handling

- If local backend is unavailable, fallback backend is used if configured.
- Errors are returned with descriptive messages for UI display.
