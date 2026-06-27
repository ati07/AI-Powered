# ADR-0003: Scan Lifecycle

## Status

Accepted

## Context

A website will be scanned many times.

Each scan represents one snapshot of the website.

All pages and future analysis belong to a Scan instead of directly to a Website.

## Decision

Introduce a Scan entity.

Hierarchy:

Website

↓

Scan

↓

Page

↓

Issue

↓

Recommendation

↓

AI Visibility Score

Scan Status:

PENDING

RUNNING

COMPLETED

FAILED

CANCELLED

## Consequences

- Historical scans become possible.
- Reports can compare different scans.
- Future scheduled scans become easy.
- Rollbacks and debugging become possible.