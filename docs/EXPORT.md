# Export System - Student Deep Dive

This document explains how NarrativeFlow converts HTML story content into multiple export formats.

## 1) Export Pipeline Overview

Input: chapter HTML (TipTap output)
Output: DOCX, PDF, EPUB, Markdown, Text, JSON, Outline

Core challenges:

- HTML can contain nested elements and inline images.
- Images must be resolved to local file paths.
- Each output format expects different structures.

## 2) HTML Cleaning

The export pipeline:

- Unescapes HTML entities (handles double encoding).
- Parses HTML using BeautifulSoup.
- Detects whether content is HTML or plain text.

This ensures the converter sees consistent structure.

## 3) Image Resolution

Images are normalized with `resolve_image_path()`:

- Supports localhost URLs
- Supports `/static` or `static/` paths
- Maps to backend `static` folder

Images are then:

- Embedded in EPUB assets
- Inserted into DOCX
- Added to PDF as flowables

## 4) Format-Specific Conversion

### DOCX

- Uses python-docx
- Writes headings and paragraphs
- Inserts images with width constraints

### PDF

- Uses ReportLab
- Converts HTML into paragraphs
- Adds images as scaled flowables

### EPUB

- Uses ebooklib
- Adds images as EPUB items
- Rewrites image src to internal paths

### Markdown

- Simple DOM traversal
- Converts headings, paragraphs, lists
- Includes image links if present

### Text

- Strips HTML
- Preserves paragraph boundaries

### JSON and Outline

- JSON includes story metadata and chapter content
- Outline includes titles, summaries, and structure

## 5) Endpoints

- GET `/api/export/{story_id}/docx`
- GET `/api/export/{story_id}/epub`
- GET `/api/export/{story_id}/pdf`
- GET `/api/export/{story_id}/markdown`
- GET `/api/export/{story_id}/text`
- GET `/api/export/{story_id}/json`
- GET `/api/export/{story_id}/outline`

## 6) Exercises

1. Export the same chapter to PDF and DOCX, compare formatting.
2. Insert images and check they appear in EPUB.
3. Export to Markdown and verify list formatting.

## 7) Summary

Exporting is a translation problem: HTML must be interpreted and rewritten for each format. The pipeline is designed to keep text and images consistent across formats.# Export System - Deep Dive

This document describes how NarrativeFlow exports story content to DOCX, EPUB, PDF, Markdown, Text, JSON, and Outline.

## 1) Location in Codebase

- Export routes: backend/app/routes/export.py

## 2) Input Content

- Chapters are stored as HTML content (TipTap output).
- Exporters parse and clean HTML before conversion.

## 3) HTML Cleaning

The export pipeline uses BeautifulSoup to normalize and clean HTML:

- Handles HTML entities and double-encoding via repeated unescape.
- Detects whether content is HTML or plain text.
- Extracts plain text for Markdown/Text outputs.

## 4) Image Resolution

Images are resolved using `resolve_image_path()`:

- Supports absolute URLs with localhost
- Supports `/static` and `static/` paths
- Maps to backend `static/` directory

Resolved images are:

- Embedded into EPUB assets
- Inserted into DOCX as pictures
- Placed into PDF as flowables

## 5) DOCX Export

- Uses python-docx
- Preserves headings, paragraphs, and inline images
- Image width is constrained for layout stability

## 6) PDF Export

- Uses ReportLab
- HTML is parsed into flowable blocks
- Images are scaled to fit page width

## 7) EPUB Export

- Uses ebooklib
- Images are packaged as EpubItem assets
- HTML body is rewritten to use internal image paths

## 8) Markdown Export

- Converts HTML to Markdown with a simple DOM walker
- Includes image links if present
- Falls back to plain text extraction if HTML is not detected

## 9) Text Export

- Strips HTML and returns plain paragraphs
- Preserves chapter boundaries

## 10) JSON and Outline Export

- JSON export includes full story metadata and chapter content
- Outline export includes chapter titles, summaries, and structure

## 11) Endpoints

- GET `/api/export/{story_id}/docx`
- GET `/api/export/{story_id}/epub`
- GET `/api/export/{story_id}/pdf`
- GET `/api/export/{story_id}/markdown`
- GET `/api/export/{story_id}/text`
- GET `/api/export/{story_id}/json`
- GET `/api/export/{story_id}/outline`
