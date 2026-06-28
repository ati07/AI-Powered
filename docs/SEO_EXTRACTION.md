# SEO Extraction Pipeline

## Goal

Convert raw HTML into structured SEO data.

---

Pipeline

HTML
 │
 ▼
HTML Parser
 │
 ▼
DOM
 │
 ├── Title
 ├── Meta Description
 ├── Canonical
 ├── Robots Meta
 ├── OpenGraph
 ├── Twitter Cards
 ├── H1-H6
 ├── Images
 ├── Internal Links
 ├── External Links
 ├── Structured Data
 ├── Language
 ├── Charset
 └── Viewport

 ▼

Structured PageSEO Object

 ▼

Database

 ▼

SEO Score Engine

 ▼

AI Visibility Engine

---

Principles

- Pure extraction
- No scoring
- No recommendations
- No database access
- No networking
- Deterministic