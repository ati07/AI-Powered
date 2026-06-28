Task: Implement EPIC-3 STORY-9 — Crawl Processor

Read these documents before writing any code:

docs/PRD.md
docs/CRAWLER.md
docs/CRAWLER_ARCHITECTURE.md
docs/PAGE_MODEL.md
docs/features/EPIC-3-STORY-9-Crawl-Processor.md
docs/adr/0012-crawl-processor.md

Follow the existing Clean Architecture and project conventions.

Requirements

Implement a production-ready CrawlProcessor that replaces the simulated ScanProcessor.

Reuse all existing modules:

- HttpClient
- RobotsService
- SitemapService
- URLDiscoveryService
- HtmlDownloader
- HtmlParser
- SeoExtractor
- CreatePageUseCase
- ScanRepository

The CrawlProcessor must orchestrate the following pipeline:

1. Transition Scan:
   PENDING → RUNNING
   Persist startedAt.

2. Download robots.txt.

3. Extract sitemap URLs.

4. If no sitemap exists, fallback to:
   https://domain/sitemap.xml

5. Discover all sitemap URLs recursively.

6. Generate the crawl queue.

7. Process the queue sequentially.

For every URL:

- Download HTML.
- Skip failures.
- Parse HTML.
- Extract SEO.
- Persist the page.
- Update scan progress.

8. Continue until the queue is empty.

9. Transition:
   RUNNING → COMPLETED

Persist:

- pagesDiscovered
- pagesProcessed
- pagesFailed
- duration
- finishedAt

10. Fatal infrastructure failures must:

RUNNING → FAILED

Persist the failure reason.

Logging

Log every stage:

- Scan started
- Robots downloaded
- Sitemap discovered
- Queue created
- Page downloaded
- HTML parsed
- SEO extracted
- Page persisted
- Progress updated
- Scan completed
- Scan failed

Testing

Add unit tests covering:

- Successful crawl
- Missing robots.txt
- Missing sitemap
- Empty sitemap
- Download failures
- Parser failures
- Persistence failures
- Progress updates
- Successful completion
- Fatal failures

Validation

Follow SOLID.

Follow Clean Architecture.

Use dependency injection.

Do not duplicate existing crawler logic.

Reuse every existing service.

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
9. Recommendations before Story 9.
10. Architectural improvements.

Finally include:

## Feature Completion Matrix

List every Acceptance Criterion and mark it:

- ✅ Implemented
- ❌ Not Implemented

Do not mark the story complete until every Acceptance Criterion has been accounted for.