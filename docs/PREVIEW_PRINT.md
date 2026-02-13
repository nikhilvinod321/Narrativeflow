# Preview, BookReader, and Print - Student Deep Dive

This document explains how NarrativeFlow renders story content for preview, book-style reading, and printing.

## 1) Preview Mode

Preview mode is a read-only view of the same HTML stored in chapters.

Key steps:

- The HTML is rendered directly in the preview container.
- Image URLs are normalized so `/static` points to the backend.

Why this matters: preview is the closest representation of what export and print will see.

## 2) BookReader (Overview)

BookReader converts HTML into pages using a height estimate:

- Font size determines line height.
- Estimated characters per line determines how many lines fit.
- Images are treated as fixed-height blocks.

Pagination is approximate but stable and fast.

## 3) Print Pipeline

Printing is handled with a hidden iframe:

1. The app builds a minimal HTML document in an iframe.
2. It injects print-friendly styles.
3. It waits for all images to load.
4. It calls `print()`.

Why the wait? Browsers can print before images finish loading, leading to missing images in output.

## 4) Common Issues

- Broken image links: check `/static` URL normalization.
- Cut-off content: adjust BookReader page height and line estimates.

## 5) Exercises

1. Add a large image and verify it prints correctly.
2. Change font size in BookReader and observe pagination changes.
3. Test preview with mixed headings and lists.

## 6) Summary

Preview, BookReader, and print all reuse the same HTML content. The main differences are layout and rendering context, not content conversion.# Preview, BookReader, and Print - Deep Dive

This document describes the preview modes, BookReader pagination, and print pipeline.

## 1) Preview Mode

- Renders the same HTML produced by TipTap.
- Normalizes image URLs to backend /static paths.

## 2) BookReader

- Uses react-pageflip to render a book-style UI.
- HTML is split into pages using a height heuristic:
  - Font size determines line height.
  - Estimated characters per line determine lines per block.
  - Images are treated as fixed-height blocks.
- Font size controls re-run pagination to prevent cutoffs.

## 3) Print Pipeline

- Print uses a hidden iframe.
- HTML is injected along with print-specific styles.
- The system waits for image load completion before calling print().
