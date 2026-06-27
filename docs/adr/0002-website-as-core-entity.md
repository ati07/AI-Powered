# ADR-0002: Website as the Core Business Entity

## Status

Accepted

## Context

The platform's purpose is to measure and improve AI Visibility.

Organizations exist to group customer data, but all analysis, scoring, reports, and recommendations are performed against websites.

## Decision

Website is the central business entity.

Future entities such as Scan, Page, Issue, Recommendation, AI Visibility Score, and Report will all belong to a Website.

## Consequences

Benefits:

* Clear ownership hierarchy
* Simple multi-tenancy
* Easier scaling
* Cleaner database relationships

Hierarchy:

User
└── Membership
└── Organization
└── Website
└── Scan
└── Page
└── Issue
