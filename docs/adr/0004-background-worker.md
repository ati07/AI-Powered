# ADR-0004: Background Worker Architecture

## Status

Accepted

---

## Context

Website scans are long-running operations.

Executing them inside a Next.js API route would introduce request timeouts, poor scalability, and tightly couple user requests to crawl execution.

The platform requires an execution engine that can process scans independently of the web application.

---

## Decision

Introduce a Background Worker responsible for processing pending scans.

Responsibilities:

- Poll the database for pending scans.
- Transition scan states.
- Execute scan processors.
- Handle failures.
- Update progress.

The worker does not contain crawl logic.

Instead, it delegates execution to a Job Processor implementation.

Current implementation:

ScanWorker

↓

ScanProcessor

↓

(Simulated work)

Future implementation:

ScanWorker

↓

CrawlProcessor

↓

Crawler

↓

Rule Engine

↓

AI Analysis

---

## Consequences

### Benefits

- Long-running jobs no longer block HTTP requests.
- Background processing is isolated.
- Easy to replace polling with Redis queues later.
- Easy to introduce multiple processors.

### Drawbacks

- Polling introduces a small delay.
- Worker requires a separate process.

---

## Future Evolution

Current:

Next.js

↓

Database

↓

Worker

Future:

Next.js

↓

Redis Queue

↓

Worker Pool

↓

Processors