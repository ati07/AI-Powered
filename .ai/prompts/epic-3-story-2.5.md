# Task: Implement HTTP Client Infrastructure (EPIC-3 · STORY-2.5)

## Context

Read these documents before writing any code:

* docs/ARCHITECTURE.md
* docs/CRAWLER.md
* docs/ROADMAP.md
* docs/features/EPIC-3-STORY-2.5-HTTP-Client.md
* docs/adr/0005-http-client.md

Follow the existing project architecture:

* Next.js 15
* TypeScript
* Prisma
* PostgreSQL
* Clean Architecture
* Repository Pattern
* SOLID Principles

Reuse existing project conventions.

---

# Goal

Implement a reusable HTTP client that will be used by every crawler component.

No crawler module should call `fetch()` directly.

---

# Architecture

Create:

```text
src/
    shared/
        http/
            http-client.ts
            retry-policy.ts
            timeout.ts
            user-agent.ts
            errors.ts
            types.ts
```

---

# HTTP Client

Implement:

* GET requests
* Configurable timeout
* Configurable headers
* AbortController support

---

# Retry Policy

Retry automatically on:

* 429
* 500
* 502
* 503
* 504

Maximum:

* 3 retries

Use exponential backoff.

---

# User-Agent

Create a reusable crawler User-Agent.

Example:

```
AIVisibilityBot/1.0 (+https://your-domain.com)
```

It must be configurable through environment variables.

---

# Logging

Use the existing logger.

Log:

* Request started
* Response received
* Retry attempt
* Failure
* Duration

Do not use `console.log`.

---

# Typed Errors

Create custom error types:

* HttpTimeoutError
* HttpRetryExceededError
* HttpResponseError

Never throw generic `Error` for HTTP failures.

---

# Testing

Add unit tests for:

* Successful request
* Timeout
* Retry logic
* Header injection
* User-Agent
* Error handling

Mock all network requests.

Do not call real websites.

---

# Code Quality

Requirements:

* Follow SOLID.
* Follow Clean Architecture.
* No duplicated networking logic.
* Strict TypeScript.
* Zero ESLint errors.
* Production-ready implementation only.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Test summary.
5. Assumptions.
6. Recommendations before Story 3.

Run before completion:

* TypeScript
* ESLint
* Unit tests
* Production build

Do not leave TODO comments or placeholder implementations.

---

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.

Do not introduce breaking changes.
