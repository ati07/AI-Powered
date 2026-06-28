# ADR-0007: Sitemap Discovery Strategy

## Status

Accepted

---

## Context

The crawler needs a reliable mechanism for discovering crawlable URLs.

XML Sitemaps are the industry-standard format supported by major search engines.

Many websites expose multiple sitemaps using a sitemap index.

---

## Decision

Implement a Sitemap Service responsible for:

* Downloading sitemap XML
* Parsing XML
* Supporting sitemap indexes
* Recursively discovering nested sitemaps
* Returning normalized URLs

The service must be independent from the Worker and reusable by future crawl components.

---

## Consequences

### Benefits

* Better crawl coverage
* Faster page discovery
* Standards-compliant behavior
* Reduced unnecessary crawling

### Tradeoffs

* XML parsing complexity
* Recursive processing
* Memory management for large websites

---

## Future

Future enhancements may include:

* Sitemap caching
* Incremental sitemap updates
* Image sitemaps
* Video sitemaps
* News sitemaps
* hreflang discovery
