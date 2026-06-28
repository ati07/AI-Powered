# ADR-0008: URL Discovery Strategy

## Status

Accepted

---

## Context

A crawler receives URLs from multiple independent discovery mechanisms.

These must be merged into one consistent queue.

---

## Decision

Implement a URL Discovery Engine responsible for:

- URL normalization
- Deduplication
- Source tracking
- Crawl depth
- Queue generation

The discovery engine must not download HTML.

It only prepares the crawl queue.

---

## Consequences

### Benefits

- Single source of truth
- Deterministic crawl order
- Easy testing
- Modular architecture

### Tradeoffs

- Additional abstraction layer
- Memory usage for large queues

---

## Future

Future enhancements:

- Crawl prioritization
- Persistent queues
- Distributed queues
- Incremental crawling