/**
 * Crawler — shared configuration.
 *
 * Generic limits and settings reused across crawler modules
 * (robots.txt, sitemaps, HTML pages, …).
 */

/**
 * Configurable limits that govern crawler behaviour.
 *
 * All limits are optional — the defaults are safe for typical
 * production use.
 */
export interface CrawlConfig {
  /** Maximum recursion depth for sitemap indexes (default: 3). */
  readonly maxDepth: number;
  /** Maximum number of sitemap files to download (default: 50). */
  readonly maxSitemaps: number;
  /** Maximum number of discovered URLs to collect (default: 100 000). */
  readonly maxUrls: number;
}

/* ──────────────── Defaults ──────────────── */

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  maxDepth: 3,
  maxSitemaps: 50,
  maxUrls: 100_000,
} as const;
