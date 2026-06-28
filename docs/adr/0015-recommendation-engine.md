# ADR-0015: Recommendation Engine

## Status

Accepted

## Context

The AI Visibility Score identifies issues on a page.

Users also need actionable guidance explaining:

- why a score was deducted
- how to fix it
- how much impact the fix has

Recommendations should be deterministic.

No AI model should be used.

Recommendations must always be reproducible from stored page data.

## Decision

Recommendation generation will be separated from score calculation.

Architecture:

Page
      │
      ▼
VisibilityScoreCalculator
      │
      ▼
RecommendationEngine
      │
      ▼
Persist recommendations
      │
      ▼
Dashboard

Each recommendation contains:

- id
- severity
- title
- description
- fix
- category
- affected field

Severity:

- Critical
- Important
- Suggestion

Recommendations are generated only during crawling.

They are persisted.

Dashboard only reads stored recommendations.

No runtime recalculation.

## Consequences

Pros

- deterministic
- reproducible
- no runtime cost
- dashboard remains fast
- future API support

Cons

- recommendations require rescanning to update