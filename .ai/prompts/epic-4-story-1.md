Task: Implement EPIC-4 STORY-1 — Content Analysis Engine

Read these documents before writing any code:

docs/PRD.md

docs/CRAWLER.md

docs/CRAWLER_ARCHITECTURE.md

docs/features/EPIC-4-STORY-1-Content-Analysis-Engine.md

docs/adr/0016-content-analysis-engine.md

Follow the existing Clean Architecture and project conventions.

---

Requirements

Implement a production-ready Content Analysis Engine.

The Content Analysis Engine must be an orchestrator.

Do NOT implement all analysis logic inside one class.

Split the implementation into specialized analyzers.

Recommended project structure:

src/content-analysis/
├── analyzers/
│   ├── readability-analyzer.ts
│   ├── heading-analyzer.ts
│   ├── keyword-analyzer.ts
│   ├── structure-analyzer.ts
│   ├── media-analyzer.ts
│   ├── eeat-analyzer.ts
│   ├── ai-answerability-analyzer.ts
│   └── freshness-analyzer.ts
│
├── types.ts
├── content-analysis-engine.ts
└── index.ts

Each analyzer must expose:

analyze(...)

The ContentAnalysisEngine must only orchestrate analyzers and merge their outputs.

Reuse existing HtmlParser output whenever possible.

Avoid duplicating parser logic.

---

Implement the following analyzers.

Readability Analyzer

- Word count
- Sentence count
- Paragraph count
- Reading time
- Average sentence length
- Reading level

Heading Analyzer

- Heading hierarchy
- Heading coverage
- Missing H1
- Duplicate headings

Keyword Analyzer

- Keyword density
- Keyword repetition

Structure Analyzer

- Lists
- Tables
- FAQ detection
- Internal links
- External links
- Content depth

Media Analyzer

- Image count
- Missing alt text
- Image/text ratio

E-E-A-T Analyzer

- Author detection
- Contact information
- Organization information
- Trust indicators

AI Answerability Analyzer

- Question/Answer format
- Definitions
- Lists
- Tables
- Chunkable content
- Citation-friendly formatting

Freshness Analyzer

- Published date
- Modified date
- Freshness detection

---

Do not implement:

- Recommendations
- Visibility scoring
- Persistence
- Database changes
- UI changes
- AI integrations

---

Testing

Add comprehensive unit tests covering:

- Empty pages
- Large pages
- Malformed HTML
- Duplicate headings
- Missing headings
- Keyword density
- Reading time
- Lists
- Tables
- FAQ sections
- Images
- Missing alt text
- E-E-A-T detection
- AI answerability detection
- Freshness detection
- Edge cases

---

Validation

Follow SOLID.

Follow Clean Architecture.

Use dependency injection where appropriate.

Avoid duplicated logic.

Reuse existing parser structures whenever possible.

Before completing the task, verify the implementation against the feature specification.

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

---

## Final Verification Checklist

Confirm:

- ✅ Every Acceptance Criterion is implemented.
- ✅ Every requested file has been created.
- ✅ Supporting types implemented.
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
4. Database/schema changes.
5. Migration summary.
6. Test summary.
7. Verification results.
8. Assumptions.
9. Recommendations before Story 2.
10. Architectural improvements.

Ensure all requested features are implemented and nothing from the feature specification, ADR, or this prompt has been omitted.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion and mark it:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.