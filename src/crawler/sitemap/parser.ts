/**
 * Crawler — XML sitemap parser.
 *
 * Supports both `<urlset>` and `<sitemapindex>` formats.
 * Extraction is regex-based (sitemap XML is highly regular),
 * avoiding XML-parser dependencies and namespace complexity.
 *
 * Never throws — malformed XML produces an empty result.
 */

import {
  type SitemapEntry,
  type SitemapIndexEntry,
  type SitemapParseResult,
} from "./types";

export class SitemapParser {
  /**
   * Parse raw sitemap XML.
   *
   * @param raw — Raw XML text.
   * @returns A structured parse result. Never throws.
   */
  parse(raw: string): SitemapParseResult {
    const entries = this.extractUrlEntries(raw);
    const childSitemaps = this.extractSitemapIndexEntries(raw);

    if (entries.length > 0) {
      return { type: "urlset", entries, childSitemaps };
    }
    if (childSitemaps.length > 0) {
      return { type: "sitemapindex", entries: [], childSitemaps };
    }
    return { type: "unknown", entries: [], childSitemaps: [] };
  }

  /* ──────────────── Private helpers ──────────────── */

  /**
   * Extract all `<url>` blocks and parse each into a {@link SitemapEntry}.
   */
  private extractUrlEntries(xml: string): SitemapEntry[] {
    const entries: SitemapEntry[] = [];
    const urlBlockRe = /<url[^>]*>([\s\S]*?)<\/url>/gi;
    let match: RegExpExecArray | null;

    while ((match = urlBlockRe.exec(xml)) !== null) {
      const block = match[1]!;
      const loc = this.extractText(block, "loc");
      if (loc === undefined) continue;

      entries.push({
        loc,
        lastmod: this.extractText(block, "lastmod") ?? null,
        changefreq: this.extractText(block, "changefreq") ?? null,
        priority: this.parsePriority(this.extractText(block, "priority")),
      });
    }

    return entries;
  }

  /**
   * Extract all `<sitemap>` blocks and parse each into a
   * {@link SitemapIndexEntry}.
   */
  private extractSitemapIndexEntries(xml: string): SitemapIndexEntry[] {
    const entries: SitemapIndexEntry[] = [];
    const sitemapBlockRe = /<sitemap[^>]*>([\s\S]*?)<\/sitemap>/gi;
    let match: RegExpExecArray | null;

    while ((match = sitemapBlockRe.exec(xml)) !== null) {
      const block = match[1]!;
      const loc = this.extractText(block, "loc");
      if (loc === undefined) continue;

      entries.push({
        loc,
        lastmod: this.extractText(block, "lastmod") ?? null,
      });
    }

    return entries;
  }

  /**
   * Extract the text content of the first occurrence of `tag` inside `xmlBlock`.
   * Handles CDATA sections and leading/trailing whitespace.
   *
   * Returns `undefined` when the tag is absent.
   */
  private extractText(xmlBlock: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const match = regex.exec(xmlBlock);
    if (!match) return undefined;
    return this.stripCdata(match[1]!.trim());
  }

  /**
   * Remove CDATA wrappers from text.
   */
  private stripCdata(text: string): string {
    return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  }

  /**
   * Parse a `<priority>` string to a number, or return null.
   */
  private parsePriority(raw: string | undefined): number | null {
    if (raw === undefined) return null;
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }
}
