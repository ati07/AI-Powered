# ADR-0011: Immutable Crawl Storage

## Status

Accepted

---

## Context

Every crawl represents a snapshot in time.

SEO changes between scans.

Historical comparisons require immutable storage.

---

## Decision

Each scan creates new Page records.

Never overwrite previous scan data.

Pages belong to one Scan.

---

## Benefits

Historical SEO tracking.

Reliable comparisons.

Simple architecture.

Auditability.

---

## Tradeoffs

Database grows over time.

Requires cleanup policies.

---

## Future

Compression.

Partitioning.

Cold storage.

Archiving.