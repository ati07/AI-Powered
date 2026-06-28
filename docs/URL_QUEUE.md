# URL Queue

## Purpose

The URL Queue is responsible for managing every page that the crawler will visit.

It is the source of truth for crawl order.

---

## Sources

URLs may originate from:

- XML Sitemap
- Homepage
- Internal Links
- Canonical URLs
- Redirect Targets

---

## Responsibilities

- Deduplication
- URL normalization
- Crawl depth tracking
- Parent-child relationships
- Crawl priority
- Crawl status

---

## Crawl States

DISCOVERED

↓

QUEUED

↓

CRAWLING

↓

CRAWLED

or

FAILED

---

## Queue Entry

Each URL contains:

- URL
- Normalized URL
- Depth
- Parent URL
- Discovery Source
- Status
- HTTP Status
- Crawl Timestamp

---

## Future

Later stories will support:

- Priority queues
- Incremental crawling
- Resume interrupted scans
- Distributed workers