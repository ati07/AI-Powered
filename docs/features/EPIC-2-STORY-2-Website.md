# EPIC-2-STORY-2: Website Management

## Epic

Workspace Management

---

## Story

As an organization member, I want to add and manage websites so that I can analyze their AI Visibility.

---

## Business Goal

A Website is the core business entity of the platform.

All future scans, pages, issues, recommendations, reports, and AI Visibility Scores belong to a Website.

---

## User Story

As a signed-in user,

I want to register a website,

So I can monitor and improve its AI Visibility.

---

## Acceptance Criteria

### Create Website

* User can add a website to an organization.
* Website name is required.
* Domain is required.
* Domain is normalized automatically.
* Duplicate domains are not allowed within the same organization.

### List Websites

* User can see all websites for the selected organization.
* Display website name, domain, verification status, and creation date.

### Update Website

* User can update website name.
* User can update domain.
* Domain remains unique.

### Delete Website

* User can delete a website.
* Confirmation dialog is required.

---

## Validation

Website Name

* Required
* 3–100 characters

Domain

* Required
* Must be a valid domain
* Store normalized domain
* Remove http/https
* Remove www
* Convert to lowercase

Examples:

https://www.OpenAI.com

↓

openai.com

---

## Database

Website

Fields

* id
* organizationId
* name
* domain
* normalizedDomain
* faviconUrl
* verified
* createdAt
* updatedAt

---

## Permissions

Authenticated users only.

Users may only access websites belonging to organizations they are members of.

Only OWNER and ADMIN may create, edit, or delete websites.

MEMBER has read-only access.

---

## API

POST /api/websites

GET /api/websites

PATCH /api/websites/:id

DELETE /api/websites/:id

---

## UI

Create Website Dialog

Edit Website Dialog

Delete Website Dialog

Website Grid

Empty State

Loading State

Error State

---

## Definition of Done

* CRUD works correctly.
* Validation implemented.
* Responsive UI.
* Unit tests pass.
* TypeScript has zero errors.
* ESLint passes.
* Build succeeds.
