# EPIC 4 · STORY 1

# Content Analysis Engine

---

# Goal

Build a deterministic Content Analysis Engine that evaluates page content quality according to Google's SEO recommendations and modern AI-search best practices.

The engine must not use any AI models or external APIs.

---

# Functional Requirements

Implement the Content Analysis Engine as an orchestrator.

Do not place all analysis logic inside one class.

Split the implementation into specialized analyzers.

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

Each analyzer must have a single responsibility.

---

## Readability Analyzer

Analyze:

- Word count
- Sentence count
- Paragraph count
- Reading time
- Average sentence length
- Reading level

---

## Heading Analyzer

Analyze:

- Heading hierarchy
- Heading coverage
- Missing H1
- Duplicate headings

---

## Keyword Analyzer

Analyze:

- Keyword density
- Keyword repetition

---

## Structure Analyzer

Analyze:

- Lists
- Tables
- FAQ sections
- Internal links
- External links
- Content depth

---

## Media Analyzer

Analyze:

- Image count
- Missing alt text
- Image-to-text ratio

---

## E-E-A-T Analyzer

Analyze:

- Author detection
- Contact information
- Organization information
- Trust signals

---

## AI Answerability Analyzer

Analyze:

- Question & Answer sections
- Definition blocks
- Lists
- Tables
- Chunkable content
- Citation-friendly formatting

---

## Freshness Analyzer

Analyze:

- Published date
- Modified date
- Content freshness

---

# Output

Return an immutable ContentAnalysisResult.

The result should contain individual analysis sections:

- readability
- headings
- keywords
- structure
- media
- eeat
- aiAnswerability
- freshness

---

# Non-functional Requirements

- Deterministic
- Pure analysis
- No external APIs
- No AI
- Immutable output
- Fully typed
- Unit-testable
- Production ready

---

# Acceptance Criteria

- Every analyzer implemented
- Engine orchestrates analyzers
- Never throws exceptions
- Handles malformed HTML
- Handles empty pages
- Handles very large pages
- Returns immutable result
- Fully typed
- Comprehensive unit tests
- No duplicated logic

---

# Out of Scope

- Recommendations
- Visibility scoring
- Persistence
- Database changes
- Dashboard changes
- AI integrations