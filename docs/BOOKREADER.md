# BookReader - Student Deep Dive

This document focuses on how BookReader paginates and displays content in a book-like UI.

## 0) Learning Goals

- Understand why pagination is hard for HTML.
- Learn the heuristic used for splitting pages.
- Know how images are handled.

## 1) Component

- frontend/src/components/reader/BookReader.tsx

## 2) Why Pagination Is Hard

HTML layout depends on fonts, screen size, and browser rendering. Exact pagination would require measuring the DOM after rendering. That is expensive and complicated.

BookReader uses a heuristic approach that is fast and good enough for reading.

## 3) Pagination Heuristic

The algorithm estimates the height of each block:

- Line height = fontSize * 1.6
- Characters per line = availableWidth / estimatedCharWidth
- Height = lines * lineHeight + block overhead

Images are assigned a fixed height budget with extra margin.

Long paragraphs are split into smaller chunks so they can fit across pages.

## 4) Image Handling

- Images are normalized to backend URLs if they are `/static` paths.
- Images are rendered with max-height and max-width to prevent overflow.
- Captions (if any) are appended with extra height.

## 5) Rendering

BookReader uses HTMLFlipBook to render pages with a page-flip animation.

When the font size changes, the component recomputes pagination and re-renders the book.

## 6) Trade-offs

Pros:

- Fast and responsive
- No heavy DOM measurement

Cons:

- Pagination is approximate, not exact
- Complex HTML structures may not be perfectly measured

## 7) Exercises

1. Increase the font size and observe how pages change.
2. Add a long paragraph and confirm it splits across pages.
3. Add an image and verify it does not cut off text.

## 8) Summary

BookReader is a pragmatic pagination system: it trades exact measurement for speed and stability, which is a good choice for interactive reading.# BookReader - Deep Dive

This document focuses on the BookReader pagination and rendering logic.

## 1) Component

- frontend/src/components/reader/BookReader.tsx

## 2) Pagination Heuristics

- Measures estimated height using font size, line height, and character width.
- Treats images as fixed-height blocks with conservative margins.
- Splits long paragraphs into chunks to prevent cutoff.
- Recomputes pagination on font size change.

## 3) Rendering

- Uses HTMLFlipBook for page-flip animations.
- Cover page is added dynamically.
- Images are normalized to backend URLs to ensure rendering.
