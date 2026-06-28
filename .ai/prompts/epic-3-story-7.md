# Task: Implement HTML Parser & SEO Extractor (EPIC-3 · STORY-7)

## Read first

- docs/ARCHITECTURE.md
- docs/CRAWLER_ARCHITECTURE.md
- docs/SEO_EXTRACTION.md
- docs/HTML_PIPELINE.md
- docs/features/EPIC-3-STORY-7-SEO-Extractor.md
- docs/adr/0010-seo-extraction.md

Follow:

- Clean Architecture
- SOLID
- Dependency Injection
- Existing CrawlerContext
- Existing Logger

Reuse:

- HtmlDownloader
- normalizeUrl()
- HttpClient
- Shared types

---

# Goal

Implement a production-ready HTML Parser and SEO Extraction engine.

Do not download pages.

Do not persist data.

Do not score pages.

Only parse HTML and extract SEO metadata.

---

# Architecture

Create:

src/
  crawler/
    parser/
      parser.ts
      extractor.ts
      types.ts

---

# Parser

Use Cheerio.

Load HTML once.

Reuse the same DOM for all extraction.

Avoid repeated DOM traversal where practical.

---

# Extract

## Document

- title
- language
- charset
- viewport

## Meta

- description
- robots

## Canonical

- canonical URL

## OpenGraph

Extract all og:* tags into a structured object.

## Twitter

Extract twitter:* tags.

## Headings

Return:

- h1[]
- h2[]
- h3[]
- h4[]
- h5[]
- h6[]

## Images

Return:

- src
- alt
- title
- loading
- width
- height

Normalize image URLs where possible.

## Links

Return:

Internal links

External links

Normalize URLs.

Ignore:

- mailto
- tel
- javascript
- fragments

Deduplicate links.

## Structured Data

Extract every:

application/ld+json

Return parsed JSON where valid.

If invalid JSON exists, record a warning instead of throwing.

---

# Output

Return one immutable typed SEO model.

Include:

- extraction warnings
- counts
- page statistics

Never throw.

---

# Logging

Log:

- parser start
- parser complete
- extraction summary
- warnings

---

# Tests

Cover at minimum:

- empty HTML
- malformed HTML
- missing title
- multiple titles
- multiple H1
- canonical
- robots
- viewport
- charset
- language
- OpenGraph
- Twitter
- JSON-LD
- invalid JSON-LD
- images
- internal links
- external links
- duplicate links
- fragments ignored
- mailto ignored
- javascript ignored
- relative URLs
- absolute URLs

Mock nothing except the logger.

No network.

No database.

---

# Code Quality

- Production ready
- Strict TypeScript
- SOLID
- Dependency Injection
- Immutable models
- Zero TypeScript errors
- Zero ESLint warnings

---

# Mandatory Completion Verification

Before considering the task complete, perform a full self-review against the Feature Specification, ADR, and this prompt.

## Requirements

- Verify every Acceptance Criterion from the feature specification has been fully implemented.
- Verify every requirement in this prompt has been implemented.
- Do not intentionally skip any feature because it appears to be future work unless the specification explicitly says so.
- If supporting code (types, utilities, validation, documentation, tests) is needed, implement it.
- Do not leave TODOs, placeholders, or partial implementations.
- Ensure the implementation is production-ready.
- If architectural improvements are required and backward compatible, implement them and document them.

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
- ✅ Feature integrates cleanly with the existing architecture.

If any requirement cannot be completed, explicitly explain why.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Database/schema changes (if any).
5. API changes (if any).
6. Test summary.
7. Verification results.
8. Assumptions made.
9. Recommendations before Story 8.
10. Architectural improvements introduced.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion from the feature specification and mark each as:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.