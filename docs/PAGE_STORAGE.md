# Page Storage

## Goal

Persist every crawled page as an immutable snapshot.

---

Pipeline

SEO Model
      │
      ▼
Validation
      │
      ▼
Persistence Model
      │
      ▼
Database
      │
      ▼
Scan Report

---

Stored Information

- URL
- Final URL
- HTTP Status
- Content Type
- Crawl Depth
- Parent URL
- Source
- Title
- Description
- Canonical
- Robots
- OpenGraph
- Twitter
- Headings
- Images
- Links
- Structured Data
- Extraction Warnings
- Crawl Timestamp

---

Principles

- Immutable snapshot
- No recalculation
- Fast reads
- Historical scans supported