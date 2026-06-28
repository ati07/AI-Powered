# ADR-0006: robots.txt Processing Strategy

## Status

Accepted

---

## Context

The crawler requires a standard mechanism for discovering crawl rules and sitemap locations.

robots.txt is the industry-standard protocol for communicating crawler policies.

---

## Decision

Every website scan begins by requesting:

```
/robots.txt
```

The parser will:

* Read User-agent groups.
* Parse Allow rules.
* Parse Disallow rules.
* Parse Sitemap directives.
* Parse Crawl-delay.

Missing or malformed robots.txt files must never fail a scan.

The crawler will continue using default behavior when robots.txt is unavailable.

---

## Consequences

### Benefits

* Standards-compliant crawling
* Automatic sitemap discovery
* Foundation for crawl permissions

### Tradeoffs

* One additional HTTP request
* Additional parser complexity

---

## Future

Future enhancements may include:

* Wildcard pattern matching
* User-agent prioritization
* robots.txt caching
* Conditional requests (ETag / Last-Modified)
* Per-domain crawl policies
