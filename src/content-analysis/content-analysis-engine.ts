/**
 * Content Analysis — ContentAnalysisEngine.
 *
 * Orchestrates all specialized analyzers to produce a comprehensive
 * ContentAnalysisResult for a single page.
 *
 * The engine:
 *   1. Extracts plain text from the HTML once (avoids duplicated parser logic).
 *   2. Passes a shared ContentAnalysisContext to each analyzer.
 *   3. Merges individual results into a single immutable result.
 *   4. Never throws — each analyzer runs in a safe wrapper.
 *
 * Usage:
 *   const engine = new ContentAnalysisEngine();
 *   const result = engine.analyze({ html, seoResult, url });
 */

import * as cheerio from "cheerio";
import {
  type ContentAnalysisInput,
  type ContentAnalysisContext,
  type ContentAnalysisResult,
  DEFAULT_RESULT,
} from "@/content-analysis/types";
import { ReadabilityAnalyzer } from "@/content-analysis/analyzers/readability-analyzer";
import { HeadingAnalyzer } from "@/content-analysis/analyzers/heading-analyzer";
import { KeywordAnalyzer } from "@/content-analysis/analyzers/keyword-analyzer";
import { StructureAnalyzer } from "@/content-analysis/analyzers/structure-analyzer";
import { MediaAnalyzer } from "@/content-analysis/analyzers/media-analyzer";
import { EEATAnalyzer } from "@/content-analysis/analyzers/eeat-analyzer";
import { AIAnswerabilityAnalyzer } from "@/content-analysis/analyzers/ai-answerability-analyzer";
import { FreshnessAnalyzer } from "@/content-analysis/analyzers/freshness-analyzer";

export class ContentAnalysisEngine {
  private readonly readability: ReadabilityAnalyzer;
  private readonly headings: HeadingAnalyzer;
  private readonly keywords: KeywordAnalyzer;
  private readonly structure: StructureAnalyzer;
  private readonly media: MediaAnalyzer;
  private readonly eeat: EEATAnalyzer;
  private readonly aiAnswerability: AIAnswerabilityAnalyzer;
  private readonly freshness: FreshnessAnalyzer;

  constructor() {
    this.readability = new ReadabilityAnalyzer();
    this.headings = new HeadingAnalyzer();
    this.keywords = new KeywordAnalyzer();
    this.structure = new StructureAnalyzer();
    this.media = new MediaAnalyzer();
    this.eeat = new EEATAnalyzer();
    this.aiAnswerability = new AIAnswerabilityAnalyzer();
    this.freshness = new FreshnessAnalyzer();
  }

  /**
   * Analyze a page's content quality.
   *
   * @param input — The raw HTML, pre-extracted SEO data, and URL.
   * @returns An immutable ContentAnalysisResult.
   */
  analyze(input: ContentAnalysisInput): ContentAnalysisResult {
    try {
      const text = this.extractPlainText(input.html);
      const context: ContentAnalysisContext = {
        html: input.html,
        text,
        seoResult: input.seoResult,
        url: input.url,
      };

      const result: ContentAnalysisResult = {
        readability: this.safeAnalyze(() => this.readability.analyze(context), DEFAULT_RESULT.readability),
        headings: this.safeAnalyze(() => this.headings.analyze(context), DEFAULT_RESULT.headings),
        keywords: this.safeAnalyze(() => this.keywords.analyze(context), DEFAULT_RESULT.keywords),
        structure: this.safeAnalyze(() => this.structure.analyze(context), DEFAULT_RESULT.structure),
        media: this.safeAnalyze(() => this.media.analyze(context), DEFAULT_RESULT.media),
        eeat: this.safeAnalyze(() => this.eeat.analyze(context), DEFAULT_RESULT.eeat),
        aiAnswerability: this.safeAnalyze(() => this.aiAnswerability.analyze(context), DEFAULT_RESULT.aiAnswerability),
        freshness: this.safeAnalyze(() => this.freshness.analyze(context), DEFAULT_RESULT.freshness),
      };

      return Object.freeze(result);
    } catch {
      return DEFAULT_RESULT;
    }
  }

  /* ──────────────── Private ──────────────── */

  /**
   * Extract visible plain text from HTML.
   *
   * Removes non-content elements (script, style, nav, etc.) and
   * collapses whitespace. This is done once per page to avoid
   * duplicated parser work across analyzers.
   */
  private extractPlainText(html: string): string {
    try {
      const $ = cheerio.load(html);

      // Remove elements that don't contribute to readable content
      const removeSelectors = [
        "script", "style", "noscript", "svg", "canvas",
        "code", "pre", "nav", "footer", "header",
        "aside", "form", "iframe",
      ];
      $(removeSelectors.join(",")).remove();

      const body = $("body");
      const text = body.length > 0
        ? body.text()
        : $.root().text();

      return text.replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }

  /**
   * Run an analyzer function and return its result, falling back to a
   * default value if the analyzer throws.
   */
  private safeAnalyze<T>(fn: () => T, fallback: T): T {
    try {
      return fn();
    } catch {
      return fallback;
    }
  }
}
