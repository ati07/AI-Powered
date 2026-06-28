# Task: Implement robots.txt Parser (EPIC-3 · STORY-3)

## Context

Read before writing any code:

* docs/ARCHITECTURE.md
* docs/CRAWLER.md
* docs/PAGE_MODEL.md
* docs/DATABASE.md
* docs/features/EPIC-3-STORY-3-Robots-Parser.md
* docs/adr/0006-robots-parser.md

Reuse all existing project architecture.

Use:

* Shared HttpClient
* Shared Logger
* Clean Architecture
* SOLID Principles
* Repository Pattern

---

# Goal

Implement a production-ready robots.txt downloader and parser.

Do not implement sitemap parsing yet.

Only discover sitemap URLs.

---

# Architecture

Create:

```
src/
    crawler/
        robots/
            downloader.ts
            parser.ts
            service.ts
            types.ts
```

---

# Downloader

Responsibilities:

* Request `/robots.txt` using HttpClient.
* Handle redirects transparently.
* Treat 404 as "no robots.txt".
* Log request lifecycle.
* Return raw text.

---

# Parser

Support:

* User-agent
* Allow
* Disallow
* Sitemap
* Crawl-delay

Ignore unsupported directives gracefully.

Support:

* Unix line endings
* Windows line endings
* Blank lines
* Comments beginning with `#`

Return typed objects.

Never throw parsing exceptions.

---

# Service

Create a service that:

1. Downloads robots.txt.
2. Parses it.
3. Returns structured results.

This service will later be used by the CrawlProcessor.

---

# Logging

Use the shared ILogger.

Log:

* Download start
* Download success
* Download failure
* Parse success
* Parse failure

No console.log usage.

---

# Testing

Add unit tests for:

* Downloader success
* Downloader 404
* Empty robots.txt
* Multiple User-agent groups
* Multiple Sitemap directives
* Crawl-delay
* Comments
* Invalid syntax
* Mixed line endings

Mock all HTTP requests.

Do not call external websites during tests.

---

# Code Quality

Requirements:

* Follow SOLID.
* Follow Clean Architecture.
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
6. Recommendations before Story 4.

Run before completion:

* TypeScript
* ESLint
* Unit tests
* Production build

No TODO comments or placeholder implementations.

---

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.
