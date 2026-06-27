# AI Visibility Score

## Purpose

The AI Visibility Score measures how well a website is prepared to be understood, indexed, summarized, and recommended by modern AI systems.

This is a proprietary score created by our platform. It is not an official metric from OpenAI, Anthropic, Google, or any other AI provider.

The score ranges from **0 to 100**.

---

# Formula

Final Score = Σ(Category Score × Weight)

---

# Categories

| Category          | Weight |
| ----------------- | -----: |
| Crawlability      |    10% |
| Technical SEO     |    15% |
| Content Structure |    15% |
| Entity Coverage   |    15% |
| AI Readability    |    15% |
| Structured Data   |    10% |
| Internal Linking  |    10% |
| Content Freshness |     5% |
| Trust Signals     |     5% |

Total = 100%

---

# Category Definitions

## Crawlability

Checks:

* robots.txt
* sitemap.xml
* canonical URLs
* crawl depth
* indexability

---

## Technical SEO

Checks:

* HTTPS
* Title tag
* Meta description
* H1 usage
* Image alt attributes
* Broken links
* Redirect chains

---

## Content Structure

Checks:

* Heading hierarchy
* Bullet lists
* Tables
* FAQ sections
* Short paragraphs
* Comparison sections

---

## Entity Coverage

Checks:

* Named entities
* Brand entities
* Product entities
* Technology entities
* Entity consistency

Future versions will compare entity coverage against competitors.

---

## AI Readability

Checks:

* Definitions
* Step-by-step explanations
* Examples
* Summaries
* Plain language
* Question-and-answer sections

---

## Structured Data

Checks for schema.org markup including:

* Organization
* Article
* FAQPage
* Product
* LocalBusiness
* BreadcrumbList
* Person

---

## Internal Linking

Checks:

* Orphan pages
* Link depth
* Anchor text quality
* Related content links

---

## Content Freshness

Checks:

* Last updated date
* Recently modified content
* Broken references

---

## Trust Signals

Checks:

* About page
* Contact page
* Privacy policy
* Terms of service
* Author information

---

# Score Levels

| Score  | Status            |
| ------ | ----------------- |
| 90–100 | Excellent         |
| 75–89  | Good              |
| 60–74  | Needs Improvement |
| 40–59  | Poor              |
| 0–39   | Critical          |

---

# Recommendation Engine

Each issue should generate:

* Severity
* Description
* Recommendation
* Estimated impact
* Related category

Future versions will also generate automatic fixes.
