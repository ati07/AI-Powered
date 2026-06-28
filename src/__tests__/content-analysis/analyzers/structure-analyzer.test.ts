/**
 * Tests — StructureAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { StructureAnalyzer } from "@/content-analysis/analyzers/structure-analyzer";
import type { ContentAnalysisContext } from "@/content-analysis/types";
import { makeSeoResult, makeEmptySeoResult } from "@/__tests__/content-analysis/test-helpers";

/* ──────────────── Helpers ──────────────── */

function makeContext(html: string): ContentAnalysisContext {
  return {
    html,
    text: "",
    seoResult: makeSeoResult(),
    url: "https://example.com/page",
  };
}

function makeContextWithSeo(html: string, seoOverride?: unknown): ContentAnalysisContext {
  return {
    html,
    text: "",
    seoResult: makeSeoResult(seoOverride as Partial<import("@/crawler/parser/types").SeoResult> | undefined),
    url: "https://example.com/page",
  };
}

/* ──────────────── Suite ──────────────── */

describe("StructureAnalyzer", () => {
  const analyzer = new StructureAnalyzer();

  it("should count lists in HTML", () => {
    const html = "<html><body><ul><li>A</li><li>B</li></ul><ol><li>1</li><li>2</li></ol></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.listCount).toBe(2);
  });

  it("should return 0 for no lists", () => {
    const html = "<html><body><p>No lists here.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.listCount).toBe(0);
  });

  it("should count tables", () => {
    const html = "<html><body><table><tr><td>Cell</td></tr></table></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.tableCount).toBe(1);
  });

  it("should return 0 for no tables", () => {
    const html = "<html><body><p>No tables here.</p></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.tableCount).toBe(0);
  });

  it("should detect FAQ from heading text", () => {
    const html = "<html><body><h2>Frequently Asked Questions</h2><p>Content.</p></body></html>";
    const result = analyzer.analyze(makeContextWithSeo(html));
    expect(result.hasFAQ).toBe(true);
    expect(result.faqCount).toBeGreaterThanOrEqual(1);
  });

  it("should detect FAQ from schema", () => {
    const html = "<html><body><p>Content</p></body></html>";
    const result = analyzer.analyze(makeContextWithSeo(html, {
      structuredData: [
        {
          raw: '{"@type":"FAQPage","name":"FAQ"}',
          json: { "@type": "FAQPage", name: "FAQ" },
        },
      ],
    }));
    expect(result.hasFAQ).toBe(true);
    expect(result.faqCount).toBeGreaterThanOrEqual(1);
  });

  it("should report no FAQ when not present", () => {
    const html = "<html><body><p>Just content.</p></body></html>";
    const result = analyzer.analyze(makeContextWithSeo(html, {
      structuredData: [],
    }));
    expect(result.hasFAQ).toBe(false);
    expect(result.faqCount).toBe(0);
  });

  it("should count internal links from seoResult", () => {
    const result = analyzer.analyze(makeContext("<html><body><p>Content</p></body></html>"));
    expect(result.internalLinkCount).toBe(3);
  });

  it("should count external links from seoResult", () => {
    const result = analyzer.analyze(makeContext("<html><body><p>Content</p></body></html>"));
    expect(result.externalLinkCount).toBe(1);
  });

  it("should measure content depth", () => {
    const html = "<html><body><div><p><span>Deep content</span></p></div></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.contentDepth).toBeGreaterThan(1);
  });

  it("should return 0 content depth for empty body", () => {
    const html = "<html><body></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.contentDepth).toBe(0);
  });

  it("should handle empty HTML gracefully", () => {
    const context: ContentAnalysisContext = {
      html: "",
      text: "",
      seoResult: makeEmptySeoResult(),
      url: "https://example.com/page",
    };
    const result = analyzer.analyze(context);
    expect(result.listCount).toBe(0);
    expect(result.tableCount).toBe(0);
    expect(result.hasFAQ).toBe(false);
    expect(result.internalLinkCount).toBe(0);
    expect(result.externalLinkCount).toBe(0);
  });

  it("should handle malformed HTML gracefully", () => {
    const html = "<html><body><ul><li>Item</body></html>"; // missing closing tags
    const result = analyzer.analyze(makeContext(html));
    expect(result.listCount).toBe(1);
  });

  it("should detect multiple tables", () => {
    const html = "<html><body><table><tr><td>1</td></tr></table><table><tr><td>2</td></tr></table><table><tr><td>3</td></tr></table></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.tableCount).toBe(3);
  });

  it("should detect mixed list types", () => {
    const html = "<html><body><ul><li>A</li></ul><ol><li>1</li></ol><ul><li>B</li></ul></body></html>";
    const result = analyzer.analyze(makeContext(html));
    expect(result.listCount).toBe(3);
  });

  it("should detect QAPage schema as FAQ", () => {
    const html = "<html><body><p>Content</p></body></html>";
    const result = analyzer.analyze(makeContextWithSeo(html, {
      structuredData: [
        {
          raw: '{"@type":"QAPage","name":"Q&A"}',
          json: { "@type": "QAPage", name: "Q&A" },
        },
      ],
    }));
    expect(result.hasFAQ).toBe(true);
  });
});
