# ADR-0005: Shared HTTP Client

## Status

Accepted

---

## Context

Multiple crawler components require outbound HTTP requests.

Without a shared abstraction, request logic would be duplicated across the project.

---

## Decision

Introduce a shared HTTP client.

Responsibilities:

* HTTP requests
* Retry policy
* Timeouts
* User-Agent
* Logging
* Typed errors

Crawler modules must never call fetch() directly.

---

## Consequences

Benefits

* Consistent networking behavior
* Easier testing
* Centralized retry logic
* Future proxy support
* Future authentication support

Tradeoffs

* Additional abstraction layer
* Slight increase in initial complexity

---

## Future

The HTTP client may later support:

* HTTP/2
* Proxy rotation
* Connection pooling
* Request metrics
* Distributed tracing
