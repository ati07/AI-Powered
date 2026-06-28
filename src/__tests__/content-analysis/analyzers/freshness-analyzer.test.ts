/**
 * Tests — FreshnessAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { FreshnessAnalyzer } from "@/content-analysis/analyzers/freshness-analyzer";
import type { ContentAnalysisContext } from "@/content-analysis/types";
import { makeSeoResult, makeEmptySeoResult } from "@/__tests__/content-analysis/test-helpers";

/* ──────────────── Helpers ──────────────── */

function makeContext(html: string, seoOverride?: unknown): ContentAnalysisContext {
  return {
    html,
    text: "",
    seoResult: makeSeoResult(seoOverride as Partial<import("@/crawler/parser/types").SeoResult> | undefined),
    url: "https://example.com/page",
  };
}

/* ──────────────── Suite ──────────────── */

describe("FreshnessAnalyzer", () => {
  const analyzer = new FreshnessAnalyzer();

  it("should detect published date from article:published_time meta", () => {
    const html = '<html><head><meta property="article:published_time" content="2025-06-01T00:00:00Z"></head><body><p>Content</p></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasPublishedDate).toBe(true);
    expect(result.publishedDate).toContain("2025");
  });

  it("should detect modified date from article:modified_time meta", () => {
    const html = '<html><head><meta property="article:modified_time" content="2026-06-01T00:00:00Z"></head><body><p>Content</p></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasModifiedDate).toBe(true);
    expect(result.modifiedDate).toContain("2026");
  });

  it("should detect dates from <time> elements", () => {
    const html = '<html><body><time datetime="2025-03-15">March 15, 2025</time></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasPublishedDate).toBe(true);
    // Should have found the date from the time element
    expect(result.publishedDate).toContain("2025");
  });

  it("should detect dateModified schema", () => {
    const html = "<html><body><p>Content</p></body></html>";
    const result = analyzer.analyze(makeContext(html, {
      structuredData: [
        {
          raw: '{"@type":"Article","dateModified":"2026-05-15T00:00:00Z"}',
          json: { "@type": "Article", dateModified: "2026-05-15T00:00:00Z" },
        },
      ],
    }));
    expect(result.hasModifiedDate).toBe(true);
    expect(result.modifiedDate).toContain("2026");
  });

  it("should detect datePublished schema", () => {
    const html = "<html><body><p>Content</p></body></html>";
    const result = analyzer.analyze(makeContext(html, {
      structuredData: [
        {
          raw: '{"@type":"Article","datePublished":"2025-01-01T00:00:00Z"}',
          json: { "@type": "Article", datePublished: "2025-01-01T00:00:00Z" },
        },
      ],
    }));
    expect(result.hasPublishedDate).toBe(true);
    expect(result.publishedDate).toContain("2025");
  });

  it("should compute freshness score for recent content", () => {
    // Content published within last 30 days
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    const html = `<html><head><meta property="article:published_time" content="${recentDate.toISOString()}"></head><body><p>Content</p></body></html>`;
    const result = analyzer.analyze(makeContext(html));
    expect(result.freshnessScore).toBe(100);
    expect(result.isStale).toBe(false);
  });

  it("should compute freshness score for old content", () => {
    // Content published more than 365 days ago
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);
    const html = `<html><head><meta property="article:published_time" content="${oldDate.toISOString()}"></head><body><p>Content</p></body></html>`;
    const result = analyzer.analyze(makeContext(html));
    expect(result.freshnessScore).toBeLessThan(50);
    expect(result.isStale).toBe(true);
  });

  it("should return stale for no dates", () => {
    const html = "<html><body><p>Content without dates.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasPublishedDate).toBe(false);
    expect(result.hasModifiedDate).toBe(false);
    expect(result.isStale).toBe(true);
    expect(result.freshnessScore).toBe(0);
  });

  it("should detect pubdate meta tag", () => {
    const html = '<html><head><meta name="pubdate" content="2025-08-15"></head><body><p>Content</p></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasPublishedDate).toBe(true);
    expect(result.publishedDate).toBeTruthy();
  });

  it("should handle empty page gracefully", () => {
    const context: ContentAnalysisContext = {
      html: "",
      text: "",
      seoResult: makeEmptySeoResult(),
      url: "https://example.com/page",
    };
    const result = analyzer.analyze(context);
    expect(result.hasPublishedDate).toBe(false);
    expect(result.hasModifiedDate).toBe(false);
    expect(result.freshnessScore).toBe(0);
    expect(result.isStale).toBe(true);
    expect(result.daysSincePublished).toBeNull();
    expect(result.daysSinceModified).toBeNull();
  });

  it("should compute days since published", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 100);
    const html = `<html><head><meta property="article:published_time" content="${pastDate.toISOString()}"></head><body><p>Content</p></body></html>`;
    const result = analyzer.analyze(makeContext(html));
    expect(result.daysSincePublished).toBeGreaterThanOrEqual(95);
    expect(result.daysSincePublished).toBeLessThanOrEqual(105);
    expect(result.freshnessScore).toBe(60); // 100 days: within 90-180 days
  });

  it("should detect last-modified meta", () => {
    const html = '<html><head><meta name="last-modified" content="2026-05-01"></head><body><p>Content</p></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasModifiedDate).toBe(true);
    expect(result.modifiedDate).toBeTruthy();
  });

  it("should detect dc.date meta tag", () => {
    const html = '<html><head><meta name="dc.date" content="2025-03-01"></head><body><p>Content</p></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasPublishedDate).toBe(true);
    expect(result.publishedDate).toBeTruthy();
  });

  it("should handle invalid date string gracefully", () => {
    const html = '<html><head><meta property="article:published_time" content="not-a-date"></head><body><p>Content</p></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasPublishedDate).toBe(false);
    expect(result.publishedDate).toBeNull();
  });
});
