/**
 * Crawler — URL Discovery type definitions.
 *
 * Describes the shape of queue entries and the output of the
 * discovery service.
 */

/**
 * Origin of a discovered URL.
 */
export enum DiscoverySource {
  /** Discovered via XML sitemap. */
  SITEMAP = "sitemap",
  /** The website homepage (seed URL). */
  HOMEPAGE = "homepage",
  /** Found as an internal link on another crawled page. */
  INTERNAL_LINK = "internal_link",
  /** Discovered via a <link rel="canonical"> tag. */
  CANONICAL = "canonical",
}

/**
 * A single entry in the crawl queue.
 */
export interface QueueEntry {
  /** Original URL as it was discovered (before normalisation). */
  readonly url: string;
  /** Normalised version of the URL (lowercase host, no default port, …). */
  readonly normalizedUrl: string;
  /** URL of the page that linked to this one, or `null` for seed URLs. */
  readonly parentUrl: string | null;
  /** Crawl depth (0 = seed URL). */
  readonly depth: number;
  /** How this URL was discovered. */
  readonly source: DiscoverySource;
  /** ISO-8601 timestamp of when this entry was created. */
  readonly discoveredAt: string;
}

/**
 * Outcome of the discovery process.
 */
export interface DiscoveryResult {
  /** Queue entries that were successfully added. */
  readonly entries: QueueEntry[];
  /** Total number of input URLs processed. */
  readonly totalUrls: number;
  /** URLs that could not be parsed or had an invalid scheme. */
  readonly skippedUrls: number;
  /** URLs that were excluded because they were already in the queue. */
  readonly duplicateUrls: number;
  /** URLs that were excluded because they belong to a different domain. */
  readonly externalUrls: number;
}
