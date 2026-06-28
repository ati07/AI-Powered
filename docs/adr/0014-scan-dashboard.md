# ADR-0014
# Scan Dashboard

## Status

Accepted

---

## Context

The crawler now produces comprehensive scan results including page metadata, AI Visibility Scores, recommendations, and scan statistics.

Users require a unified interface to inspect these results without directly querying the database.

The dashboard should present both high-level scan information and detailed page-level analysis while reusing existing APIs and application services.

---

## Decision

Introduce a dedicated Scan Dashboard.

The dashboard will:

- display scan summary information
- display AI Visibility statistics
- display page results
- display recommendations
- support filtering
- support sorting
- support pagination

The dashboard is a presentation layer only.

Business logic remains in the application layer.

Existing repositories and use cases will be reused.

---

## Consequences

### Positive

- Clear visualization of crawl results
- Reuses existing APIs
- Separation of presentation and business logic
- Easy to extend in future stories

### Negative

- Larger client-side state management
- Additional API endpoints may be required for optimized pagination

---

## Alternatives Considered

### Display raw JSON

Rejected.

Users require an intuitive interface rather than raw data.

---

### Move filtering into the client

Rejected.

Filtering and pagination should be handled efficiently using server-side queries where practical.

---

## Architecture Impact

The dashboard consumes existing application services and repositories.

No crawler logic is introduced into the UI.

The crawler remains responsible for data collection, while the dashboard is responsible only for presenting persisted results.