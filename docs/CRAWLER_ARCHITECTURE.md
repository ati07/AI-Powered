# Crawler Architecture

## Overview

The crawler is responsible for discovering, downloading, and analyzing website content for SEO and AI visibility.

It is designed as a modular pipeline where each stage has a single responsibility.

The pipeline follows Clean Architecture principles and keeps crawling logic independent from the web application.

---

# High-Level Flow

```text
User
    │
    ▼
Run Scan
    │
    ▼
Create Scan Record (PENDING)
    │
    ▼
Background Worker
    │
    ▼
Scan Processor
    │
    ▼
Crawler Context
    │
    ▼
robots.txt
    │
    ▼
Sitemap Discovery
    │
    ▼
URL Discovery
    │
    ▼
URL Queue
    │
    ▼
HTML Downloader
    │
    ▼
Content Extraction
    │
    ▼
Page Storage
    │
    ▼
SEO Analysis
    │
    ▼
LLM Visibility Analysis
    │
    ▼
Generate Reports
```

---

# Responsibilities

## 1. Scan Management

Responsible for:

* creating scans
* tracking status
* recording progress
* recording errors

Status lifecycle:

```text
PENDING
    ↓
RUNNING
    ↓
COMPLETED

or

FAILED

or

CANCELLED
```

---

## 2. Background Worker

The worker continuously polls for pending scans.

Responsibilities:

* find pending scans
* process one scan
* update scan status
* log failures
* never stop because of one failed scan

---

## 3. Crawler Context

The crawler context contains shared dependencies used throughout the crawl.

Example:

```ts
interface CrawlerContext {
  scanId: string;
  websiteId: string;
  baseUrl: URL;

  httpClient: HttpClient;
  logger: ILogger;

  userAgent: string;

  maxPages: number;
  maxDepth: number;
  crawlDelay?: number;
}
```

The context is passed to every crawler component instead of many individual parameters.

---

## 4. Robots Service

Responsibilities:

* download robots.txt
* parse directives
* discover sitemap URLs
* expose crawl rules

Outputs:

* Allow rules
* Disallow rules
* Sitemap URLs
* Crawl Delay

---

## 5. Sitemap Service

Responsibilities:

* download sitemap XML
* parse XML
* support sitemap indexes
* recursively discover URLs
* deduplicate URLs

Outputs:

* normalized page URLs

---

## 6. URL Discovery

Combines URLs from multiple sources:

* Sitemap
* Homepage
* Internal links
* Canonical URLs

Produces one normalized crawl queue.

---

## 7. URL Queue

Responsible for:

* deduplication
* crawl ordering
* crawl depth
* maximum page limits

The queue becomes the source of truth for pages waiting to be crawled.

---

## 8. HTML Downloader

Downloads page HTML using the shared HttpClient.

Responsibilities:

* retries
* timeout handling
* redirects
* compression
* HTTP error handling

Returns raw HTML.

---

## 9. Content Extraction

Extracts structured information from HTML.

Examples:

* title
* meta description
* canonical URL
* headings
* internal links
* external links
* images
* structured data
* Open Graph tags
* robots meta tag

Stores extracted data in the Page model.

---

## 10. SEO Analysis

Calculates traditional SEO metrics.

Examples:

* title length
* missing description
* duplicate titles
* heading structure
* canonical issues
* indexability
* internal linking

---

## 11. AI Visibility Analysis

Calculates metrics used by Large Language Models.

Examples:

* entity coverage
* topical completeness
* content freshness
* FAQ coverage
* citation opportunities
* semantic relationships
* answer quality
* structured content
* AI visibility score

---

## 12. Reporting

Aggregates crawl data into dashboards.

Reports include:

* SEO Score
* AI Visibility Score
* Critical Issues
* Warnings
* Recommendations
* Historical Trends

---

# Component Structure

```text
src/
    crawler/
        core/
            crawler-context.ts
            crawl-config.ts
            limits.ts

        robots/
            downloader.ts
            parser.ts
            service.ts

        sitemap/
            downloader.ts
            parser.ts
            service.ts

        discovery/
            service.ts

        queue/
            queue.ts

        html/
            downloader.ts

        extraction/
            extractor.ts

        analysis/
            seo/
            ai/
```

---

# Design Principles

Every crawler module should:

* have one responsibility
* be independently testable
* use dependency injection
* avoid direct database access
* avoid framework-specific code
* use the shared HttpClient
* use the shared Logger
* never throw uncaught exceptions
* return typed results

---

# Future Enhancements

The architecture is designed to support:

* Parallel crawling
* Distributed workers
* Redis queues
* Incremental crawls
* Crawl scheduling
* JavaScript rendering
* Mobile crawling
* Screenshot generation
* Change detection
* AI-generated SEO recommendations
* Multi-language websites
* Large enterprise websites
