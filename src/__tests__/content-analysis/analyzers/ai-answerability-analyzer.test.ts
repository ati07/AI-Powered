/**
 * Tests — AIAnswerabilityAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { AIAnswerabilityAnalyzer } from "@/content-analysis/analyzers/ai-answerability-analyzer";
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

describe("AIAnswerabilityAnalyzer", () => {
  const analyzer = new AIAnswerabilityAnalyzer();

  it("should detect QA sections from headings ending with ?", () => {
    const html = "<html><body><h2>What is this product?</h2><p>It is a tool for analysis.</p><h2>How does it work?</h2><p>It analyzes content.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasQASections).toBe(true);
    expect(result.qaSectionCount).toBe(2);
  });

  it("should detect QA from FAQPage schema", () => {
    const html = "<html><body><p>Content</p></body></html>";
    const result = analyzer.analyze(makeContext(html, {
      structuredData: [
        {
          raw: '{"@type":"FAQPage","name":"FAQ"}',
          json: { "@type": "FAQPage", name: "FAQ" },
        },
      ],
    }));
    expect(result.hasQASections).toBe(true);
    expect(result.qaSectionCount).toBeGreaterThanOrEqual(1);
  });

  it("should return false for no QA sections", () => {
    const html = "<html><body><p>Just regular content without any questions.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasQASections).toBe(false);
    expect(result.qaSectionCount).toBe(0);
  });

  it("should detect definition blocks (<dl>)", () => {
    const html = "<html><body><dl><dt>Term</dt><dd>Definition of the term.</dd></dl></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasDefinitions).toBe(true);
    expect(result.definitionCount).toBeGreaterThanOrEqual(1);
  });

  it("should detect list usage", () => {
    const html = "<html><body><ul><li>Item 1</li><li>Item 2</li></ul></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasLists).toBe(true);
    expect(result.listCount).toBe(1);
  });

  it("should detect tables", () => {
    const html = "<html><body><table><tr><td>Data</td></tr></table></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasTables).toBe(true);
    expect(result.tableCount).toBe(1);
  });

  it("should compute chunkable content score", () => {
    // Well-sectioned content with many headings
    const headings = Array.from({ length: 5 }, (_, i) => `<h2>Section ${i + 1}</h2><p>Content for section ${i + 1}.</p>`).join("");
    const html = `<html><body>${headings}</body></html>`;
    const result = analyzer.analyze(makeContext(html));
    expect(result.chunkableContentScore).toBeGreaterThan(0);
  });

  it("should return 0 chunkable score for no headings", () => {
    const html = "<html><body><p>Just a paragraph with no headings to break up the content.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.chunkableContentScore).toBe(0);
  });

  it("should detect citations from blockquotes", () => {
    const html = '<html><body><blockquote>This is a cited quotation from an external source that adds credibility to the content.</blockquote></body></html>';
    const result = analyzer.analyze(makeContext(html));
    expect(result.citationFriendly).toBe(true);
    expect(result.citationCount).toBeGreaterThanOrEqual(1);
  });

  it("should detect citations from <cite> elements", () => {
    const html = "<html><body><p>As noted by <cite>Research Study 2025</cite>.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.citationFriendly).toBe(true);
  });

  it("should compute aggregate answerability score", () => {
    // A page with QA, definitions, lists, tables, good headings, and citations
    const html = `
      <html><body>
        <h2>What is this?</h2><p>Answer here.</p>
        <h2>How to use?</h2><p>Instructions here.</p>
        <dl><dt>Key Term</dt><dd>Definition</dd></dl>
        <ul><li>Feature 1</li><li>Feature 2</li></ul>
        <table><tr><td>Data</td></tr></table>
        <blockquote>Cited material</blockquote>
        <h2>Section 1</h2><p>Content</p>
        <h3>Detail</h3><p>More content</p>
        <h2>Section 2</h2><p>Final content</p>
      </body></html>`;
    const result = analyzer.analyze(makeContext(html));
    expect(result.aiAnswerabilityScore).toBeGreaterThan(0);
    expect(result.aiAnswerabilityScore).toBeLessThanOrEqual(100);
  });

  it("should return 0 answerability for empty page", () => {
    const context: ContentAnalysisContext = {
      html: "",
      text: "",
      seoResult: makeEmptySeoResult(),
      url: "https://example.com/page",
    };
    const result = analyzer.analyze(context);
    expect(result.hasQASections).toBe(false);
    expect(result.hasDefinitions).toBe(false);
    expect(result.hasLists).toBe(false);
    expect(result.hasTables).toBe(false);
    expect(result.chunkableContentScore).toBe(0);
    expect(result.citationFriendly).toBe(false);
    expect(result.aiAnswerabilityScore).toBe(0);
  });

  it("should detect multiple list types", () => {
    const html = "<html><body><ul><li>A</li></ul><ol><li>1</li></ol></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.hasLists).toBe(true);
    expect(result.listCount).toBe(2);
  });

  it("should handle malformed HTML gracefully", () => {
    const result = analyzer.analyze(makeContext("<html><body><p>Content</html>")); // missing close tags
    expect(typeof result.chunkableContentScore).toBe("number");
    expect(typeof result.aiAnswerabilityScore).toBe("number");
  });
});
