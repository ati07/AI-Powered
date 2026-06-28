/**
 * Content Analysis — Structure Analyzer.
 *
 * Evaluates the content structure of a page:
 *   - Lists (<ul>, <ol>)
 *   - Tables (<table>)
 *   - FAQ sections (headings + schema)
 *   - Internal and external links
 *   - Content depth (average nesting)
 *
 * Pure analysis — never throws, never modifies state.
 */

import * as cheerio from "cheerio";
import type { ContentAnalysisContext, StructureResult } from "@/content-analysis/types";

/* ──────────────── Constants ──────────────── */

/** FAQ-related keywords in heading text. */
const FAQ_KEYWORDS = /^\s*(faq|frequently\s+asked\s+questions|common\s+questions|q\s*&+\s*a)\s*$/i;

/* ──────────────── Analyzer ──────────────── */

export class StructureAnalyzer {
  /**
   * Analyze the content structure of a page.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen StructureResult.
   */
  analyze(context: ContentAnalysisContext): StructureResult {
    try {
      const { seoResult, html } = context;

      const listCount = this.countLists(html);
      const tableCount = this.countTables(html);
      const faqCount = this.detectFAQ(html, seoResult);
      const internalLinkCount = seoResult.internalLinks.length;
      const externalLinkCount = seoResult.externalLinks.length;
      const contentDepth = this.measureContentDepth(html);

      return Object.freeze({
        listCount,
        tableCount,
        hasFAQ: faqCount > 0,
        faqCount,
        internalLinkCount,
        externalLinkCount,
        contentDepth,
      });
    } catch {
      return Object.freeze({
        listCount: 0,
        tableCount: 0,
        hasFAQ: false,
        faqCount: 0,
        internalLinkCount: 0,
        externalLinkCount: 0,
        contentDepth: 0,
      });
    }
  }

  /* ──────────────── Private ──────────────── */

  /**
   * Count <ul> and <ol> elements in the HTML.
   */
  private countLists(html: string): number {
    try {
      const $ = cheerio.load(html);
      return $("ul, ol").length;
    } catch {
      return 0;
    }
  }

  /**
   * Count <table> elements in the HTML.
   */
  private countTables(html: string): number {
    try {
      const $ = cheerio.load(html);
      return $("table").length;
    } catch {
      return 0;
    }
  }

  /**
   * Detect FAQ sections via:
   *   1. FAQ/QA keyword in headings
   *   2. FAQ schema in structured data
   */
  private detectFAQ(
    html: string,
    seoResult: ContentAnalysisContext["seoResult"],
  ): number {
    let count = 0;

    // Method 1: Check headings for FAQ keywords
    try {
      const $ = cheerio.load(html);
      $("h1, h2, h3, h4, h5, h6").each((_i: number, el: unknown) => {
        const text = $(el as any).text().trim();
        if (FAQ_KEYWORDS.test(text)) {
          count++;
        }
      });
    } catch {
      // continue with schema detection
    }

    // Method 2: Check structured data for FAQ schema
    try {
      for (const sd of seoResult.structuredData) {
        if (sd.json && typeof sd.json === "object" && !Array.isArray(sd.json)) {
          const json = sd.json as Record<string, unknown>;
          const type = this.extractSchemaType(json);
          if (type === "FAQPage" || type === "QAPage") {
            count++;
          }
        }
        // Also check @graph arrays
        if (sd.json && Array.isArray(sd.json)) {
          for (const item of sd.json) {
            if (item && typeof item === "object") {
              const type = this.extractSchemaType(item as Record<string, unknown>);
              if (type === "FAQPage" || type === "QAPage") {
                count++;
              }
            }
          }
        }
      }
    } catch {
      // ignore schema parse errors
    }

    return count;
  }

  /**
   * Extract the @type from a schema.org object (handles array types).
   */
  private extractSchemaType(json: Record<string, unknown>): string | null {
    const type = json["@type"];
    if (!type) return null;
    if (Array.isArray(type)) {
      return (type[0] as string) ?? null;
    }
    return type as string;
  }

  /**
   * Measure average content depth (nesting level of body children).
   *
   * Content depth is the average nesting depth of direct body elements,
   * capped at 1 for each branch. Higher depth suggests more structured content.
   */
  private measureContentDepth(html: string): number {
    try {
      const $ = cheerio.load(html);

      let totalDepth = 0;
      let elementCount = 0;

      // Walk direct children of body
      $("body > *").each((_i: number, el: unknown) => {
        const depth = this.elementDepth($, el as any);
        totalDepth += depth;
        elementCount++;
      });

      if (elementCount === 0) return 0;

      return Math.round((totalDepth / elementCount) * 10) / 10;
    } catch {
      return 0;
    }
  }

  /**
   * Recursively compute the nesting depth of an element.
   */
  private elementDepth($: cheerio.CheerioAPI, el: any): number {
    let maxChildDepth = 0;
    $(el).children().each((_i: number, child: unknown) => {
      const d = this.elementDepth($, child as any);
      if (d > maxChildDepth) maxChildDepth = d;
    });
    return 1 + maxChildDepth;
  }
}
