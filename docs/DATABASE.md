# Database Design

## Overview

The platform follows a multi-tenant architecture.

A single Organization can manage multiple websites.

A user can belong to multiple organizations.

---

# Entity Relationship Diagram

User
│
├── Membership
│      │
│      ▼
│   Organization
│        │
│        ├── Website
│        │      │
│        │      ├── Scan
│        │      │      │
│        │      │      ├── Page
│        │      │      │      ├── Issue
│        │      │      │      └── Recommendation
│        │      │      │
│        │      │      └── Score
│        │      │
│        │      └── Report
│        │
│        └── Settings

---

# Models

## User

Managed by Clerk.

Fields:

* id
* clerkId
* email
* firstName
* lastName
* avatarUrl
* createdAt
* updatedAt

---

## Organization

Fields:

* id
* name
* slug
* logo
* timezone
* createdAt
* updatedAt

---

## Membership

Fields:

* id
* userId
* organizationId
* role

Roles:

* OWNER
* ADMIN
* MEMBER

---

## Website

Fields:

* id
* organizationId
* domain
* normalizedDomain
* favicon
* verified
* createdAt
* updatedAt

---

## Scan

Fields:

* id
* websiteId
* status
* startedAt
* finishedAt
* score

Status:

* Pending
* Running
* Completed
* Failed

---

## Page

Fields:

* id
* scanId
* url
* title
* html
* markdown
* statusCode
* createdAt

---

## Issue

Fields:

* id
* pageId
* category
* severity
* title
* description
* recommendation

Severity:

* Critical
* High
* Medium
* Low
* Info

---

## Recommendation

Fields:

* id
* issueId
* title
* description
* estimatedImpact

---

## Report

Fields:

* id
* websiteId
* scanId
* generatedAt
* pdfUrl

---

# Relationships

Organization

1 → Many Websites

Website

1 → Many Scans

Scan

1 → Many Pages

Page

1 → Many Issues

Issue

1 → Many Recommendations

---

# Indexes

Unique:

* Organization.slug
* Website.normalizedDomain (per organization)

Indexes:

* organizationId
* websiteId
* scanId
* pageId

---

# Future Tables

These are intentionally out of scope for MVP:

* Competitor
* Keyword
* KnowledgeGraph
* AI Prompt
* Billing
* Notification
* API Key
* Audit Log
