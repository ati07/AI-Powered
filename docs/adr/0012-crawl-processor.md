# ADR-0012
# Crawl Processor Orchestration

## Status

Accepted

---

## Context

The crawler has been implemented as independent modules.

Current modules include

- HttpClient
- RobotsService
- SitemapService
- URLDiscoveryService
- HtmlDownloader
- HtmlParser
- SeoExtractor
- Page Persistence

Each component is independently tested.

A coordinator is now required to execute them in sequence.

---

## Decision

Introduce a CrawlProcessor.

The CrawlProcessor contains no crawler business logic.

It only orchestrates existing services.

Pipeline

Run Scan

↓

Robots

↓

Sitemaps

↓

URL Discovery

↓

Queue

↓

Download HTML

↓

Parse HTML

↓

Extract SEO

↓

Persist Page

↓

Update Progress

↓

Repeat

↓

Complete Scan

The Background Worker executes CrawlProcessor.

Individual page failures never stop the crawl.

Only unrecoverable infrastructure failures fail the scan.

---

## Consequences

Advantages

- Simple orchestration

- Small services

- High testability

- Dependency injection

- SOLID compliance

Future stories can extend the pipeline without changing existing modules.

Upcoming modules include

- AI Visibility

- SEO Score

- Recommendations

- Report Generation