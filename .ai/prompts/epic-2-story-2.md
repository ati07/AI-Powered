# Task: Implement Website Management (Story 2)

## Context

You are working in the existing AI Visibility Platform repository.

Before writing any code, read these documents:

* docs/PRD.md
* docs/ROADMAP.md
* docs/DATABASE.md
* docs/AI_VISIBILITY_SCORE.md
* docs/COMPETITORS.md
* docs/features/EPIC-2-STORY-2-Website.md
* docs/adr/0002-website-as-core-entity.md

The project already follows:

* Next.js 15 (App Router)
* TypeScript
* Prisma
* PostgreSQL
* Clerk Authentication
* shadcn/ui
* Clean Architecture
* Feature-based folder structure
* Repository Pattern
* Domain-Driven Design principles

Follow the existing architecture and coding conventions.

---

# Goal

Implement the Website Management module.

A Website belongs to an Organization and will become the primary business entity for all future AI Visibility analysis.

The implementation must be production-ready, scalable, and consistent with the existing Organization module.

---

# Database

Create a new Prisma model:

## Website

Fields:

* id
* organizationId
* name
* domain
* normalizedDomain
* faviconUrl (optional)
* verified (default false)
* lastScanAt (nullable)
* createdAt
* updatedAt

Relationships:

* Organization (Many-to-One)

Constraints:

* Unique: (organizationId, normalizedDomain)
* Index: organizationId

Update the Organization model with the Website relation.

Generate a Prisma migration.

---

# Domain Layer

Create:

* WebsiteEntity
* Domain Value Object

The Domain Value Object must:

* Normalize domains
* Validate domains
* Remove http://
* Remove https://
* Remove [www](http://www).
* Remove trailing slash
* Convert to lowercase
* Trim whitespace

Example:

Input:

https://WWW.OpenAI.com/

Output:

openai.com

All normalization logic must live inside the Domain Value Object.

No duplicated normalization logic anywhere else.

---

# Repository Layer

Create:

IWebsiteRepository

Methods:

* create
* update
* delete
* findById
* findByNormalizedDomain
* findByOrganization
* exists
* count

Implement:

PrismaWebsiteRepository

---

# Application Layer

Implement use cases:

* CreateWebsiteUseCase
* GetWebsitesUseCase
* UpdateWebsiteUseCase
* DeleteWebsiteUseCase

Business Rules:

* Website name is required.
* Domain is required.
* Domain must be normalized before saving.
* Duplicate normalized domains are not allowed within the same organization.
* Users may only manage websites belonging to organizations where they are members.

Use Zod for validation.

---

# API Layer

Implement REST endpoints.

## Create Website

POST

/api/organizations/:organizationId/websites

---

## List Websites

GET

/api/organizations/:organizationId/websites

---

## Update Website

PATCH

/api/websites/:id

---

## Delete Website

DELETE

/api/websites/:id

---

Every endpoint must:

* Require authentication
* Verify organization membership
* Return proper HTTP status codes
* Return meaningful error messages

---

# UI

Create a new Website feature.

Include:

* Website List Page
* Create Website Dialog
* Edit Website Dialog
* Delete Website Dialog

Display:

* Website Name
* Domain
* Verification Status
* Last Scan
* Created Date

Use shadcn/ui components.

Include:

* Loading State
* Empty State
* Error State
* Success Toasts

Responsive layout required.

---

# Permissions

OWNER

* Create Website
* Edit Website
* Delete Website

ADMIN

* Create Website
* Edit Website
* Delete Website

MEMBER

* View Websites only

The UI should respect these permissions.

Do not only rely on API authorization.

---

# Testing

Add unit tests for:

* Domain Value Object
* Domain normalization
* Domain validation
* WebsiteEntity
* Website validation
* CreateWebsiteUseCase
* UpdateWebsiteUseCase
* DeleteWebsiteUseCase

Follow the same testing style used in Story 1.

---

# Code Quality

Requirements:

* Follow SOLID principles.
* Follow Clean Architecture.
* Keep business logic inside the Domain/Application layers.
* No Prisma usage outside Infrastructure.
* No duplicated validation logic.
* No duplicated normalization logic.
* No `any` types.
* Strict TypeScript.
* ESLint passes.
* Build succeeds.
* Production-ready implementation only.

---

# Deliverables

When implementation is complete, provide:

1. Summary of implemented features.
2. List of created files.
3. List of modified files.
4. Prisma migration details.
5. Test summary.
6. Any assumptions made.
7. Recommendations before Story 3.

Before finishing:

* Run Prisma migration.
* Run TypeScript checks.
* Run ESLint.
* Run all tests.
* Verify the project builds successfully.

Do not leave TODO comments or placeholder implementations.


If you identify architectural improvements that maintain backward compatibility and improve long-term maintainability, implement them and explain your reasoning in the final summary. Do not introduce breaking changes or unnecessary complexity.