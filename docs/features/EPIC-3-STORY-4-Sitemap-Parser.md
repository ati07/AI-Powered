# EPIC-3 · STORY-4: Sitemap Parser

## Epic

Crawl Engine

---

## Goal

Implement a production-ready XML Sitemap parser capable of discovering crawlable URLs from standard sitemaps and sitemap indexes.

The parser must integrate with the Robots Service so that sitemap URLs discovered in `robots.txt` become crawl entry points.

---

## User Story

As a user,

I want the crawler to automatically discover all URLs exposed through XML sitemaps,

So that scans cover the complete public website.

---

## Business Value

XML sitemaps are the primary mechanism websites use to expose their important pages.

Supporting sitemap parsing dramatically improves crawl coverage while reducing unnecessary page discovery.

---

## Acceptance Criteria

### Downloader

Download sitemap XML using the shared HttpClient.

Support:

* application/xml
* text/xml
* application/octet-stream

Handle gzip-compressed responses if supported by the server.

---

### Supported Formats

Support both:

* `<urlset>`
* `<sitemapindex>`

---

### URL Extraction

Extract:

* loc
* lastmod
* changefreq
* priority

Only `loc` is required.

---

### Sitemap Index

Support nested sitemap indexes.

Recursively download child sitemaps.

---

### Validation

Accept only:

* HTTP
* HTTPS

Ignore:

* empty URLs
* invalid URLs
* duplicate URLs

---

### Limits

Support configurable limits:

* Maximum recursion depth
* Maximum sitemap files
* Maximum discovered URLs

Abort parsing gracefully when limits are exceeded.

---

### Error Handling

Malformed XML must never fail the scan.

Invalid child sitemaps should be skipped.

---

### Logging

Log:

* Download started
* Download completed
* URLs discovered
* Nested sitemap discovered
* Parsing failures
* Limit exceeded

---

### Testing

Add tests covering:

* Standard sitemap
* Sitemap index
* Nested sitemap indexes
* Duplicate URLs
* Invalid XML
* Empty sitemap
* Invalid URLs
* Maximum depth
* Maximum sitemap limit
* Maximum URL limit

---

## Definition of Done

* Downloader implemented
* Parser implemented
* Recursive parsing implemented
* Limits implemented
* Unit tests passing
* Production ready
