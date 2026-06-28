/**
 * Crawler — robots.txt type definitions.
 */

/**
 * Parsed rules for a single user-agent group inside robots.txt.
 */
export interface RobotsGroup {
  /** User-agent values this group applies to. */
  userAgents: string[];
  /** Allow path patterns. */
  allowRules: string[];
  /** Disallow path patterns. */
  disallowRules: string[];
  /** Crawl-delay in seconds, or null when not specified. */
  crawlDelay: number | null;
}

/**
 * Structured result from parsing a robots.txt file.
 */
export interface RobotsResult {
  /** Per-user-agent rule groups. */
  groups: RobotsGroup[];
  /** Sitemap URLs discovered (global, not per-group). */
  sitemapUrls: string[];
}
