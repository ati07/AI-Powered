# EPIC-3 · STORY-8: Page Persistence

## Goal

Persist extracted SEO data into the database.

---

The crawler must save every successfully parsed page.

The persistence layer must be independent of the crawler.

---

## User Story

As a user,

I want every crawled page stored,

So I can view crawl history and compare scans.

---

## Database

Implement Page model.

Each Scan owns many Pages.

---

## Store

General

- URL
- Final URL
- Status Code
- Content Type

SEO

- Title
- Description
- Canonical
- Robots

Social

- OpenGraph
- Twitter

Structure

- Language
- Charset
- Viewport

Collections

- Headings
- Images
- Links
- Structured Data

Metadata

- Crawl depth
- Parent URL
- Source
- Warnings
- Download duration
- Extraction duration

---

## Requirements

Use Prisma.

Bulk insert supported.

Immutable records.

Cascade delete with Scan.

---

## Validation

Use Zod.

---

## Tests

Repository

Use Cases

Persistence

Validation

---

## Definition of Done

Production ready.

Historical scans preserved.

No updates after creation.