# Image Generation and Gallery - Student Deep Dive

This document teaches the image pipeline in NarrativeFlow, including diffusion basics, prompts, seeds, and gallery storage.

## 0) Learning Goals

- Understand diffusion prompts and negative prompts.
- Learn why seeds matter for consistency.
- Trace how an image is generated and stored.

## 1) Components and Files

- backend/app/services/image_service.py (Stable Diffusion WebUI)
- backend/app/services/ghibli_image_service.py (SD-Turbo diffusers)
- backend/app/routes/ai_generation.py (image endpoints)
- backend/app/routes/images.py (gallery endpoints)

## 2) Diffusion Basics (Short Primer)

Diffusion models generate images by iteratively denoising random noise. The prompt guides the denoising process.

Key parameters:

- Steps: more steps usually means higher quality but slower generation.
- CFG scale: how strongly the model follows the prompt.
- Seed: controls randomness (same seed + prompt = similar image).

## 3) Story-to-Image Flow

1. The backend builds a detailed visual prompt from story content.
2. If `generate_image` is true, the Stable Diffusion WebUI API is called.
3. The returned base64 image is saved to `static/generated_images`.
4. The response includes:
   - `image_prompt`
   - `image_base64`
   - `image_path`

This design separates "prompt generation" from "image generation" so the prompt can be reused with external tools.

## 4) Character Portraits

Character portraits use stored character attributes:

- physical_description
- distinguishing features
- age, gender, occupation

If a character has a stored seed, the system reuses it to keep visual consistency across generations.

## 5) Scene Images

Scene prompts include:

- Scene description
- Setting
- Mood and time of day
- Character summaries

This keeps the prompt grounded in story details.

## 6) Stable Diffusion WebUI Integration

- Default URL: http://localhost:7860
- Endpoint: /sdapi/v1/txt2img

The API returns base64 images and metadata. NarrativeFlow saves the image and exposes a file path for the gallery.

## 7) SD-Turbo and Style Presets

SD-Turbo is used for fast local generation. It supports style presets such as:

- ghibli
- anime
- photorealistic
- fantasy
- watercolor
- oil_painting
- comic
- cyberpunk
- steampunk
- dark_gothic
- minimalist
- pixel_art
- impressionist
- art_nouveau

Each style provides a prompt modifier and negative prompt.

## 8) Gallery Storage Model

Each saved image stores:

- story_id
- character_id (optional)
- image_type (character, scene, cover, environment)
- file_path and file_name
- prompt, style_id, seed
- tags and favorite flag

Gallery endpoints:

- POST `/api/images/upload`
- POST `/api/images`
- GET `/api/images/story/{story_id}`
- GET `/api/images/{image_id}`
- PATCH `/api/images/{image_id}`
- DELETE `/api/images/{image_id}`
- POST `/api/images/{image_id}/favorite`

## 9) Troubleshooting

- If the image does not appear, verify `image_path` exists under `backend/static/generated_images`.
- If generation fails, check that SD WebUI is running with `--api`.
- If output looks random, confirm the prompt and seed were applied.

## 10) Exercises

1. Generate two images with the same seed and compare outputs.
2. Increase steps and compare quality vs time.
3. Add a new style preset and test it.

## 11) Summary

Image generation is a two-step pipeline: build prompt, then generate or export it. Seeds and style presets provide repeatability and aesthetics, while the gallery persists metadata for organization.# Image Generation and Gallery - Deep Dive

This document explains the image generation pipeline, style presets, and gallery storage.

## 1) Components

- backend/app/services/image_service.py (Stable Diffusion WebUI)
- backend/app/services/ghibli_image_service.py (SD-Turbo diffusers)
- backend/app/routes/ai_generation.py (image endpoints)
- backend/app/routes/images.py (gallery endpoints)

## 2) Story-to-Image

Flow:

1. The backend builds a detailed prompt from story content.
2. If `generate_image` is true, Stable Diffusion WebUI is called.
3. The generated image is saved to `static/generated_images`.
4. Response includes `image_prompt`, `image_base64`, and `image_path`.

## 3) Character Portraits

- Prompts use character physical description and traits.
- Optional stored seed is used for visual consistency.
- Generated images return the seed and file path.

## 4) Scene Images

- Prompts are built from scene description, setting, mood, and time-of-day.
- Character summaries may be appended to the prompt.

## 5) SD WebUI Integration

- Uses Automatic1111 WebUI API at `http://localhost:7860` by default.
- Endpoint: `/sdapi/v1/txt2img`
- Returns base64 images plus metadata.

## 6) SD-Turbo / Ghibli Pipeline

- Uses diffusers with the SD-Turbo model.
- Styles are defined as prompt + negative prompt pairs.
- Default settings: 4 steps, guidance scale 0, 512x512.

## 7) Art Styles

Styles include:

- ghibli
- anime
- photorealistic
- fantasy
- watercolor
- oil_painting
- comic
- cyberpunk
- steampunk
- dark_gothic
- minimalist
- pixel_art
- impressionist
- art_nouveau

Each style provides a prompt modifier and optional negative prompt.

## 8) Gallery Storage

Images are saved with:

- story_id
- character_id (optional)
- image_type (character, scene, cover, environment)
- file_path and file_name
- prompt, style_id, seed
- tags and favorites

Gallery endpoints:

- POST `/api/images/upload`
- POST `/api/images`
- GET `/api/images/story/{story_id}`
- GET `/api/images/{image_id}`
- PATCH `/api/images/{image_id}`
- DELETE `/api/images/{image_id}`
- POST `/api/images/{image_id}/favorite`
