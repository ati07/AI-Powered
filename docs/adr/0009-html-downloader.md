# ADR-0009: HTML Download Strategy

## Status

Accepted

---

## Context

The crawler requires a dedicated component responsible for downloading HTML pages.

Downloading and parsing HTML are separate responsibilities.

---

## Decision

Implement an HTML Downloader that:

- Downloads pages.
- Validates HTTP responses.
- Validates content types.
- Returns raw HTML with metadata.

The downloader will not perform SEO extraction.

---

## Consequences

### Benefits

- Single responsibility
- Easier testing
- Reusable component
- Cleaner extraction pipeline

### Tradeoffs

- Additional abstraction layer

---

## Future

Future enhancements:

- Brotli compression
- Streaming downloads
- HTTP caching
- ETag support
- Conditional requests
- HTTP/2 optimizations