# EPIC-3 STORY-9 — Crawl Processor

## Goal

Implement the production Crawl Processor that orchestrates the complete crawling pipeline.

This story connects all previously implemented crawler modules into one end-to-end workflow.

The Crawl Processor is responsible only for orchestration. It must not duplicate the logic already implemented inside the individual crawler services.

---

# Business Value

This story transforms the crawler from isolated components into a complete scanning engine.

After this story, a user should be able to:

* Run a scan
* Crawl an entire website
* Persist every crawled page
* Extract SEO metadata
* Track scan progress
* Finish with a completed scan

---

# Existing Components

The following components already exist and must be reused.

* HttpClient
* RobotsService
* SitemapService
* URLDiscoveryService
* HtmlDownloader
* HtmlParser
* SeoExtractor
* CreatePageUseCase
* Scan Repository
* Background Worker

No duplicate implementations should be created.

---

# Functional Requirements

## 1. Start Scan

The Crawl Processor receives a Scan.

Validate that the Scan exists.

Transition:

PENDING → RUNNING

Record the start time.

---

## 2. Robots.txt

Download robots.txt.

If robots.txt cannot be downloaded:

Continue.

Use default sitemap location.

Extract:

* Sitemap URLs
* Crawl Delay (future use)

---

## 3. Sitemap Discovery

If robots.txt contains sitemap URLs:

Use them.

Otherwise:

Fallback to:

https://domain/sitemap.xml

Discover all sitemap URLs recursively.

Deduplicate discovered URLs.

---

## 4. URL Discovery

Generate the crawl queue.

Sources include:

* Homepage
* Sitemap URLs

Queue requirements:

* FIFO
* Deduplicated
* Same-domain URLs only
* HTTP and HTTPS only

Track:

* URL
* Parent URL
* Discovery Source
* Depth

---

## 5. Crawl Pages

Process the queue sequentially.

For every URL:

Download HTML.

If download fails:

Skip page.

Continue queue.

Parse HTML.

Extract SEO metadata.

Persist page.

Update scan progress.

Continue until queue is empty.

---

## 6. Page Persistence

Persist every successfully crawled page.

Each page belongs to the current scan.

Persist:

* URL
* HTML metadata
* SEO metadata
* Internal links
* Canonical URL
* Meta tags
* Heading structure
* Open Graph
* JSON-LD

No page scoring yet.

---

## 7. Progress Tracking

Update scan progress after every page.

Track:

* Total pages discovered
* Pages processed
* Pages completed
* Failed pages

Example:

1 / 100

25 / 100

80 / 100

100 / 100

---

## 8. Completion

When queue finishes:

Transition

RUNNING → COMPLETED

Store:

* startedAt
* finishedAt
* duration
* pagesDiscovered
* pagesCrawled
* pagesFailed

---

## 9. Failure Handling

Fatal infrastructure failures should:

Transition:

RUNNING → FAILED

Persist:

* Error message
* Failure timestamp

Individual page failures must NOT fail the scan.

---

# Logging

Log the following events.

* Scan started
* Robots downloaded
* Sitemap discovered
* Queue created
* Page download started
* Page downloaded
* HTML parsed
* SEO extracted
* Page persisted
* Progress updated
* Scan completed
* Scan failed

---

# Out of Scope

This story does NOT include:

* AI Visibility analysis
* SEO scoring
* Recommendations
* Canonical validation
* Broken link analysis
* LLM scoring
* Report generation

These belong to future stories.

---

# Acceptance Criteria

A scan should:

✓ Transition to RUNNING

✓ Download robots.txt

✓ Discover sitemaps

✓ Build the crawl queue

✓ Download HTML pages

✓ Parse HTML

✓ Extract SEO metadata

✓ Persist pages

✓ Update progress continuously

✓ Continue after individual page failures

✓ Complete successfully

✓ Store crawl statistics

✓ Mark FAILED only for unrecoverable infrastructure errors

✓ Execute entirely through the Background Worker

✓ Reuse existing crawler modules

✓ Introduce no duplicated crawler logic

---

# Testing Requirements

Unit tests must cover:

* Successful crawl
* Missing robots.txt
* Missing sitemap
* Empty sitemap
* URL discovery
* Queue processing
* Download failures
* Parser failures
* Persistence failures
* Progress updates
* Successful completion
* Fatal failure
* Statistics generation

All existing tests must continue passing.

The project must build with:

* Zero TypeScript errors
* Zero ESLint warnings
* Successful production build
* All unit tests passing
