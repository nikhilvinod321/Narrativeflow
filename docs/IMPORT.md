# Import System - Student Deep Dive

This document explains the import support in NarrativeFlow and how you might extend it.

## 0) Learning Goals

- Understand how supported formats are reported.
- Learn how the frontend uses this information.

## 1) Current Endpoint

- GET `/api/import/supported-formats`

The backend returns a list of supported import formats. The frontend uses this list to guide the user.

## 2) Why This Endpoint Matters

By querying the backend, the frontend avoids hardcoding file type support. This makes the system easier to extend.

## 3) Extending Import Support

Typical extension steps:

1. Add parsing logic for a new file type.
2. Update the supported formats list returned by the endpoint.
3. Add UI affordances to upload and map fields.

## 4) Exercises

1. Add a new format entry in the supported list.
2. Create a mock parser for a new file type.

## 5) Summary

Import is currently metadata-driven. The endpoint is the contract between the backend and frontend for file support.# Import System - Deep Dive

This document describes story import support.

## 1) Endpoint

- GET `/api/import/supported-formats`

## 2) Notes

Supported formats are reported by the backend and used by the frontend to guide uploads.
