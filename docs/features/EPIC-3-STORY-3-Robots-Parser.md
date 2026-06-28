# EPIC-3 · STORY-3: robots.txt Parser

## Epic

Crawl Engine

---

## Goal

Implement a production-ready robots.txt downloader and parser.

The crawler must respect robots.txt directives before discovering or downloading pages.

---

## User Story

As a user,

I want the crawler to understand robots.txt,

So that website scans follow standard crawler behavior and discover sitemap locations.

---

## Business Value

robots.txt is the first document requested during every website scan.

It defines crawl permissions and often exposes sitemap URLs.

Supporting robots.txt is essential for standards-compliant crawling.

---

## Acceptance Criteria

### Downloader

Attempt to download:

```
/robots.txt
```

using the shared HttpClient.

If the file does not exist (404), continue without failing the scan.

---

### Parser

Support the following directives:

* User-agent
* Allow
* Disallow
* Sitemap
* Crawl-delay

Ignore unsupported directives.

---

### Output

Return a structured object containing:

* userAgents
* allowRules
* disallowRules
* sitemapUrls
* crawlDelay

---

### Error Handling

Malformed robots.txt files must never fail the scan.

Return an empty result and log the parsing error.

---

### Logging

Log:

* Download started
* Download completed
* Parse completed
* Parse failures

Use the shared logger.

---

### Testing

Add unit tests covering:

* Empty robots.txt
* Missing robots.txt (404)
* Multiple User-agent sections
* Allow / Disallow parsing
* Multiple Sitemap entries
* Crawl-delay parsing
* Invalid syntax
* Mixed line endings
* Comments
* Blank lines

---

## Definition of Done

* Downloader implemented
* Parser implemented
* Unit tests passing
* Uses shared HttpClient
* Uses shared Logger
* Zero TypeScript errors
* Zero ESLint errors
* Production build succeeds
