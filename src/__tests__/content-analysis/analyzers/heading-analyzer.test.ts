/**
 * Tests — HeadingAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { HeadingAnalyzer } from "@/content-analysis/analyzers/heading-analyzer";
import type { ContentAnalysisContext } from "@/content-analysis/types";
import { makeSeoResult, makeEmptySeoResult } from "@/__tests__/content-analysis/test-helpers";
import type { SeoResult } from "@/crawler/parser/types";

/* ──────────────── Helpers ──────────────── */

function makeContext(seoResultOverride?: Partial<SeoResult>): ContentAnalysisContext {
  return {
    html: "<html><body></body></html>",
    text: "",
    seoResult: makeSeoResult(seoResultOverride),
    url: "https://example.com/page",
  };
}

/* ──────────────── Suite ──────────────── */

describe("HeadingAnalyzer", () => {
  const analyzer = new HeadingAnalyzer();

  it("should detect headings hierarchy", () => {
    const result = analyzer.analyze(makeContext());
    expect(result.hierarchy).toEqual(["h1", "h2", "h2", "h3"]);
    expect(result.totalHeadings).toBe(4);
  });

  it("should detect no headings for empty headings", () => {
    const result = analyzer.analyze(makeContext({ headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] } }));
    expect(result.totalHeadings).toBe(0);
    expect(result.missingH1).toBe(true);
    expect(result.coverage.h1Count).toBe(0);
  });

  it("should detect missing H1", () => {
    const result = analyzer.analyze(makeContext({ headings: { h1: [], h2: ["Section"], h3: [], h4: [], h5: [], h6: [] } }));
    expect(result.missingH1).toBe(true);
    expect(result.totalHeadings).toBe(1);
  });

  it("should detect present H1", () => {
    const result = analyzer.analyze(makeContext({ headings: { h1: ["Title"], h2: [], h3: [], h4: [], h5: [], h6: [] } }));
    expect(result.missingH1).toBe(false);
    expect(result.coverage.h1Count).toBe(1);
  });

  it("should detect duplicate heading text", () => {
    const result = analyzer.analyze(makeContext({
      headings: {
        h1: ["Welcome"],
        h2: ["Features", "Features"],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
      },
    }));
    expect(result.duplicateHeadings.length).toBeGreaterThanOrEqual(1);
    const duplicate = result.duplicateHeadings.find((d) => d.text === "features");
    expect(duplicate).toBeDefined();
    expect(duplicate!.count).toBe(2);
  });

  it("should not flag unique headings as duplicates", () => {
    const result = analyzer.analyze(makeContext());
    expect(result.duplicateHeadings).toEqual([]);
  });

  it("should provide correct heading coverage counts", () => {
    const result = analyzer.analyze(makeContext({
      headings: {
        h1: ["Title"],
        h2: ["A", "B", "C"],
        h3: ["1", "2"],
        h4: ["x"],
        h5: [],
        h6: [],
      },
    }));
    expect(result.coverage).toEqual({
      h1Count: 1,
      h2Count: 3,
      h3Count: 2,
      h4Count: 1,
      h5Count: 0,
      h6Count: 0,
    });
  });

  it("should detect hierarchy issues when levels are skipped", () => {
    // h3 without h1 or h2
    const result = analyzer.analyze(makeContext({
      headings: {
        h1: [],
        h2: [],
        h3: ["Skip"],
        h4: [],
        h5: [],
        h6: [],
      },
    }));
    expect(result.hierarchyIssues.length).toBeGreaterThanOrEqual(1);
    const issue = result.hierarchyIssues[0];
    expect(issue).toBeDefined();
    expect(issue!.actualLevel).toBe("h3");
  });

  it("should handle empty pages gracefully", () => {
    const context: ContentAnalysisContext = {
      html: "",
      text: "",
      seoResult: makeEmptySeoResult(),
      url: "https://example.com/page",
    };
    const result = analyzer.analyze(context);
    expect(result.totalHeadings).toBe(0);
    expect(result.missingH1).toBe(true);
    expect(result.hierarchyIssues).toEqual([]);
    expect(result.duplicateHeadings).toEqual([]);
  });

  it("should handle multiple H1 headings", () => {
    const result = analyzer.analyze(makeContext({
      headings: {
        h1: ["Title", "Second Title"],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
      },
    }));
    expect(result.coverage.h1Count).toBe(2);
    expect(result.missingH1).toBe(false);
  });
});
