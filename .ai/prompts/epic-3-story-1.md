# Task: Implement Scan Management (EPIC-3 · STORY-1)

## Context

Read before coding:

* docs/ARCHITECTURE.md
* docs/CRAWLER.md
* docs/PAGE_MODEL.md
* docs/features/EPIC-3-STORY-1-Scan-Management.md
* docs/DATABASE.md

Follow the existing project architecture:

* Next.js 15
* TypeScript
* Prisma
* PostgreSQL
* Clean Architecture
* Repository Pattern
* Domain-Driven Design

Reuse patterns established in the Organization and Website modules.

---

## Goal

Implement Scan Management.

This story introduces the Scan entity and its lifecycle.

Do **not** implement crawling logic yet.

---

## Database

Add:

### Enum

ScanStatus

* PENDING
* RUNNING
* COMPLETED
* FAILED
* CANCELLED

### Model

Scan

Fields:

* id
* websiteId
* status
* startedAt
* finishedAt
* pagesFound (default 0)
* pagesCrawled (default 0)
* error
* createdAt
* updatedAt

Relationship:

* Website → Scans

Generate a Prisma migration.

---

## Domain Layer

Create:

* ScanEntity

Methods:

* start()
* complete()
* fail(error)
* cancel()
* incrementPagesFound()
* incrementPagesCrawled()

Prevent invalid state transitions.

---

## Repository Layer

Create:

* IScanRepository
* PrismaScanRepository

---

## Application Layer

Implement:

* CreateScanUseCase
* GetScansUseCase
* GetScanUseCase

Business rules:

* Initial status = PENDING.
* Only one RUNNING scan per website.
* Validate website ownership and membership.
* OWNER and ADMIN can create scans.
* MEMBER is read-only.

---

## API

Create:

POST /api/websites/:websiteId/scans

GET /api/websites/:websiteId/scans

GET /api/scans/:id

Return proper HTTP status codes and meaningful error messages.

---

## UI

Add to the Website dashboard:

* Run Scan button
* Scan History list
* Status badges
* Pages Found
* Pages Crawled
* Started At
* Finished At
* Duration

Include loading, empty, and error states.

---

## Testing

Add unit tests for:

* ScanEntity
* State transitions
* CreateScanUseCase
* Validation
* Repository behavior

---

## Quality Requirements

* Follow SOLID principles.
* Keep business logic in the Domain/Application layers.
* No Prisma usage outside Infrastructure.
* No duplicated logic.
* Strict TypeScript.
* Zero ESLint errors.
* Build passes.
* Production-ready implementation only.

---

## Deliverables

Provide:

1. Summary of implementation.
2. Created files.
3. Modified files.
4. Prisma migration details.
5. Test results.
6. Assumptions made.
7. Recommendations before Story 3.2.
