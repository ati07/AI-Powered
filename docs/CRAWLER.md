# Crawl Engine

## Purpose

The Crawl Engine discovers every crawlable page of a website.

It serves as the data collection layer for AI Visibility analysis.

---

# Workflow

User

↓

Create Scan

↓

Background Worker

↓

Download robots.txt

↓

Download sitemap.xml

↓

Discover URLs

↓

Download HTML

↓

Extract Metadata

↓

Save Pages

↓

Complete Scan

---

# Crawl Pipeline

Step 1

Create Scan

↓

Step 2

Validate Website

↓

Step 3

Download robots.txt

↓

Step 4

Parse sitemap.xml

↓

Step 5

Queue URLs

↓

Step 6

Download HTML

↓

Step 7

Extract Metadata

↓

Step 8

Store Page

↓

Step 9

Complete Scan

---

# Future Features

- Rate Limiting
- Retry Failed Requests
- JavaScript Rendering
- Parallel Crawling
- Incremental Scans
- Scheduled Scans