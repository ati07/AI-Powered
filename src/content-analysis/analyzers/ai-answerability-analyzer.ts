/**
 * Content Analysis — AI Answerability Analyzer.
 *
 * Evaluates how well page content can be understood and cited by AI systems:
 *   - Question & Answer sections (FAQ, QAPage schema)
 *   - Definition blocks (<dl>, definition patterns)
 *   - Lists (<ul>, <ol>)
 *   - Tables (<table>)
 *   - Chunkable content (well-sectioned with headings)
 *   - Citation-friendly formatting (blockquotes, references)
 *
 * Pure analysis — never throws, never modifies state.
 */

import * as cheerio from "cheerio";
import type { ContentAnalysisContext, AIAnswerabilityResult } from "@/content-analysis/types";

/* ──────────────── Constants ──────────────── */

/** Minimum heading count for "chunkable" content (well sectionalized). */
const CHUNKABLE_MIN_HEADINGS = 4;

/** Minimum heading-to-word ratio (headings per 100 words) for chunkable scoring. */
const CHUNKABLE_HEADING_RATIO = 1.5;

/** QA-related patterns in heading text. */
const QA_HEADING_PATTERN = /^.*\?\s*$/;

/** Definition list tag selectors. */
const DEF_KEYWORDS = /\b(?:means?|refers?\s+to|is\s+(?:a|an|the)|defined?\s+as|called|known\s+as)\b/i;

/** Citation/reference patterns. */
const CITATION_PATTERNS = [
  /\[ref\]/i,
  /\[citation/i,
  /\[source/i,
  /\[\d+\]/,
  /\(source/i,
  /\(see\s+(?:also|above|below)/i,
  /references?/i,
  /bibliography/i,
  /footnotes?/i,
  /further\s+reading/i,
];

/* ──────────────── Analyzer ──────────────── */

export class AIAnswerabilityAnalyzer {
  /**
   * Analyze how well page content supports AI answerability.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen AIAnswerabilityResult.
   */
  analyze(context: ContentAnalysisContext): AIAnswerabilityResult {
    try {
      const { html, seoResult } = context;
      const $ = cheerio.load(html);

      // Q&A detection
      const qaSectionCount = this.detectQASections($, seoResult);

      // Definition detection
      const definitionCount = this.detectDefinitions($);

      // Lists
      const listCount = $("ul, ol").length;
      const hasLists = listCount > 0;

      // Tables
      const tableCount = $("table").length;
      const hasTables = tableCount > 0;

      // Chunkable content score (0–100)
      const chunkableContentScore = this.computeChunkableScore($);

      // Citation-friendly formatting
      const citationCount = this.countCitations($);
      const citationFriendly = citationCount > 0;

      // Aggregate AI answerability score (0–100)
      const aiAnswerabilityScore = this.computeAnswerabilityScore(
        qaSectionCount,
        definitionCount,
        listCount,
        tableCount,
        chunkableContentScore,
        citationCount,
      );

      return Object.freeze({
        hasQASections: qaSectionCount > 0,
        qaSectionCount,
        hasDefinitions: definitionCount > 0,
        definitionCount,
        hasLists,
        listCount,
        hasTables,
        tableCount,
        chunkableContentScore,
        citationFriendly,
        citationCount,
        aiAnswerabilityScore,
      });
    } catch {
      return Object.freeze({
        hasQASections: false,
        qaSectionCount: 0,
        hasDefinitions: false,
        definitionCount: 0,
        hasLists: false,
        listCount: 0,
        hasTables: false,
        tableCount: 0,
        chunkableContentScore: 0,
        citationFriendly: false,
        citationCount: 0,
        aiAnswerabilityScore: 0,
      });
    }
  }

  /* ──────────────── Private ──────────────── */

  /**
   * Detect Q&A sections via headings ending with "?" and FAQ/QAPage schema.
   */
  private detectQASections(
    $: cheerio.CheerioAPI,
    seoResult: ContentAnalysisContext["seoResult"],
  ): number {
    let count = 0;

    // Method 1: headings ending with question mark
    try {
      $("h1, h2, h3, h4, h5, h6").each((_i: number, el: unknown) => {
        const text = $(el as any).text().trim();
        if (QA_HEADING_PATTERN.test(text)) {
          count++;
        }
      });
    } catch {
      // continue with other methods
    }

    // Method 2: FAQPage / QAPage schema
    try {
      for (const sd of seoResult.structuredData) {
        if (!sd.json) continue;
        const items = Array.isArray(sd.json) ? sd.json : [sd.json];

        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const type = this.extractType(item as Record<string, unknown>);
          if (type === "FAQPage" || type === "QAPage") {
            count++;
          }
        }
      }
    } catch {
      // ignore schema errors
    }

    return count;
  }

  /**
   * Detect definition blocks: <dl> elements and definition patterns in text.
   */
  private detectDefinitions($: cheerio.CheerioAPI): number {
    let count = 0;

    // Method 1: <dl> elements
    try {
      count += $("dl").length;
    } catch {
      // continue
    }

    // Method 2: definition-style patterns in text
    try {
      const bodyText = $("body").text();
      // Look for "X is a/an/the Y" patterns as simple definitions
      const lines = bodyText.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 20 && trimmed.length < 200 && DEF_KEYWORDS.test(trimmed)) {
          count++;
        }
      }
    } catch {
      // ignore
    }

    return count;
  }

  /**
   * Compute chunkable content score (0–100) based on heading use.
   *
   * Content that is well-divided into sections with headings scores higher.
   */
  private computeChunkableScore($: cheerio.CheerioAPI): number {
    try {
      const headingCount = $("h1, h2, h3, h4, h5, h6").length;
      const bodyText = $("body").text();
      const wordCount = bodyText
        .split(/\s+/)
        .filter((w: string) => w.length > 0).length;

      if (wordCount === 0) return 0;

      if (headingCount === 0) return 0;

      // Score based on heading density
      const headingRatio = (headingCount / wordCount) * 100;

      if (headingCount >= CHUNKABLE_MIN_HEADINGS && headingRatio >= CHUNKABLE_HEADING_RATIO) {
        return 100;
      }

      // Partial score
      const densityScore = Math.min(100, (headingRatio / CHUNKABLE_HEADING_RATIO) * 60);
      const countScore = Math.min(100, (headingCount / CHUNKABLE_MIN_HEADINGS) * 40);

      return Math.round(Math.max(densityScore, countScore));
    } catch {
      return 0;
    }
  }

  /**
   * Count citation-friendly formatting elements.
   */
  private countCitations($: cheerio.CheerioAPI): number {
    let count = 0;

    try {
      // <blockquote> elements
      count += $("blockquote").length;

      // <cite> elements
      count += $("cite").length;

      // <q> elements
      count += $("q").length;

      // Footnotes sections
      const hasFootnotes = $('ol:contains("footnote"), ol:contains("reference"), div.footnotes, section.footnotes').length > 0;
      if (hasFootnotes) count += 2;

      // Check text for citation patterns
      try {
        const bodyText = $("body").text();
        for (const pattern of CITATION_PATTERNS) {
          const matches = bodyText.match(pattern);
          if (matches) count += matches.length;
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }

    return count;
  }

  /**
   * Compute aggregate answerability score (0–100).
   *
   * Weighted scoring based on:
   *   - QA sections (25%)
   *   - Definitions (15%)
   *   - Lists (15%)
   *   - Tables (15%)
   *   - Chunkable content (20%)
   *   - Citations (10%)
   */
  private computeAnswerabilityScore(
    qaCount: number,
    defCount: number,
    listCount: number,
    tableCount: number,
    chunkableScore: number,
    citationCount: number,
  ): number {
    const qaScore = Math.min(100, qaCount * 25);
    const defScore = Math.min(100, defCount * 20);
    const listScore = Math.min(100, listCount * 15);
    const tableScore = Math.min(100, tableCount * 20);
    const citScore = Math.min(100, citationCount * 10);

    const weighted =
      qaScore * 0.25 +
      defScore * 0.15 +
      listScore * 0.15 +
      tableScore * 0.15 +
      chunkableScore * 0.20 +
      citScore * 0.10;

    return Math.round(weighted);
  }

  private extractType(obj: Record<string, unknown>): string | null {
    const type = obj["@type"];
    if (!type) return null;
    if (Array.isArray(type)) return (type[0] as string) ?? null;
    return type as string;
  }
}
