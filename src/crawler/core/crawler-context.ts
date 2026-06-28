/**
 * Crawler — shared context object.
 *
 * Bundles the dependencies every crawler module needs so the
 * CrawlProcessor can pass a single object through the pipeline.
 * Adding new shared state later (scan ID, website info, …) means
 * one change here instead of touching every module's constructor.
 */

import { type ILogger } from "@/shared/logger";
import { HttpClient } from "@/shared/http/http-client";
import { type CrawlConfig, DEFAULT_CRAWL_CONFIG } from "./crawl-config";

export interface CrawlerContext {
  readonly logger: ILogger;
  readonly httpClient: HttpClient;
  readonly config: CrawlConfig;
  /** The website origin (e.g. `https://example.com`). */
  readonly baseUrl: string;
  /** Unique scan identifier, set when a scan is in progress. */
  readonly scanId?: string;
  /** Website identifier, set when a scan is in progress. */
  readonly websiteId?: string;
}

/* ──────────────── Factory ──────────────── */

export interface CrawlerContextOptions {
  readonly config?: Partial<CrawlConfig>;
  readonly baseUrl?: string;
  readonly scanId?: string;
  readonly websiteId?: string;
}

export function createCrawlerContext(
  logger: ILogger,
  httpClient: HttpClient,
  config?: Partial<CrawlConfig>,
  overrides?: Pick<CrawlerContextOptions, "baseUrl" | "scanId" | "websiteId">,
): CrawlerContext {
  return {
    logger,
    httpClient,
    baseUrl: overrides?.baseUrl ?? "",
    scanId: overrides?.scanId,
    websiteId: overrides?.websiteId,
    config: {
      maxDepth: config?.maxDepth ?? DEFAULT_CRAWL_CONFIG.maxDepth,
      maxSitemaps: config?.maxSitemaps ?? DEFAULT_CRAWL_CONFIG.maxSitemaps,
      maxUrls: config?.maxUrls ?? DEFAULT_CRAWL_CONFIG.maxUrls,
    },
  };
}
