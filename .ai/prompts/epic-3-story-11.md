Task: Implement EPIC-3 STORY-11 — Scan Dashboard

Read these documents before writing any code:

docs/PRD.md
docs/AI_VISIBILITY_SCORE.md
docs/PAGE_MODEL.md
docs/features/EPIC-3-STORY-11-Scan-Dashboard.md
docs/adr/0014-scan-dashboard.md

Follow the existing Clean Architecture and project conventions.

## Requirements

Implement a production-ready Scan Dashboard.

Reuse existing modules:

* ScanRepository
* PageRepository
* PageScoreRepository
* Existing Scan APIs
* Existing Page APIs
* Existing AI Visibility Scoring
* Existing authentication and authorization
* Existing UI component library

Implement the following:

### 1. Scan Summary

Display:

* Scan Status
* Started At
* Finished At
* Duration
* Pages Discovered
* Pages Crawled
* Pages Failed

Display AI Visibility summary:

* Average Score
* Highest Score
* Lowest Score
* Pages Scored

---

### 2. Page Results Table

Display one row per crawled page.

Columns:

* URL
* AI Visibility Score
* Title
* Meta Description
* Canonical
* Indexability
* Structured Data
* Open Graph
* Last Crawled

Support server-side pagination.

---

### 3. Page Details Panel

Selecting a page should display:

* Complete SEO metadata
* AI Visibility Score
* Score Breakdown
* Deductions
* Recommendations

The details panel must reuse existing persisted data.

No recalculation should occur.

---

### 4. Filtering

Support filtering by:

* Score Range
* Indexability
* Missing Title
* Missing Meta Description
* Missing Canonical
* Missing Structured Data

Filtering should reuse existing repositories and APIs.

---

### 5. Sorting

Support sorting by:

* URL
* AI Visibility Score
* Title
* Crawl Time

---

### 6. Pagination

Implement server-side pagination.

Do not load all pages into the browser.

---

### 7. API

Create or extend API endpoints as required.

Reuse existing use cases.

Do not duplicate business logic.

---

### 8. UI

Use existing design system.

Implement:

* Summary cards
* Score badges
* Table
* Filters
* Empty state
* Loading state
* Error state

Responsive layout required.

---

### 9. Logging

Log:

* dashboard viewed
* page selected
* filters applied
* sorting changed
* pagination changed

---

## Testing

Add unit and integration tests covering:

* Dashboard rendering
* Summary cards
* Page table
* Pagination
* Filtering
* Sorting
* Recommendation panel
* Empty results
* Loading state
* Error state
* Authorization
* API responses

---

## Validation

Follow SOLID.

Follow Clean Architecture.

Use dependency injection.

Reuse all existing repositories and use cases.

Do not duplicate business logic.

Use Server Components where appropriate.

Use TanStack Query for client-side data fetching.

Before completing the task, verify the implementation against the feature specification.

---

# Mandatory Completion Verification

Before considering the task complete, perform a full self-review against the Feature Specification, ADR, and this prompt.

## Requirements

* Verify every Acceptance Criterion from the feature specification has been fully implemented.
* Verify every requirement in this prompt has been implemented.
* Do not intentionally skip any feature.
* Ensure all features are implemented; nothing is left out.
* Implement all supporting types, repositories, use cases, DTOs, validation, API routes, UI components, tests, and documentation.
* Leave no TODOs or placeholders.
* Ensure the implementation is production-ready.

---

## Final Verification Checklist

Confirm:

* ✅ Every Acceptance Criterion is implemented.
* ✅ Every requested file has been created.
* ✅ Repository changes implemented.
* ✅ Use cases implemented.
* ✅ API endpoints implemented.
* ✅ UI implemented.
* ✅ Tests added.
* ✅ Existing tests pass.
* ✅ TypeScript passes.
* ✅ ESLint passes.
* ✅ Production build succeeds.

If anything cannot be completed, explain why.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Database/schema changes.
5. API changes.
6. Test summary.
7. Verification results.
8. Assumptions.
9. Recommendations before Story 12.
10. Architectural improvements.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion from the feature specification and mark it:

* ✅ Implemented
* ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.
