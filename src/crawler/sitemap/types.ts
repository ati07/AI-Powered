/**
 * Crawler — sitemap type definitions.
 */

/**
 * A single URL entry discovered inside a `<urlset>` sitemap.
 */
export interface SitemapEntry {
  /** Absolute URL of the page. */
  readonly loc: string;
  /** ISO-8601 last-modified date, or null when absent. */
  readonly lastmod: string | null;
  /** Change frequency hint (always, hourly, daily, weekly, monthly, yearly, never), or null. */
  readonly changefreq: string | null;
  /** Priority hint (0.0 – 1.0), or null when absent. */
  readonly priority: number | null;
}

/**
 * A child sitemap reference inside a `<sitemapindex>`.
 */
export interface SitemapIndexEntry {
  /** Absolute URL of the child sitemap. */
  readonly loc: string;
  /** ISO-8601 last-modified date, or null when absent. */
  readonly lastmod: string | null;
}

/**
 * Discriminated result from one call to {@link SitemapParser.parse}.
 */
export interface SitemapParseResult {
  /**
   * Detected type of the parsed XML:
   * - `"urlset"`       → contains page URLs
   * - `"sitemapindex"` → contains child sitemap references
   * - `"unknown"`      → could not be recognised
   */
  readonly type: "urlset" | "sitemapindex" | "unknown";
  /** Page entries (populated when type is `urlset`). */
  readonly entries: SitemapEntry[];
  /** Child sitemap references (populated when type is `sitemapindex`). */
  readonly childSitemaps: SitemapIndexEntry[];
}

/**
 * Final result returned by {@link SitemapService.discover}.
 */
export interface SitemapResult {
  /** All discovered (and deduplicated) page entries. */
  readonly entries: SitemapEntry[];
  /** Number of sitemap files that were downloaded and parsed. */
  readonly sitemapsProcessed: number;
  /** Total number of unique URLs discovered. */
  readonly urlsDiscovered: number;
}
