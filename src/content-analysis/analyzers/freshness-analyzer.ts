/**
 * Content Analysis — Freshness Analyzer.
 *
 * Evaluates the freshness of page content:
 *   - Published date detection (meta, schema, time elements)
 *   - Modified date detection (meta, schema, time elements)
 *   - Freshness scoring (based on recency)
 *
 * Pure analysis — never throws, never modifies state.
 */

import * as cheerio from "cheerio";
import type { ContentAnalysisContext, FreshnessResult } from "@/content-analysis/types";

/* ──────────────── Constants ──────────────── */

/** Date formats for parsing date strings. */
const DATE_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[name="article:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="publishdate"]',
  'meta[name="dc.date"]',
  'meta[name="dc.date.issued"]',
  'meta[name="date"]',
];

const MODIFIED_META_SELECTORS = [
  'meta[property="article:modified_time"]',
  'meta[name="article:modified_time"]',
  'meta[name="lastmodified"]',
  'meta[name="dc.date.modified"]',
  'meta[name="modified"]',
  'meta[name="last-modified"]',
];

/** Days threshold for staleness. */
const STALE_THRESHOLD_DAYS = 365;

/* ──────────────── Analyzer ──────────────── */

export class FreshnessAnalyzer {
  /**
   * Analyze the freshness of page content.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen FreshnessResult.
   */
  analyze(context: ContentAnalysisContext): FreshnessResult {
    try {
      const { html, seoResult } = context;
      const $ = cheerio.load(html);
      const now = new Date();

      // Published date detection
      const publishedDate = this.detectPublishedDate($, seoResult);
      const hasPublishedDate = publishedDate !== null;
      const daysSincePublished = this.daysDifference(publishedDate, now);

      // Modified date detection
      const modifiedDate = this.detectModifiedDate($, seoResult);
      const hasModifiedDate = modifiedDate !== null;
      const daysSinceModified = this.daysDifference(modifiedDate, now);

      // Determine freshness
      const latestDate = modifiedDate ?? publishedDate;
      const freshnessScore = this.computeFreshnessScore(latestDate, now);
      const isStale = this.isStale(latestDate, now);

      return Object.freeze({
        hasPublishedDate,
        publishedDate,
        hasModifiedDate,
        modifiedDate,
        freshnessScore,
        isStale,
        daysSincePublished,
        daysSinceModified,
      });
    } catch {
      return Object.freeze({
        hasPublishedDate: false,
        publishedDate: null,
        hasModifiedDate: false,
        modifiedDate: null,
        freshnessScore: 0,
        isStale: true,
        daysSincePublished: null,
        daysSinceModified: null,
      });
    }
  }

  /* ──────────────── Private ──────────────── */

  /**
   * Detect the published date from meta tags, time elements, and schema.
   */
  private detectPublishedDate(
    $: cheerio.CheerioAPI,
    seoResult: ContentAnalysisContext["seoResult"],
  ): string | null {
    // Method 1: Meta tags
    for (const selector of DATE_META_SELECTORS) {
      try {
        const content = $(selector).first().attr("content");
        if (content && content.trim().length > 0) {
          const parsed = this.parseDateString(content.trim());
          if (parsed) return parsed;
        }
      } catch {
        continue;
      }
    }

    // Method 2: <time itemprop="datePublished">
    try {
      const timeEl = $('time[itemprop="datePublished"]').first();
      const datetime = timeEl.attr("datetime");
      if (datetime) {
        const parsed = this.parseDateString(datetime);
        if (parsed) return parsed;
      }
      const text = timeEl.text().trim();
      if (text.length > 0) {
        const parsed = this.parseDateString(text);
        if (parsed) return parsed;
      }
    } catch {
      // continue
    }

    // Method 3: <time datetime="..."> without itemprop (common date pattern)
    try {
      const timeElements = $("time");
      if (timeElements.length > 0) {
        // Check the first time element
        const datetime = timeElements.first().attr("datetime");
        if (datetime) {
          const parsed = this.parseDateString(datetime);
          if (parsed) return parsed;
        }
      }
    } catch {
      // continue
    }

    // Method 4: Schema.org datePublished
    for (const sd of seoResult.structuredData) {
      if (!sd.json) continue;

      const items = Array.isArray(sd.json) ? sd.json : [sd.json];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const obj = item as Record<string, unknown>;
        const datePublished = obj["datePublished"];
        if (datePublished && typeof datePublished === "string") {
          const parsed = this.parseDateString(datePublished);
          if (parsed) return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Detect the last-modified date from meta tags, time elements, and schema.
   */
  private detectModifiedDate(
    $: cheerio.CheerioAPI,
    seoResult: ContentAnalysisContext["seoResult"],
  ): string | null {
    // Method 1: Meta tags
    for (const selector of MODIFIED_META_SELECTORS) {
      try {
        const content = $(selector).first().attr("content");
        if (content && content.trim().length > 0) {
          const parsed = this.parseDateString(content.trim());
          if (parsed) return parsed;
        }
      } catch {
        continue;
      }
    }

    // Method 2: <time itemprop="dateModified">
    try {
      const timeEl = $('time[itemprop="dateModified"]').first();
      const datetime = timeEl.attr("datetime");
      if (datetime) {
        const parsed = this.parseDateString(datetime);
        if (parsed) return parsed;
      }
    } catch {
      // continue
    }

    // Method 3: Schema.org dateModified
    for (const sd of seoResult.structuredData) {
      if (!sd.json) continue;

      const items = Array.isArray(sd.json) ? sd.json : [sd.json];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const obj = item as Record<string, unknown>;
        const dateModified = obj["dateModified"];
        if (dateModified && typeof dateModified === "string") {
          const parsed = this.parseDateString(dateModified);
          if (parsed) return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Parse a date string into ISO date (YYYY-MM-DD).
   * Returns null if parsing fails.
   */
  private parseDateString(dateStr: string): string | null {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Calculate days between two dates (null-safe).
   */
  private daysDifference(date: string | null, now: Date): number | null {
    if (!date) return null;

    try {
      const d = new Date(date);
      const diffMs = now.getTime() - d.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return null;
    }
  }

  /**
   * Compute freshness score (0–100) based on recency.
   *
   * Score bands:
   *   - ≤ 30 days: 100
   *   - ≤ 90 days: 80
   *   - ≤ 180 days: 60
   *   - ≤ 365 days: 40
   *   - ≤ 730 days: 20
   *   - > 730 days: 10
   *   - No date: 0
   */
  private computeFreshnessScore(
    latestDate: string | null,
    now: Date,
  ): number {
    if (!latestDate) return 0;

    const days = this.daysDifference(latestDate, now);
    if (days === null) return 0;

    if (days <= 30) return 100;
    if (days <= 90) return 80;
    if (days <= 180) return 60;
    if (days <= 365) return 40;
    if (days <= 730) return 20;

    return 10;
  }

  /**
   * Determine if content is stale (> 1 year since latest date).
   */
  private isStale(latestDate: string | null, now: Date): boolean {
    if (!latestDate) return true;

    const days = this.daysDifference(latestDate, now);
    if (days === null) return true;

    return days > STALE_THRESHOLD_DAYS;
  }
}
