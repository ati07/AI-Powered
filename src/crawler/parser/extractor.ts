/**
 * Crawler — SEO Extractor.
 *
 * Takes a Cheerio DOM (produced by {@link HtmlParser}) and extracts
 * every piece of SEO-relevant metadata into a single immutable typed
 * result.
 *
 * Extraction areas:
 *   - Document (title, language, charset, viewport)
 *   - Meta (description, robots)
 *   - Canonical URL
 *   - OpenGraph & Twitter Card properties
 *   - Headings (H1 – H6)
 *   - Images
 *   - Internal & external links (normalised, deduplicated)
 *   - JSON-LD structured data
 *
 * Never throws — warnings are collected for non-fatal issues.
 */

import { type CheerioAPI } from "cheerio";
import { type ILogger } from "@/shared/logger";
import { normalizeUrl } from "@/shared/http/url";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import {
  type SeoResult,
  type DocumentInfo,
  type MetaInfo,
  type CanonicalInfo,
  type OpenGraphInfo,
  type TwitterInfo,
  type HeadingInfo,
  type ImageInfo,
  type LinkInfo,
  type StructuredDataInfo,
  type ExtractionWarning,
  type PageStats,
} from "./types";

/*
 * cheerio 1.x does not re-export domhandler's Element / AnyNode types,
 * so we use this alias in all `each()` callbacks and helper functions
 * that receive DOM nodes.  Replaces `any` while keeping the intention clear.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DomNode = any;

/* ──────────────── Helpers ──────────────── */

/**
 * Safely extract the `href` from a Cheerio element — returns `null`
 * when the attribute is missing or empty.
 */
function getHref(el: DomNode, $: CheerioAPI): string | null {
  const href = $(el).attr("href");
  return href && href.length > 0 ? href : null;
}

/**
 * Resolve a (possibly relative) URL against the base URL and normalise it.
 * Returns `null` when resolution fails or the scheme is not http(s).
 */
function resolveUrl(raw: string, baseUrl: string): string | null {
  try {
    const url = new URL(raw, baseUrl);
    return normalizeUrl(url.href);
  } catch {
    return null;
  }
}

/**
 * Parse a numeric HTML attribute (e.g. `width="300"`) to a number.
 * Returns `null` when the attribute is missing or not a valid integer.
 */
function parseNumericAttr(
  el: DomNode,
  attr: string,
  $: CheerioAPI,
): number | null {
  const val = $(el).attr(attr);
  if (val === undefined || val.length === 0) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/* ──────────────── Service ──────────────── */

export class SeoExtractor {
  private readonly logger: ILogger;
  private readonly baseUrl: string;
  private warnings: ExtractionWarning[] = [];

  constructor(ctx: CrawlerContext) {
    this.logger = ctx.logger;
    this.baseUrl = ctx.baseUrl;
  }

  /* ═══════════════ Public API ═══════════════ */

  /**
   * Extract every SEO-relevant field from the provided Cheerio DOM.
   *
   * @param $ — A CheerioAPI instance (produced by `cheerio.load(html)`).
   * @returns A fully populated {@link SeoResult}.
   */
  extract($: CheerioAPI): SeoResult {
    this.warnings = [];
    const startTime = Date.now();

    this.logger.info("SEO extraction started");

    const documentInfo = this.extractDocument($);
    const metaInfo = this.extractMeta($);
    const canonicalInfo = this.extractCanonical($);
    const openGraphInfo = this.extractOpenGraph($);
    const twitterInfo = this.extractTwitter($);
    const headingInfo = this.extractHeadings($);
    const imageInfos = this.extractImages($);
    const { internalLinks, externalLinks } = this.extractLinks($);
    const structuredDataInfos = this.extractStructuredData($);

    const stats: PageStats = {
      totalImages: imageInfos.length,
      totalInternalLinks: internalLinks.length,
      totalExternalLinks: externalLinks.length,
      totalStructuredData: structuredDataInfos.length,
      totalHeadings:
        headingInfo.h1.length +
        headingInfo.h2.length +
        headingInfo.h3.length +
        headingInfo.h4.length +
        headingInfo.h5.length +
        headingInfo.h6.length,
    };

    const elapsed = Date.now() - startTime;
    this.logger.info("SEO extraction complete", { ...stats, elapsed, warnings: this.warnings.length });
    for (const w of this.warnings) {
      this.logger.warn("SEO extraction warning", { source: w.source, message: w.message });
    }

    return Object.freeze({
      document: Object.freeze(documentInfo),
      meta: Object.freeze(metaInfo),
      canonical: Object.freeze(canonicalInfo),
      openGraph: Object.freeze(openGraphInfo),
      twitter: Object.freeze(twitterInfo),
      headings: Object.freeze(headingInfo),
      images: Object.freeze(imageInfos),
      internalLinks: Object.freeze(internalLinks),
      externalLinks: Object.freeze(externalLinks),
      structuredData: Object.freeze(structuredDataInfos),
      warnings: Object.freeze(this.warnings),
      stats: Object.freeze(stats),
    }) as SeoResult;
  }

  /* ═══════════════ Private extractors ═══════════════ */

  /* ── Document ── */

  private extractDocument($: CheerioAPI): DocumentInfo {
    return {
      title: this.extractTitle($),
      language: this.extractLanguage($),
      charset: this.extractCharset($),
      viewport: this.extractViewport($),
    };
  }

  /**
   * Extract the page title.
   *
   * When multiple `<title>` elements are found, the first is used
   * and a warning is recorded.
   */
  private extractTitle($: CheerioAPI): string | null {
    const titles = $("title");
    const count = titles.length;
    if (count === 0) return null;
    if (count > 1) {
      this.warn("title", `Found ${count} <title> elements — using the first`);
    }
    return titles.first().text().trim() || null;
  }

  /**
   * Extract the `lang` attribute from the `<html>` element.
   */
  private extractLanguage($: CheerioAPI): string | null {
    const lang = $("html").attr("lang");
    return lang && lang.length > 0 ? lang : null;
  }

  /**
   * Extract the declared charset from:
   *   1. `<meta charset="…">`
   *   2. `<meta http-equiv="Content-Type" content="text/html; charset=…">`
   */
  private extractCharset($: CheerioAPI): string | null {
    // Modern: <meta charset="utf-8">
    const charsetMeta = $('meta[charset]').first();
    const charsetVal = charsetMeta.attr("charset");
    if (charsetVal && charsetVal.length > 0) return charsetVal;

    // Legacy: <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    const httpEquiv = $('meta[http-equiv="Content-Type"]').first();
    const content = httpEquiv.attr("content");
    if (content) {
      const match = /charset=([^;]+)/i.exec(content);
      if (match?.[1]) return match[1].trim();
    }

    return null;
  }

  /**
   * Extract the content of `<meta name="viewport" content="…">`.
   */
  private extractViewport($: CheerioAPI): string | null {
    const el = $('meta[name="viewport"]').first();
    const content = el.attr("content");
    return content && content.length > 0 ? content : null;
  }

  /* ── Meta ── */

  private extractMeta($: CheerioAPI): MetaInfo {
    return {
      description: this.extractMetaDescription($),
      robots: this.extractMetaRobots($),
    };
  }

  private extractMetaDescription($: CheerioAPI): string | null {
    const el = $('meta[name="description"]').first();
    const content = el.attr("content");
    return content && content.length > 0 ? content : null;
  }

  private extractMetaRobots($: CheerioAPI): string | null {
    const el = $('meta[name="robots"]').first();
    const content = el.attr("content");
    return content && content.length > 0 ? content : null;
  }

  /* ── Canonical ── */

  private extractCanonical($: CheerioAPI): CanonicalInfo {
    const el = $('link[rel="canonical"]').first();
    const href = el.attr("href");
    return {
      url: href && href.length > 0 ? href : null,
    };
  }

  /* ── OpenGraph ── */

  private extractOpenGraph($: CheerioAPI): OpenGraphInfo {
    const result: Record<string, string> = {};
    $('meta[property^="og:"]').each((_i: number, el: DomNode) => {
      const property = $(el).attr("property");
      const content = $(el).attr("content");
      if (!property || content === undefined) return;

      if (property in result) {
        this.warn("open-graph", `Duplicate og: property "${property}" — keeping first value`);
        return;
      }
      result[property] = content;
    });

    return result;
  }

  /* ── Twitter ── */

  private extractTwitter($: CheerioAPI): TwitterInfo {
    const result: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_i: number, el: DomNode) => {
      const name = $(el).attr("name");
      const content = $(el).attr("content");
      if (!name || content === undefined) return;

      if (name in result) {
        this.warn("twitter", `Duplicate twitter: property "${name}" — keeping first value`);
        return;
      }
      result[name] = content;
    });

    return result;
  }

  /* ── Headings ── */

  private extractHeadings($: CheerioAPI): HeadingInfo {
    return {
      h1: this.extractHeadingLevel($, "h1"),
      h2: this.extractHeadingLevel($, "h2"),
      h3: this.extractHeadingLevel($, "h3"),
      h4: this.extractHeadingLevel($, "h4"),
      h5: this.extractHeadingLevel($, "h5"),
      h6: this.extractHeadingLevel($, "h6"),
    };
  }

  private extractHeadingLevel($: CheerioAPI, tag: string): readonly string[] {
    const headings: string[] = [];
    $(tag).each((_i: number, el: DomNode) => {
      const text = $(el).text().trim();
      if (text.length > 0) {
        headings.push(text);
      }
    });
    return headings;
  }

  /* ── Images ── */

  private extractImages($: CheerioAPI): readonly ImageInfo[] {
    const images: ImageInfo[] = [];
    const seenSrc = new Set<string>();

    $("img").each((_i: number, el: DomNode) => {
      const src = $(el).attr("src");
      if (!src || src.length === 0) return;

      // Deduplicate by raw src
      if (seenSrc.has(src)) return;
      seenSrc.add(src);

      images.push({
        src,
        alt: $(el).attr("alt") ?? null,
        title: $(el).attr("title") ?? null,
        loading: $(el).attr("loading") ?? null,
        width: parseNumericAttr(el, "width", $),
        height: parseNumericAttr(el, "height", $),
      });
    });

    return images;
  }

  /* ── Links ── */

  /**
   * Extract and classify all links, deduplicating by normalised URL.
   *
   * Links with `mailto:`, `tel:`, `javascript:`, or fragment-only
   * (`#…`) hrefs are skipped entirely.
   */
  private extractLinks(
    $: CheerioAPI,
  ): { internalLinks: readonly LinkInfo[]; externalLinks: readonly LinkInfo[] } {
    const internalLinks: LinkInfo[] = [];
    const externalLinks: LinkInfo[] = [];
    const seenNormalized = new Set<string>();

    $('a[href]').each((_i: number, el: DomNode) => {
      const href = getHref(el, $);
      if (!href) return;

      // Skip unwanted protocols and fragments
      if (this.shouldSkipHref(href)) return;

      const text = $(el).text().trim();
      const normalizedUrl = resolveUrl(href, this.baseUrl);
      if (!normalizedUrl) {
        // Could not normalise — still include as-is for visibility
        // but treat as external to be safe
        externalLinks.push({ href, text, normalizedUrl: null });
        return;
      }

      // Deduplicate by normalized URL
      if (seenNormalized.has(normalizedUrl)) return;
      seenNormalized.add(normalizedUrl);

      if (this.isInternalUrl(normalizedUrl)) {
        internalLinks.push({ href, text, normalizedUrl });
      } else {
        externalLinks.push({ href, text, normalizedUrl });
      }
    });

    return { internalLinks, externalLinks };
  }

  /**
   * Determine whether an href value should be skipped.
   */
  private shouldSkipHref(href: string): boolean {
    const lower = href.trim().toLowerCase();
    return (
      lower.startsWith("mailto:") ||
      lower.startsWith("tel:") ||
      lower.startsWith("javascript:") ||
      lower.startsWith("#")
    );
  }

  /**
   * Compare hostnames (with www. prefix stripped) to determine
   * whether a normalised URL is internal to the crawl domain.
   */
  private isInternalUrl(normalizedUrl: string): boolean {
    try {
      const urlHost = new URL(normalizedUrl).hostname.replace(/^www\./, "");
      const baseHost = new URL(this.baseUrl).hostname.replace(/^www\./, "");
      return urlHost === baseHost;
    } catch {
      return false;
    }
  }

  /* ── Structured data ── */

  private extractStructuredData($: CheerioAPI): readonly StructuredDataInfo[] {
    const results: StructuredDataInfo[] = [];

    $('script[type="application/ld+json"]').each((_i: number, el: DomNode) => {
      const raw = $(el).text().trim();
      if (raw.length === 0) return;

      let json: Record<string, unknown> | unknown[] | null = null;
      try {
        json = JSON.parse(raw) as Record<string, unknown> | unknown[];
      } catch {
        this.warn("json-ld", "Invalid JSON in application/ld+json script block");
      }

      results.push({ raw, json });
    });

    return results;
  }

  /* ── Warnings ── */

  private warn(source: string, message: string): void {
    this.warnings.push({ source, message });
  }
}
