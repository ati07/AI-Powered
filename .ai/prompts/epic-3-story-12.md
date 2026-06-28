Task: Implement EPIC-3 STORY-12 — Recommendation Engine

Read these documents before writing any code:

docs/PRD.md
docs/AI_VISIBILITY_SCORE.md
docs/PAGE_MODEL.md
docs/features/EPIC-3-STORY-12-Recommendation-Engine.md
docs/adr/0015-recommendation-engine.md

Follow the existing Clean Architecture and project conventions.

Requirements

Implement a production-ready Recommendation Engine.

Reuse existing modules:

- VisibilityScoreCalculator
- PageScoreEntity
- CrawlProcessor
- PageRepository
- PageScoreRepository
- ScanRepository
- Existing Dashboard

Implement:

1. RecommendationEngine

Generate deterministic recommendations from:

- extracted SEO data
- AI Visibility score breakdown

Rules:

Title
- missing
- too short
- too long

Meta Description
- missing
- too short
- too long

Headings
- missing H1
- multiple H1

Canonical
- missing
- incorrect canonical

Indexability
- noindex

Structured Data
- missing

Images
- missing alt text

Internal Links
- too few

Open Graph
- missing

Twitter Cards
- missing

Each recommendation must contain:

- id
- severity
- category
- title
- description
- fix

Severity:

- Critical
- Important
- Suggestion

Persist recommendations during crawling.

Do not generate recommendations at dashboard runtime.

Dashboard must read persisted recommendations only.

Prevent duplicate recommendations.

Recommendations should have deterministic ordering.

Testing

Add unit tests covering:

- every recommendation rule
- recommendation ordering
- severity
- persistence
- retrieval
- dashboard rendering

Validation

Follow SOLID.

Follow Clean Architecture.

Use dependency injection.

Reuse existing repositories.

Do not duplicate existing scoring logic.

Before completing the task, verify the implementation against the feature specification.

# Mandatory Completion Verification

Before considering the task complete, perform a full self-review against the Feature Specification, ADR, and this prompt.

## Requirements

- Verify every Acceptance Criterion from the feature specification has been fully implemented.
- Verify every requirement in this prompt has been implemented.
- Do not intentionally skip any feature.
- Ensure all features are implemented; nothing is left out.
- Implement all supporting types, repositories, use cases, migrations, API updates, UI updates, validation, tests, and documentation.
- Leave no TODOs or placeholders.
- Ensure the implementation is production-ready.

## Final Verification Checklist

Confirm:

- ✅ Every Acceptance Criterion is implemented.
- ✅ Every requested file has been created.
- ✅ Prisma migration generated.
- ✅ Repository implemented.
- ✅ Use cases implemented.
- ✅ API updated.
- ✅ Dashboard updated.
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
9. Recommendations before Story 13.
10. Architectural improvements.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion and mark it:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.