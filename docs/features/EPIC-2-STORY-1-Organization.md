# EPIC-2-STORY-1: Organization Management

## Epic

Workspace Management

## Story

As a signed-in user, I want to create and manage organizations so I can organize client websites into separate workspaces.

## Business Goal

Organizations are the top-level container for all customer data. Every website belongs to exactly one organization.

## Acceptance Criteria

### Create Organization

* User can create an organization.
* Organization name is required.
* Slug is generated automatically.
* Slug must be unique.
* Creator becomes OWNER.

### List Organizations

* User only sees organizations they belong to.
* Results are sorted alphabetically.

### Update Organization

* User can rename an organization.
* Slug remains unchanged after creation.

### Delete Organization

* Only OWNER can delete.
* Deleting removes associated memberships and websites.
* Confirmation dialog is required.

## Validation

* Name: 3–100 characters.
* Slug: lowercase, generated automatically.
* Duplicate organization names are not allowed for the same owner.

## UI Components

* Organization Switcher
* Create Organization Dialog
* Edit Organization Dialog
* Delete Confirmation Dialog

## API Endpoints

* POST /api/organizations
* GET /api/organizations
* PATCH /api/organizations/:id
* DELETE /api/organizations/:id

## Definition of Done

* CRUD operations work correctly.
* Validation is implemented.
* Unit tests pass.
* TypeScript has zero errors.
* ESLint passes.
