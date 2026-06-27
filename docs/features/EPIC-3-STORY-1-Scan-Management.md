# EPIC-3-STORY-1: Scan Management

## Epic

Crawl Engine

---

## Story

As a user, I want to start a scan for a website so that the platform can crawl and analyze its pages.

---

## Business Goal

A Scan represents a single crawl execution.

Every discovered page, issue, recommendation, and AI Visibility Score belongs to one Scan.

---

## User Story

As a user,

I want to start a website scan,

So I can analyze the latest version of my website.

---

## Acceptance Criteria

### Create Scan

- User can start a scan.
- Scan belongs to one Website.
- Initial status is PENDING.

### Execute Scan

- Scan moves to RUNNING.
- Start time is recorded.

### Complete Scan

- Status becomes COMPLETED.
- Finish time is recorded.

### Failed Scan

- Status becomes FAILED.
- Error message is stored.

### Cancel Scan

- Status becomes CANCELLED.

---

## Scan Lifecycle

PENDING

↓

RUNNING

↓

COMPLETED

or

FAILED

or

CANCELLED

---

## Database

Scan

Fields

- id
- websiteId
- status
- startedAt
- finishedAt
- error
- createdAt
- updatedAt

---

## Status Enum

PENDING

RUNNING

COMPLETED

FAILED

CANCELLED

---

## API

POST /api/websites/:websiteId/scans

GET /api/websites/:websiteId/scans

GET /api/scans/:id

---

## UI

Start Scan Button

Scan History Table

Current Status Badge

Progress Indicator

---

## Permissions

OWNER

ADMIN

can start scans.

MEMBER

can only view scan history.

---

## Definition of Done

- Scan lifecycle implemented.
- API completed.
- UI completed.
- Unit tests added.
- Build passes.