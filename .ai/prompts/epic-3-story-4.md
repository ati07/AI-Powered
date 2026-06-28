# Task: Implement Sitemap Parser (EPIC-3 · STORY-4)

## Context

Read these documents before writing any code:

* docs/ARCHITECTURE.md
* docs/CRAWLER.md
* docs/CRAWLER_ARCHITECTURE.md
* docs/PAGE_MODEL.md
* docs/DATABASE.md
* docs/features/EPIC-3-STORY-4-Sitemap-Parser.md
* docs/adr/0007-sitemap-parser.md

Follow the existing project architecture:

* Next.js 15
* TypeScript
* Prisma
* PostgreSQL
* Clean Architecture
* SOLID Principles
* Shared HttpClient
* Shared Logger

Reuse implementation patterns from the Robots module.

---

# Goal

Implement a production-ready Sitemap Service capable of recursively discovering URLs from XML sitemaps.

This story focuses only on URL discovery.

Do not download HTML pages yet.

---

# Architecture

Create:

```text
src/
    crawler/
        sitemap/
            downloader.ts
            parser.ts
            service.ts
            types.ts
```

If appropriate, introduce:

```text
src/
    crawler/
        core/
            crawler-context.ts
            crawl-config.ts
            limits.ts
```

These should be generic and reusable by future crawler modules.

---

# Downloader

Responsibilities:

* Download sitemap XML using HttpClient.
* Support redirects.
* Detect HTTP failures.
* Return raw XML.
* Log request lifecycle.

---

# Parser

Support:

* `<urlset>`
* `<sitemapindex>`

Extract:

* loc
* lastmod
* changefreq
* priority

Ignore unknown XML elements.

Never throw parsing exceptions.

---

# Service

Responsibilities:

* Download sitemap.
* Parse sitemap.
* Recursively process sitemap indexes.
* Deduplicate URLs.
* Enforce configurable limits:

  * Maximum recursion depth
  * Maximum sitemap files
  * Maximum URLs
* Return normalized URL objects.

---

# URL Validation

Reuse shared URL utilities where possible.

Accept only:

* HTTP
* HTTPS

Normalize discovered URLs.

Discard duplicates.

---

# Logging

Use ILogger.

Log:

* Downloads
* Nested sitemap discovery
* URLs discovered
* Limit enforcement
* Parsing errors

Never use console.log.

---

# Testing

Add unit tests for:

* Standard sitemap
* Sitemap index
* Recursive discovery
* Duplicate URLs
* Invalid XML
* Invalid URLs
* Empty sitemap
* Limit enforcement
* Service integration

Mock all HTTP requests.

Do not access external websites during tests.

---

# Code Quality

Requirements:

* Follow SOLID.
* Follow Clean Architecture.
* Use dependency injection.
* Strict TypeScript.
* Zero ESLint errors.
* Production-ready implementation.

Do not introduce breaking changes.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Test summary.
5. Assumptions.
6. Recommendations before Story 5.

Run before completion:

* TypeScript
* ESLint
* Unit tests
* Production build

Do not leave TODO comments or placeholder implementations.

---

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.
