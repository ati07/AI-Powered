# ADR-0010: HTML Parsing Strategy

## Status

Accepted

---

## Context

The crawler requires deterministic extraction of SEO information.

Rendering JavaScript is outside the scope of this engine.

---

## Decision

Use Cheerio.

Perform static HTML parsing.

Return immutable typed models.

No DOM mutation.

No scoring.

---

## Benefits

Fast.

Memory efficient.

Easy testing.

Deterministic.

---

## Tradeoffs

No client-side rendering.

Dynamic SPAs require future rendering support.

---

## Future

Playwright rendering.

Incremental extraction.

Streaming parser.

Schema validation.