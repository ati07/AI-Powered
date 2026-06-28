# Task: Implement Page Persistence (EPIC-3 · STORY-8)

## Read first

- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/PAGE_STORAGE.md
- docs/SEO_EXTRACTION.md
- docs/features/EPIC-3-STORY-8-Page-Persistence.md
- docs/adr/0011-page-persistence.md

Reuse:

- Existing Scan model
- Existing Website model
- Existing Crawler types
- Existing SEO model
- Existing repositories

Follow:

- Clean Architecture
- SOLID
- Dependency Injection

---

# Goal

Persist extracted SEO pages into PostgreSQL.

Do not implement scoring.

Do not implement recommendations.

Only persistence.

---

# Database

Add Prisma Page model.

Relationship:

Scan (1)

↓

Page (Many)

Cascade delete.

Indexes on:

- scanId
- url
- statusCode

---

# Architecture

Implement:

Domain Entity

Repository Interface

Prisma Repository

Application Use Cases

Validation

---

# Store

General

- url
- finalUrl
- statusCode
- contentType

SEO

- title
- metaDescription
- canonical
- robots

Social

- openGraph
- twitter

Structure

- language
- charset
- viewport

Collections

Store efficiently:

- headings
- images
- links
- structuredData

Metadata

- crawlDepth
- parentUrl
- source
- warnings
- downloadDurationMs
- extractionDurationMs

createdAt

---

# Repository

Support:

create()

createMany()

findByScan()

findByUrl()

No update methods.

Pages are immutable.

---

# Validation

Use Zod.

---

# Tests

Cover:

- create page
- bulk insert
- immutable behavior
- validation
- repository
- use cases

Mock Prisma.

No real DB.

---

# Code Quality

- Production ready
- Strict TypeScript
- SOLID
- Clean Architecture
- Zero TypeScript errors
- Zero ESLint warnings

No breaking changes.

---

# Mandatory Completion Verification

Before considering the task complete, perform a full self-review against the Feature Specification, ADR, and this prompt.

## Requirements

- Verify every Acceptance Criterion from the feature specification has been fully implemented.
- Verify every requirement in this prompt has been implemented.
- Do not intentionally skip any feature.
- Implement all supporting types, tests, validation, repositories, migrations, and documentation.
- Leave no TODOs or placeholders.
- Ensure the implementation is production-ready.

## Final Verification Checklist

Confirm:

- ✅ Every Acceptance Criterion is implemented.
- ✅ Every requested file has been created.
- ✅ Prisma migration generated.
- ✅ Repository implemented.
- ✅ Use cases implemented.
- ✅ Tests added.
- ✅ Existing tests pass.
- ✅ TypeScript passes.
- ✅ ESLint passes.
- ✅ Production build succeeds.

If anything cannot be completed, explain why.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Prisma schema changes.
5. Migration summary.
6. Test summary.
7. Verification results.
8. Assumptions.
9. Recommendations before Story 9.
10. Architectural improvements.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion and mark it:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.