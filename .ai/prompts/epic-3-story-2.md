# Task: Implement Background Worker (EPIC-3 · STORY-2)

## Context

Read these documents before writing any code:

* docs/ARCHITECTURE.md
* docs/CRAWLER.md
* docs/PAGE_MODEL.md
* docs/DATABASE.md
* docs/features/EPIC-3-STORY-2-Background-Worker.md
* docs/adr/0004-background-worker.md

Follow the existing project architecture:

* Next.js 15
* TypeScript
* Prisma
* PostgreSQL
* Clerk Authentication
* Clean Architecture
* Repository Pattern
* Domain-Driven Design
* SOLID Principles

Reuse the implementation patterns from:

* Organization
* Website
* Scan

Do not redesign existing modules.

---

# Goal

Implement the Background Worker infrastructure.

The worker processes pending scans independently from the web application.

Do **not** implement any crawling logic in this story.

---

# Architecture

Create a new worker module.

```
src/
    worker/
        index.ts
        worker.ts
        processors/
            job-processor.ts
            scan-processor.ts
```

---

# Job Processor

Create an interface:

```ts
export interface JobProcessor {
    process(scanId: string): Promise<void>;
}
```

The worker must depend only on this interface.

Never hardcode processing logic inside the worker.

---

# Scan Processor

Implement:

```
ScanProcessor
```

Responsibilities:

* Load scan.
* Transition:

PENDING

↓

RUNNING

↓

(wait 3 seconds)

↓

COMPLETED

If an exception occurs:

RUNNING

↓

FAILED

Store the error message.

No crawler logic yet.

Use a simulated delay.

---

# Worker

Implement:

```
ScanWorker
```

Responsibilities:

* Poll every 5 seconds.
* Find the next pending scan.
* Execute ScanProcessor.
* Handle exceptions.
* Continue polling.

Worker must never stop because of one failed scan.

---

# Repository

Extend ScanRepository.

Add:

* findNextPending()
* updateStatus()
* updateProgress()

Always return the oldest pending scan first.

---

# UI

Update Scan History.

Automatically refresh every 5 seconds.

Display:

* Pending
* Running
* Completed
* Failed

No manual refresh required.

---

# API

Reuse existing endpoints.

Do not introduce new routes.

---

# Logging

Create a lightweight logger abstraction.

```
src/shared/logger.ts
```

Methods:

* info()
* warn()
* error()

The worker must never call console.log directly.

Use the logger everywhere.

---

# Error Handling

The worker must:

* Catch all exceptions.
* Update scan status to FAILED.
* Save the error message.
* Continue processing future scans.

---

# Testing

Add unit tests for:

* Worker polling.
* Worker failure recovery.
* ScanProcessor.
* JobProcessor contract.
* Repository methods.
* Logger usage (mocked).

---

# Code Quality

Requirements:

* Follow SOLID.
* Follow Clean Architecture.
* No duplicated code.
* No Prisma usage outside Infrastructure.
* No business logic inside the worker loop.
* Strict TypeScript.
* Zero ESLint errors.
* Production-ready implementation only.

---

# Deliverables

Provide:

1. Summary of implemented features.
2. Created files.
3. Modified files.
4. Test summary.
5. Assumptions.
6. Recommendations before Story 3.3.

Run before completion:

* Prisma validation
* TypeScript
* ESLint
* Unit tests
* Production build

Do not leave TODO comments or placeholder implementations.

---

# Architectural Improvements

If you identify improvements that preserve backward compatibility and improve maintainability, implement them and explain them in the final summary.

Do not introduce breaking changes.
