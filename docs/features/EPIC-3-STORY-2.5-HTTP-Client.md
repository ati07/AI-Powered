# EPIC-3-STORY-2.5: HTTP Client Infrastructure

## Epic

Crawl Engine

---

## Goal

Build a reusable HTTP client for all crawler components.

The HTTP client centralizes request handling, retries, timeouts, user-agent configuration, and error handling.

No crawler component should call fetch() directly.

---

## User Story

As a developer,

I want a shared HTTP client,

So every crawler module behaves consistently.

---

## Business Value

A shared HTTP client reduces duplicated code and simplifies future enhancements such as proxy support, rate limiting, and request logging.

---

## Acceptance Criteria

### Request

* Support GET requests.
* Configurable timeout.
* Configurable headers.

### Retry

Retry on:

* 429
* 500
* 502
* 503
* 504

Default:

3 retries with exponential backoff.

### User-Agent

Use one configurable crawler user-agent.

### Error Handling

Throw typed errors.

No silent failures.

### Logging

Log request start, completion, retries, and failures.

### Testing

Unit tests for:

* retries
* timeout
* headers
* successful responses
* failed responses

---

## Definition of Done

* HTTP client implemented
* Retry policy implemented
* Timeout support
* Logging integrated
* Unit tests added
* Production ready
