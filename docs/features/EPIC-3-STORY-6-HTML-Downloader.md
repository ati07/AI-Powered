# EPIC-3 · STORY-6: HTML Downloader

## Epic

Crawl Engine

---

## Goal

Implement a production-ready HTML Downloader that retrieves HTML pages from the URL Queue.

The downloader is responsible only for downloading pages and validating responses.

It must not parse HTML or extract SEO information.

---

## User Story

As a user,

I want the crawler to reliably download HTML pages,

So that later stages can extract SEO and AI visibility information.

---

## Responsibilities

Download pages from the queue.

Validate responses.

Return HTML.

---

## Requirements

### HTTP

Use the shared HttpClient.

Respect:

- timeout
- retries
- redirects
- user agent

---

### Validation

Accept only:

- HTTP 200

Accept only content types:

- text/html
- application/xhtml+xml

Reject:

- PDF
- Images
- CSS
- JavaScript
- JSON
- XML
- ZIP

---

### Redirects

Allow redirects.

Return the final URL.

---

### Metadata

Return:

- original URL
- final URL
- status code
- content type
- response headers
- download duration
- html
- content length

---

### Errors

Do not throw.

Return typed failures.

---

### Logging

Log:

- download started
- download completed
- redirects
- rejected content types
- failures

---

### Testing

Cover:

- success
- redirects
- timeout
- retries
- invalid content types
- 404
- 500
- empty body
- large HTML

---

## Definition of Done

- Downloader implemented
- Metadata returned
- Typed errors
- Unit tests passing
- Production ready