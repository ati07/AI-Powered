# Task: Implement URL Discovery Engine (EPIC-3 · STORY-5)

## Context

Read these documents before writing any code:

- docs/ARCHITECTURE.md
- docs/CRAWLER_ARCHITECTURE.md
- docs/URL_QUEUE.md
- docs/CRAWLER.md
- docs/PAGE_MODEL.md
- docs/features/EPIC-3-STORY-5-URL-Discovery.md
- docs/adr/0008-url-discovery.md

Reuse all existing project architecture.

Use:

- Shared HttpClient
- Shared Logger
- CrawlerContext
- URL utilities
- Robots Service
- Sitemap Service

Follow:

- Clean Architecture
- SOLID Principles
- Dependency Injection

---

# Goal

Implement a production-ready URL Discovery Engine.

Do not download HTML pages.

The engine prepares the crawl queue that later stories will consume.

---

# Architecture

Create:

src/
    crawler/
        discovery/
            queue.ts
            service.ts
            types.ts

---

# Queue

Implement a queue capable of:

- Adding URLs
- Removing duplicates
- Tracking crawl depth
- Tracking discovery source
- Returning FIFO order

The queue should be framework-independent and fully testable.

---

# Discovery Service

The service should:

- Accept URLs from Sitemap Service
- Accept homepage URL
- Normalize URLs
- Reject external domains
- Reject unsupported schemes
- Remove duplicates
- Build queue entries

---

# Queue Entry

Include:

- Original URL
- Normalized URL
- Parent URL
- Crawl Depth
- Discovery Source
- Timestamp

---

# Validation

Reuse shared URL helpers whenever possible.

Accept:

- HTTP
- HTTPS

Reject:

- javascript:
- mailto:
- tel:
- ftp:
- data:

---

# Logging

Use ILogger.

Log:

- URLs added
- URLs skipped
- Duplicate URLs
- External URLs
- Queue size

---

# Testing

Add tests for:

- Duplicate detection
- Relative URLs
- External links
- Invalid schemes
- Queue ordering
- Depth tracking
- Source tracking

Mock dependencies where appropriate.

No network access during tests.

---

# Code Quality

Requirements:

- SOLID
- Clean Architecture
- Dependency Injection
- Strict TypeScript
- Zero ESLint warnings
- Zero TypeScript errors

No breaking changes.

---

---

# Mandatory Completion Verification

Before considering the task complete, perform a full self-review against the Feature Specification, ADR, and this prompt.

## Requirements

- Verify every Acceptance Criterion from the feature specification has been fully implemented.
- Verify every requirement in this prompt has been implemented.
- Do not intentionally skip any feature because it appears "future work" unless the specification explicitly says so.
- If a requirement requires additional supporting code (types, interfaces, utilities, tests, validation, migrations, documentation, etc.), implement it as part of this story.
- Ensure there are no placeholder implementations, partial implementations, or TODO comments.
- Ensure the implementation is production-ready rather than a proof of concept.
- If you discover missing architectural pieces required to complete the story, implement them if they are backward compatible and explain them in the final summary.

## Final Verification Checklist

Before producing the final summary, confirm:

- ✅ Every Acceptance Criterion is implemented.
- ✅ Every requested file has been created.
- ✅ Every required feature is implemented.
- ✅ No requested functionality has been omitted.
- ✅ Unit tests cover the implemented behavior.
- ✅ Existing tests continue to pass.
- ✅ TypeScript passes with zero errors.
- ✅ ESLint passes with zero warnings/errors.
- ✅ Production build succeeds.
- ✅ The feature is fully integrated into the existing architecture.

If any item above cannot be completed, explicitly explain why instead of silently omitting it.

# Deliverables

Provide a comprehensive implementation report containing:

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
9. Recommendations for the next story.
10. Architectural improvements introduced.

Finally, include a section titled:

## Feature Completion Matrix

List every Acceptance Criterion from the feature specification and mark it as:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the task as complete until every Acceptance Criterion is accounted for.

---

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.