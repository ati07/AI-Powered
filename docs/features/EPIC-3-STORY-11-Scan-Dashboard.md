# EPIC-3 · STORY-11
# Scan Dashboard

## Overview

After a crawl completes, users need a centralized dashboard to review scan results.

The dashboard presents crawl statistics, AI Visibility Scores, page-level SEO information, and recommendations generated during the crawl.

The dashboard must provide a clear overview while allowing users to drill down into individual pages.

---

# Goals

Implement a production-ready Scan Dashboard that:

- displays overall scan statistics
- displays AI Visibility summary
- displays page-level results
- supports filtering and sorting
- supports pagination
- integrates with existing scan and page APIs

---

# Scope

This story includes:

- Scan summary dashboard
- Page results table
- AI Visibility score display
- Recommendation display
- Filtering
- Sorting
- Pagination

This story does NOT include:

- Historical comparisons
- Charts
- Exports
- Competitor analysis

---

# Functional Requirements

## Scan Summary

Display:

- Scan status
- Started At
- Finished At
- Duration
- Pages discovered
- Pages crawled
- Pages failed

Display AI Visibility summary:

- Average score
- Highest score
- Lowest score
- Pages scored

---

## Page Results Table

Display:

- URL
- Status
- AI Visibility Score
- Title
- Meta Description
- Canonical
- Indexability
- Structured Data
- Open Graph
- Last Crawled

---

## Recommendation Panel

Selecting a page displays:

- Score breakdown
- Deductions
- Recommendations

---

## Filtering

Support filtering by:

- Score range
- Indexability
- Missing title
- Missing description
- Missing canonical
- Missing structured data

---

## Sorting

Support sorting by:

- URL
- Score
- Title
- Crawl time

---

## Pagination

Support paginated results.

---

## Logging

Log:

- dashboard viewed
- filters applied
- page selected

---

# Non-Functional Requirements

- Server Components where appropriate
- TanStack Query for client data
- Responsive UI
- Accessibility compliant
- Clean Architecture
- No duplicated business logic

---

# Acceptance Criteria

- Scan summary displayed.
- AI Visibility summary displayed.
- Page table displayed.
- Recommendations visible.
- Filtering works.
- Sorting works.
- Pagination works.
- Existing APIs reused.
- Tests added.
- TypeScript passes.
- ESLint passes.
- Production build succeeds.

---

# Out of Scope

- Charts
- Trends
- Export
- Competitor comparison