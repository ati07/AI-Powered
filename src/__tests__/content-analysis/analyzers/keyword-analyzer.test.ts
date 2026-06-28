/**
 * Tests — KeywordAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { KeywordAnalyzer } from "@/content-analysis/analyzers/keyword-analyzer";
import type { ContentAnalysisContext } from "@/content-analysis/types";
import { makeSeoResult } from "@/__tests__/content-analysis/test-helpers";

/* ──────────────── Helpers ──────────────── */

function makeContext(text: string): ContentAnalysisContext {
  return {
    html: `<html><body>${text}</body></html>`,
    text,
    seoResult: makeSeoResult(),
    url: "https://example.com/page",
  };
}

/* ──────────────── Suite ──────────────── */

describe("KeywordAnalyzer", () => {
  const analyzer = new KeywordAnalyzer();

  it("should return empty results for empty text", () => {
    const result = analyzer.analyze(makeContext(""));
    expect(result.totalWords).toBe(0);
    expect(result.uniqueWords).toBe(0);
    expect(result.keywords).toEqual([]);
    expect(result.overusedKeywords).toEqual([]);
  });

  it("should return empty results for text with only stop words", () => {
    const result = analyzer.analyze(makeContext("the and for not you can all how why but"));
    expect(result.totalWords).toBe(10);
    expect(result.uniqueWords).toBe(0);
    expect(result.keywords).toEqual([]);
  });

  it("should count total words including stop words", () => {
    const result = analyzer.analyze(makeContext("the quick brown fox jumps over the lazy dog"));
    expect(result.totalWords).toBe(9);
    expect(result.stopWordRatio).toBeGreaterThan(0);
  });

  it("should compute keyword density correctly", () => {
    const text = "seo optimization seo analysis seo content seo strategy seo best seo practices";
    const result = analyzer.analyze(makeContext(text));

    expect(result.keywords.length).toBeGreaterThan(0);
    const seoKeyword = result.keywords.find((k) => k.word === "seo");
    expect(seoKeyword).toBeDefined();
    expect(seoKeyword!.count).toBe(6);
    expect(seoKeyword!.density).toBeGreaterThan(0);
  });

  it("should sort keywords by frequency descending", () => {
    const text = "apple banana apple cherry apple banana date";
    const result = analyzer.analyze(makeContext(text));

    // First keyword should be "apple" (count 3)
    const topKeyword = result.keywords[0];
    expect(topKeyword).toBeDefined();
    expect(topKeyword!.word).toBe("apple");
    expect(topKeyword!.count).toBe(3);
  });

  it("should limit to top 30 keywords", () => {
    const words = Array.from({ length: 50 }, (_, i) => `keyword${i}`).join(" ");
    const result = analyzer.analyze(makeContext(words));
    expect(result.keywords.length).toBeLessThanOrEqual(30);
    expect(result.uniqueWords).toBe(50);
  });

  it("should detect overused keywords above density threshold", () => {
    // Create text where one keyword dominates
    const text = Array.from({ length: 20 }, () => "optimization").join(" ") + " " +
      Array.from({ length: 5 }, (_, i) => `other${i}`).join(" ");
    const result = analyzer.analyze(makeContext(text));
    // "optimization" appears 20 times out of ~25 meaningful words ≈ 80% density
    expect(result.overusedKeywords.length).toBeGreaterThanOrEqual(1);
    expect(result.overusedKeywords).toContain("optimization");
  });

  it("should filter out short words (< 3 chars)", () => {
    const text = "a an of to it at be by go hi in is";
    const result = analyzer.analyze(makeContext(text));
    // All words are stop words or short → should be empty
    expect(result.uniqueWords).toBe(0);
  });

  it("should handle text with numbers and mixed content", () => {
    const text = "2025 was a great year for seo analysis and content marketing 2025";
    const result = analyzer.analyze(makeContext(text));
    expect(result.totalWords).toBeGreaterThan(0);
  });

  it("should handle very large text gracefully", () => {
    const words = Array.from({ length: 10000 }, () => "analysis").join(" ");
    const result = analyzer.analyze(makeContext(words));
    expect(result.totalWords).toBe(10000);
    expect(result.uniqueWords).toBe(1);
    expect(result.keywords.length).toBe(1);
    expect(result.keywords[0]!.word).toBe("analysis");
  });
});
