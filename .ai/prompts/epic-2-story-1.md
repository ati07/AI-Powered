# EPIC-2 · STORY-1 · Organization Management

## Context

You are working in the existing AI Visibility Platform repository.

Before making any changes, read and understand the following documents:

* docs/PRD.md
* docs/ROADMAP.md
* docs/DATABASE.md
* docs/AI_VISIBILITY_SCORE.md
* docs/features/EPIC-2-STORY-1-Organization.md

The project already follows:

* Next.js 15 (App Router)
* TypeScript
* Prisma
* PostgreSQL
* Clerk Authentication
* shadcn/ui
* Clean Architecture
* Feature-based folders

Follow the existing architecture and coding style.

---

# Goal

Implement **Organization Management**.

This is the first business module of the application.

The implementation should be production-ready, maintainable, and align with Clean Architecture.

---

# Scope

## Database

Create the following Prisma models:

### Organization

Fields:

* id
* name
* slug
* logoUrl (optional)
* description (optional)
* createdAt
* updatedAt

### Membership

Fields:

* id
* userId
* organizationId
* role
* createdAt

Create enum:

* MembershipRole

  * OWNER
  * ADMIN
  * MEMBER

Update the existing User model with the Membership relation.

Create all required Prisma relations and indexes.

Generate a Prisma migration.

---

# Domain Layer

Create:

* Organization Entity
* Membership Entity

Repository interfaces:

* OrganizationRepository
* MembershipRepository

---

# Application Layer

Implement use cases:

* CreateOrganization
* GetOrganizations
* UpdateOrganization
* DeleteOrganization

---

# Infrastructure Layer

Implement:

* PrismaOrganizationRepository
* PrismaMembershipRepository

---

# API Layer

Create REST endpoints:

POST /api/organizations

GET /api/organizations

PATCH /api/organizations/:id

DELETE /api/organizations/:id

---

# Validation

Use Zod.

Organization name:

* Required
* 3–100 characters
* Trim whitespace

Slug:

* Generated automatically
* Lowercase
* Unique
* Immutable

Prevent duplicate organization names for the same owner.

---

# UI

Create:

* Organization List Page
* Create Organization Dialog
* Edit Organization Dialog
* Delete Confirmation Dialog

Use shadcn/ui components.

Include:

* Loading state
* Empty state
* Error state
* Success toast

Responsive design is required.

---

# Permissions

Authenticated users only.

Creator automatically becomes OWNER.

Future roles (ADMIN, MEMBER) should already exist in the database but do not need UI yet.

---

# Testing

Add unit tests for:

* Slug generation
* Validation
* Organization use cases

---

# Quality Requirements

* Follow SOLID principles.
* Follow Clean Architecture.
* Do not duplicate business logic.
* Use repository pattern.
* Keep components reusable.
* No TypeScript errors.
* No ESLint errors.
* No `any` types.
* Production-ready code only.

---

# Deliverables

When complete, provide:

1. Summary of implemented features.
2. List of created files.
3. List of modified files.
4. Prisma migration details.
5. Any assumptions made.
6. Any recommendations before moving to Story 2.
