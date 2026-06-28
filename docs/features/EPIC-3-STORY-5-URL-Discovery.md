# EPIC-3 · STORY-5: URL Discovery Engine

## Epic

Crawl Engine

---

## Goal

Implement a URL Discovery Engine that collects URLs from multiple discovery sources and produces a normalized crawl queue.

---

## User Story

As a user,

I want the crawler to discover all important pages,

So that SEO and AI analysis are comprehensive.

---

## Sources

Support discovery from:

- Sitemap
- Homepage HTML
- Internal links
- Canonical URLs

HTML parsing will be expanded in later stories.

---

## Responsibilities

- Merge URLs
- Normalize URLs
- Remove duplicates
- Ignore unsupported schemes
- Ignore external domains
- Track crawl depth
- Track discovery source

---

## Queue Entry

Each discovered URL contains:

- URL
- Normalized URL
- Depth
- Parent URL
- Source

---

## Validation

Accept only:

- HTTP
- HTTPS

Reject:

- mailto:
- tel:
- javascript:
- ftp:
- data:

---

## Logging

Log:

- URLs discovered
- Duplicate removal
- External URL rejection
- Queue size

---

## Testing

Add unit tests for:

- Duplicate URLs
- Relative URLs
- Canonical URLs
- Homepage links
- External links
- Invalid URLs
- Crawl depth
- Discovery sources

---

## Definition of Done

- URL Discovery implemented
- Queue implemented
- Unit tests passing
- Production ready
- Do the audit that all feature has implemneted