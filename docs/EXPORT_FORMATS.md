# Export Formats - Student Deep Dive

This document explains each export format and what it is good for.

## DOCX

- Best for editing in Word or Google Docs.
- Supports headings, paragraphs, and embedded images.
- Generated via python-docx.

## PDF

- Best for final distribution.
- Fixed layout; preserves formatting and images.
- Generated via ReportLab.

## EPUB

- Best for e-readers.
- Reflows text based on device size.
- Images are packaged as EPUB assets.

## Markdown

- Best for lightweight text workflows and Git.
- Simple format; supports headings, lists, images.

## Text

- Plain text only.
- Good for quick copy or analysis.

## JSON

- Structured data format.
- Includes story metadata and chapter content.

## Outline

- Summarized structure for planning.
- Includes chapter titles and summaries.

## Choosing a Format

- Editing: DOCX
- Publishing: PDF or EPUB
- Developer workflows: Markdown or JSON
- Planning: Outline# Export Formats - Deep Dive

This document summarizes each export format and the conversion strategy.

## DOCX

- python-docx
- Images inserted with width constraints
- Headings and paragraphs preserved

## PDF

- ReportLab flowables
- Images inserted as RLImage objects
- Paragraph styles for headings and body

## EPUB

- ebooklib
- Images embedded as assets
- HTML normalized

## Markdown

- Basic DOM conversion
- Images output as markdown image links

## Text

- HTML stripped to paragraphs

## JSON

- Full story and chapter metadata

## Outline

- Chapter list with summaries and notes
