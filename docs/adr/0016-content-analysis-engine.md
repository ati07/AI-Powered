# ADR-0016: Content Analysis Engine

## Status

Accepted

---

## Context

EPIC 3 completed the technical SEO crawler.

The crawler is now capable of:

- Crawling websites
- Downloading HTML
- Parsing HTML
- Extracting technical SEO
- Calculating AI Visibility Scores
- Generating recommendations
- Persisting pages
- Displaying scan dashboards

Technical SEO alone is insufficient for modern search engines and AI-powered search experiences.

Google Search, AI Overviews, ChatGPT, Gemini, Claude, and Perplexity increasingly evaluate the quality, usefulness, and structure of page content.

The platform requires a dedicated Content Analysis Engine responsible for evaluating content quality before visibility scoring.

The analysis must be deterministic, reproducible, and independent of external AI services.

---

## Decision

Introduce a dedicated Content Analysis Engine.

The engine executes after HTML parsing and before AI Visibility Scoring.

It generates structured content metrics that are consumed by:

- AI Visibility Scoring
- Recommendation Engine
- Future AI-powered features

The engine performs analysis only.

It never modifies content.

It never generates recommendations.

It never calculates scores.

---

## Architecture

The Content Analysis Engine acts as an orchestrator.

Analysis logic must be separated into specialized analyzers.

Recommended structure:

src/content-analysis/
├── analyzers/
│   ├── readability-analyzer.ts
│   ├── heading-analyzer.ts
│   ├── keyword-analyzer.ts
│   ├── structure-analyzer.ts
│   ├── media-analyzer.ts
│   ├── eeat-analyzer.ts
│   ├── ai-answerability-analyzer.ts
│   └── freshness-analyzer.ts
│
├── types.ts
├── content-analysis-engine.ts
└── index.ts

Each analyzer owns exactly one responsibility.

Every analyzer exposes:

analyze(...): AnalysisResult

The ContentAnalysisEngine only coordinates analyzers and merges their results into a single immutable ContentAnalysisResult.

---

## Consequences

### Advantages

- Single Responsibility Principle
- High testability
- Easier maintenance
- Better extensibility
- Independent analyzer evolution
- Smaller, focused classes

### Disadvantages

- More files
- Slightly more orchestration code

---

## Alternatives Considered

### Single monolithic analyzer

Rejected.

Reasons:

- Difficult to maintain
- Difficult to test
- Violates SRP
- Hard to extend

---

### AI-generated analysis

Rejected.

Reasons:

- Non-deterministic
- Expensive
- Slow
- Difficult to test

---

### Browser-based analysis

Rejected.

Reasons:

- Requires JavaScript execution
- Higher infrastructure cost
- Slower crawling

---

## References

- Google SEO Starter Guide
- Google "Succeeding in AI Search"
- Google Helpful Content Guidelines
- Google Search Quality Evaluator Guidelines
- E-E-A-T Documentation