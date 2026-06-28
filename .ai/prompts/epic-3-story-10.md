Task: Implement EPIC-3 STORY-10 — AI Visibility Scoring Engine

Read these documents before writing any code:

docs/PRD.md
docs/AI_VISIBILITY_SCORE.md
docs/PAGE_MODEL.md
docs/SEO_EXTRACTION.md
docs/features/EPIC-3-STORY-10-AI-Visibility-Scoring.md
docs/adr/0013-ai-visibility-scoring.md

Follow the existing Clean Architecture and project conventions.

Requirements

Implement a production-ready AI Visibility Scoring Engine.

This story does NOT call any LLM.

The engine computes a deterministic score for every persisted Page using the extracted SEO metadata.

Reuse existing modules:

- PageRepository
- PageEntity
- ScanRepository
- Crawl Processor
- SeoExtractor

Implement:

1. VisibilityScoreCalculator

Calculate an overall score from 0–100.

The score should be composed of weighted subscores.

Example dimensions include:

- Title quality
- Meta description
- Heading structure
- Canonical
- Indexability
- Structured data
- Internal links
- Images with alt text
- Open Graph
- Twitter Cards

The weights must be configurable.

2. Score Breakdown

Return:

- overallScore
- category scores
- deductions
- recommendations

3. Recommendation Engine

Generate deterministic recommendations.

Examples:

- Missing title
- Title too long
- Missing H1
- Missing canonical
- Missing meta description
- Missing Open Graph
- Missing structured data

Do not use AI.

4. Page Score Persistence

Persist:

- overall score
- score breakdown
- recommendations
- scoring timestamp

5. Scan Summary

After every crawl finishes:

Compute:

- average score
- highest score
- lowest score
- pages scored

Persist summary statistics.

6. Logging

Log:

- scoring started
- page scored
- recommendations generated
- scan summary generated
- scoring completed

Testing

Add unit tests covering:

- perfect page
- missing title
- missing description
- missing H1
- duplicate headings
- canonical missing
- robots noindex
- structured data
- Open Graph
- Twitter Cards
- images without alt
- internal links
- score weighting
- recommendation generation
- summary statistics

Validation

Follow SOLID.

Follow Clean Architecture.

Use dependency injection.

Reuse existing Page entities.

Do not duplicate SEO extraction logic.

The Crawl Processor should invoke the scoring engine after each page is persisted.

Before completing the task, verify the implementation against the feature specification.

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
9. Recommendations before Story 11.
10. Architectural improvements.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion from the feature specification and mark it:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.