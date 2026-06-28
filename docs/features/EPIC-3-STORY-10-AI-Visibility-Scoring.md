# EPIC-3 · STORY-10
# AI Visibility Scoring

## Overview

After pages have been crawled, downloaded, parsed, and persisted, the platform must calculate an AI Visibility Score for every page.

The score represents how well a page is optimized for AI search engines, LLMs, and modern search experiences.

The scoring engine must be deterministic.

It must never call an LLM.

It must only analyze the SEO metadata already extracted by the crawler.

---

# Goals

Implement a production-ready scoring engine that:

- calculates an AI Visibility Score (0–100)
- provides category-level scoring
- generates deterministic recommendations
- persists scores for every page
- computes scan-level summary statistics
- integrates into the Crawl Processor pipeline

---

# Scope

This story includes:

- Visibility score calculation
- Weighted scoring model
- Recommendation generation
- Page score persistence
- Scan summary generation

This story does NOT include:

- AI-generated recommendations
- Competitor comparison
- Historical trend analysis
- Dashboard visualization

---

# Functional Requirements

## Visibility Score Calculator

Create a scoring engine capable of calculating:

- Overall Score (0–100)

Category scores including:

- Title
- Meta Description
- Heading Structure
- Canonical
- Indexability
- Structured Data
- Internal Linking
- Images
- Open Graph
- Twitter Cards

Weights must be configurable.

---

## Recommendation Engine

Generate deterministic recommendations.

Examples:

- Missing title
- Missing meta description
- Missing H1
- Missing canonical
- Missing structured data
- Missing Open Graph
- Missing Twitter Cards
- Images missing alt text
- Multiple H1 tags
- Excessively long title

No AI generation is allowed.

---

## Persistence

Persist for every Page:

- overallScore
- categoryScores
- deductions
- recommendations
- scoredAt

---

## Scan Summary

After crawl completion compute:

- average score
- highest score
- lowest score
- total pages scored

Persist these values on the Scan.

---

## Crawl Integration

After CreatePageUseCase succeeds:

Run:

VisibilityScoreCalculator

Persist score before processing the next page.

---

## Logging

Log:

- scoring started
- page scored
- recommendation generated
- scan summary calculated
- scoring completed

---

# Non-Functional Requirements

- Deterministic scoring
- No randomness
- No external API calls
- No LLM usage
- Dependency Injection
- SOLID principles
- Clean Architecture
- Unit tested
- Immutable domain entities

---

# Acceptance Criteria

- Overall score is calculated.
- Category scores are calculated.
- Configurable weights are supported.
- Recommendations are generated.
- Recommendations are deterministic.
- Page scores are persisted.
- Scan summary statistics are persisted.
- Crawl Processor invokes scoring.
- Logging implemented.
- Unit tests cover scoring logic.
- Existing tests continue passing.
- TypeScript compiles.
- ESLint passes.
- Production build succeeds.

---

# Out of Scope

- AI-generated recommendations
- Competitor scoring
- Historical analytics
- Dashboard charts
- PDF reports
- CSV exports