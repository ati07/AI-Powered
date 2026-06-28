# ADR-0013
# AI Visibility Scoring Engine

## Status

Accepted

---

## Context

The crawler now downloads, parses, extracts SEO metadata, and persists every page.

Raw metadata alone is insufficient for users to understand page quality.

The platform requires a deterministic scoring engine that transforms extracted SEO signals into a single AI Visibility Score while remaining fully explainable.

The scoring engine must avoid any dependency on LLMs or external services so that scores remain stable, reproducible, and inexpensive to calculate.

---

## Decision

Introduce a dedicated AI Visibility Scoring Engine.

The scoring engine will operate after a page has been successfully persisted by the Crawl Processor.

The engine will:

- calculate an overall score
- calculate category scores
- generate deterministic recommendations
- persist scoring results
- compute scan summary statistics

Scores are calculated solely from persisted SEO metadata.

The Crawl Processor orchestrates scoring but contains no scoring logic.

Scoring rules are encapsulated inside dedicated scoring services.

Weights are configurable.

Recommendations are deterministic.

---

## Consequences

### Positive

- Deterministic results
- Explainable scoring
- Easy to test
- Easily configurable
- No external dependencies
- Low execution cost
- Reusable scoring engine

### Negative

- Scores require manual tuning
- Rule maintenance increases over time
- New SEO signals require updating the scoring engine

---

## Alternatives Considered

### Calculate scores inside the Crawl Processor

Rejected.

The Crawl Processor should only orchestrate workflow.

Business rules belong inside dedicated services.

---

### Store only raw SEO metadata

Rejected.

Users require actionable insights rather than raw extracted values.

---

### Use an LLM for scoring

Rejected.

LLMs produce non-deterministic output, introduce latency, increase cost, and complicate testing.

Deterministic rule-based scoring is more appropriate for this stage of the platform.

---

## Architecture Impact

The Crawl Processor becomes:

Download HTML

↓

Parse HTML

↓

Extract SEO

↓

Persist Page

↓

Calculate AI Visibility Score

↓

Persist Score

↓

Continue Crawl

The scoring engine becomes a reusable service that can later support dashboards, reports, benchmarking, and trend analysis without modifying the crawler pipeline.