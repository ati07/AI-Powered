# Task: Implement HTML Downloader (EPIC-3 · STORY-6)

## Context

Read before writing any code:

- docs/ARCHITECTURE.md
- docs/CRAWLER_ARCHITECTURE.md
- docs/HTML_PIPELINE.md
- docs/URL_QUEUE.md
- docs/CRAWLER.md
- docs/features/EPIC-3-STORY-6-HTML-Downloader.md
- docs/adr/0009-html-downloader.md

Reuse the existing architecture.

Use:

- Shared HttpClient
- Shared Logger
- CrawlerContext
- URL Discovery Queue

Follow:

- Clean Architecture
- SOLID
- Dependency Injection

---

# Goal

Implement a production-ready HTML Downloader.

Do not parse HTML.

Do not extract SEO information.

Only download pages and validate responses.

---

# Architecture

Create:

src/
    crawler/
        html/
            downloader.ts
            types.ts

---

# Downloader Responsibilities

- Download HTML.
- Validate status code.
- Validate content type.
- Follow redirects.
- Measure download duration.
- Return typed metadata.
- Never throw exceptions.

---

# Metadata

Return:

- originalUrl
- finalUrl
- statusCode
- contentType
- headers
- html
- contentLength
- durationMs

---

# Validation

Accept only:

- text/html
- application/xhtml+xml

Reject all other content types.

Return typed errors.

---

# Logging

Use ILogger.

Log:

- start
- completion
- redirects
- rejected responses
- failures
- duration

---

# Testing

Add unit tests covering:

- successful download
- redirect handling
- timeout
- retries
- invalid content type
- empty HTML
- 404
- 500
- response metadata
- duration measurement

Mock all HTTP requests.

No external network access.

---

# Code Quality

Requirements:

- SOLID
- Clean Architecture
- Dependency Injection
- Strict TypeScript
- Zero ESLint warnings
- Zero TypeScript errors
- Production ready

No breaking changes.

---

# Mandatory Completion Verification

Before considering the task complete, perform a full self-review against the Feature Specification, ADR, and this prompt.

## Requirements

- Verify every Acceptance Criterion from the feature specification has been fully implemented.
- Verify every requirement in this prompt has been implemented.
- Do not intentionally skip any feature because it appears to be future work unless the specification explicitly says so.
- If a requirement requires supporting code (types, utilities, validation, tests, documentation), implement it.
- Ensure there are no TODO comments, placeholders, or partial implementations.
- Ensure the implementation is production-ready.
- If additional backward-compatible architectural improvements are needed, implement them and explain them.

## Final Verification Checklist

Confirm:

- ✅ Every Acceptance Criterion is implemented.
- ✅ Every requested file has been created.
- ✅ Every required feature is implemented.
- ✅ No requested functionality has been omitted.
- ✅ Unit tests cover the implemented behavior.
- ✅ Existing tests continue to pass.
- ✅ TypeScript passes.
- ✅ ESLint passes.
- ✅ Production build succeeds.
- ✅ Feature is integrated into the existing architecture.

If anything cannot be completed, explicitly explain why.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Database/schema changes (if any).
5. API changes (if any).
6. Test summary.
7. Verification results:
   - TypeScript
   - ESLint
   - Unit tests
   - Production build
8. Assumptions made.
9. Recommendations before Story 7.
10. Architectural improvements introduced.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion from the feature specification and mark each one as:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.