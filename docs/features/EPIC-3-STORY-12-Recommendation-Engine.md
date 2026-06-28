# EPIC 3

# STORY 12

# Recommendation Engine

---

## Goal

Generate actionable SEO recommendations for every crawled page.

Recommendations are deterministic.

No LLMs.

No external APIs.

No runtime generation.

---

## Requirements

Implement:

RecommendationEngine

The engine consumes:

- extracted SEO data
- AI Visibility score breakdown

Generate recommendations for:

### Title

- missing title
- title too short
- title too long

---

### Meta Description

- missing
- too short
- too long

---

### Headings

- missing H1
- multiple H1

---

### Canonical

- missing
- self-reference mismatch

---

### Indexability

- noindex

---

### Images

- missing alt text

---

### Structured Data

- missing

---

### Open Graph

- missing

---

### Twitter Cards

- missing

---

### Internal Linking

- low internal links

---

Each recommendation includes

- id
- severity
- title
- description
- fix
- category

---

Severity

Critical

Important

Suggestion

---

Recommendations must be deterministic.

---

Persist recommendations.

---

Dashboard must display persisted recommendations.

---

No runtime generation.

---

Tests

- every rule
- severity
- persistence
- retrieval
- dashboard rendering

---

Acceptance Criteria

✓ deterministic recommendations

✓ persisted

✓ dashboard reads persisted data

✓ no duplicate recommendations

✓ recommendation ordering

✓ recommendation severity

✓ tests

✓ build passes