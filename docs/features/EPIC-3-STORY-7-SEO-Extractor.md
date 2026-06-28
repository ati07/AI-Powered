# EPIC-3 · STORY-7: HTML Parser & SEO Extractor

## Epic

Crawl Engine

---

## Goal

Implement a production-ready HTML parsing and SEO extraction engine.

The extractor converts HTML into a structured SEO model.

---

## User Story

As a user,

I want the crawler to understand every page,

So AI Visibility and SEO scoring can analyze it.

---

## Responsibilities

Parse HTML.

Extract SEO information.

Return a structured model.

---

## Parser

Use Cheerio.

No browser.

No Playwright.

No Puppeteer.

---

## Extract

Title

Meta Description

Canonical

Meta Robots

OpenGraph

Twitter Cards

Language

Charset

Viewport

Headings

Images

Internal Links

External Links

Structured Data

JSON-LD

Microdata

---

## Links

Normalize URLs.

Ignore:

mailto:

tel:

javascript:

fragments

---

## Images

Extract:

src

alt

title

loading

width

height

---

## Headings

Return:

H1

H2

H3

H4

H5

H6

---

## Structured Data

Extract:

application/ld+json

Return raw JSON.

---

## Output

Return one strongly typed object.

Never throw.

---

## Logging

Log:

start

finish

counts

warnings

---

## Testing

Cover:

missing title

multiple H1

canonical

OpenGraph

Twitter

malformed HTML

empty HTML

images

links

JSON-LD

language

robots

viewport

charset

---

## Definition of Done

Production ready.

Unit tests.

No network.

No DB.