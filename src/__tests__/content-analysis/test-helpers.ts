/**
 * Test helpers for content-analysis tests.
 *
 * Provides factory functions for creating SeoResult instances with
 * different page configurations.
 */

import type { SeoResult } from "@/crawler/parser/types";

/* ──────────────── Factory ──────────────── */

/**
 * Build a minimal SeoResult with all fields populated.
 */
export function makeSeoResult(overrides?: Partial<SeoResult>): SeoResult {
  return {
    document: {
      title: "Test Page Title",
      language: "en",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
    },
    meta: {
      description: "A test page description for SEO analysis testing purposes that is long enough.",
      robots: "index, follow",
    },
    canonical: {
      url: "https://example.com/page",
    },
    openGraph: {
      "og:title": "Test Page",
      "og:description": "Test description",
      "og:image": "https://example.com/image.jpg",
    },
    twitter: {
      "twitter:card": "summary",
      "twitter:title": "Test Page",
    },
    headings: {
      h1: ["Main Heading"],
      h2: ["Section 1", "Section 2"],
      h3: ["Subsection A"],
      h4: [],
      h5: [],
      h6: [],
    },
    images: [
      { src: "/img1.jpg", alt: "Alt text 1", title: null, loading: null, width: null, height: null },
      { src: "/img2.jpg", alt: null, title: null, loading: null, width: null, height: null },
    ],
    internalLinks: [
      { href: "/page1", text: "Page 1", normalizedUrl: "https://example.com/page1" },
      { href: "/page2", text: "Page 2", normalizedUrl: "https://example.com/page2" },
      { href: "/page3", text: "Page 3", normalizedUrl: "https://example.com/page3" },
    ],
    externalLinks: [
      { href: "https://other.com", text: "Other", normalizedUrl: "https://other.com" },
    ],
    structuredData: [
      {
        raw: '{"@type":"Article","name":"Test Article"}',
        json: { "@type": "Article", name: "Test Article" },
      },
    ],
    warnings: [],
    stats: {
      totalImages: 2,
      totalInternalLinks: 3,
      totalExternalLinks: 1,
      totalStructuredData: 1,
      totalHeadings: 4,
    },
    ...overrides,
  };
}

/**
 * Build an empty SeoResult (no content).
 */
export function makeEmptySeoResult(): SeoResult {
  return {
    document: {
      title: null,
      language: null,
      charset: null,
      viewport: null,
    },
    meta: {
      description: null,
      robots: null,
    },
    canonical: {
      url: null,
    },
    openGraph: {},
    twitter: {},
    headings: {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
    },
    images: [],
    internalLinks: [],
    externalLinks: [],
    structuredData: [],
    warnings: [],
    stats: {
      totalImages: 0,
      totalInternalLinks: 0,
      totalExternalLinks: 0,
      totalStructuredData: 0,
      totalHeadings: 0,
    },
  };
}

/**
 * Build a simple HTML page with body content.
 */
export function makeHtmlPage(bodyContent?: string, overrides?: {
  title?: string;
  metaDescription?: string;
  language?: string;
  noIndex?: boolean;
}): string {
  const title = overrides?.title ?? "Test Page";
  const description = overrides?.metaDescription ?? "Test page description for SEO.";
  const lang = overrides?.language ?? "en";
  const robots = overrides?.noIndex ? '<meta name="robots" content="noindex">' : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  ${robots}
</head>
<body>
  ${bodyContent ?? "<p>This is a test paragraph with some content for analysis purposes.</p>"}
</body>
</html>`;
}

/**
 * Build HTML with rich content (headings, lists, tables, etc.).
 */
export function makeRichHtmlPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta property="article:published_time" content="2025-06-01T00:00:00Z">
  <meta property="article:modified_time" content="2026-06-01T00:00:00Z">
  <title>Rich Content Page</title>
</head>
<body>
  <h1>Main Heading</h1>
  <p>This is the first paragraph of content on this page. It contains multiple sentences. Here is another sentence for readability analysis.</p>
  <h2>Section One</h2>
  <p>Content in section one. This section discusses important topics.</p>
  <ul>
    <li>First list item</li>
    <li>Second list item</li>
    <li>Third list item</li>
  </ul>
  <h3>Subsection</h3>
  <p>More detailed content in the subsection.</p>
  <ol>
    <li>Ordered item one</li>
    <li>Ordered item two</li>
  </ol>
  <h2>Data Section</h2>
  <table>
    <tr><th>Name</th><th>Value</th></tr>
    <tr><td>Item 1</td><td>100</td></tr>
    <tr><td>Item 2</td><td>200</td></tr>
  </table>
  <h2>Frequently Asked Questions</h2>
  <h3>What is this page about?</h3>
  <p>This page is about content analysis.</p>
  <h3>How does it work?</h3>
  <p>It analyzes HTML content.</p>
  <blockquote>This is a cited quotation from a source.</blockquote>
  <p>References: [1] and [2] are cited sources.</p>
  <a href="/about">About Us</a>
  <a href="/privacy">Privacy Policy</a>
  <a href="/contact">Contact</a>
  <a href="https://external.com">External Link</a>
  <img src="/photo.jpg" alt="Photo description">
  <img src="/icon.png" alt="">
  <img src="/logo.svg" alt="Logo">
  <dl>
    <dt>Term</dt>
    <dd>Definition of the term.</dd>
  </dl>
  <p class="author">Written by John Doe</p>
</body>
</html>`;
}
