/**
 * Crawler — URL Discovery Engine.
 *
 * Combines URLs from multiple discovery sources (sitemap, homepage),
 * normalises them, filters external domains and unsupported schemes,
 * deduplicates, and produces a FIFO crawl queue.
 *
 * This service does **not** download HTML — it only prepares the
 * queue that later stories consume.
 *
 * Usage:
 *   const service = new DiscoveryService(ctx);
 *   const result = await service.discover({
 *     sitemapUrls: ["https://example.com/page1", "https://example.com/page2"],
 *     homepageUrl: "https://example.com",
 *   });
 *   // result.entries → QueueEntry[] sorted FIFO
 *   // result.entries[0].source === DiscoverySource.HOMEPAGE
 *   // result.entries[1].source === DiscoverySource.SITEMAP
 */

import { type ILogger } from "@/shared/logger";
import { normalizeUrl } from "@/shared/http/url";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import { UrlQueue } from "./queue";
import {
  type QueueEntry,
  type DiscoveryResult,
  DiscoverySource,
} from "./types";

/* ──────────────── Service ──────────────── */

export interface DiscoverParams {
  /** Page URLs discovered via XML sitemaps. */
  readonly sitemapUrls: string[];
  /** The website homepage URL (seed). */
  readonly homepageUrl: string;
}

export class DiscoveryService {
  private readonly logger: ILogger;
  private readonly baseUrl: string;

  constructor(ctx: CrawlerContext) {
    this.logger = ctx.logger;
    this.baseUrl = ctx.baseUrl;
  }

  /**
   * Discover crawlable URLs from the given sources.
   *
   * The homepage is always added first (depth 0, source HOMEPAGE).
   * Sitemap URLs follow (depth 0, source SITEMAP).
   *
   * Never throws — all errors are captured in the result counters.
   */
  discover(params: DiscoverParams): DiscoveryResult {
    const queue = new UrlQueue();
    let skippedUrls = 0;
    let duplicateUrls = 0;
    let externalUrls = 0;

    /* ── Homepage seed ── */
    this.logger.info("URL discovery started", {
      homepageUrl: params.homepageUrl,
      sitemapCount: params.sitemapUrls.length,
    });

    const homepageResult = this.tryAddEntry(
      queue,
      params.homepageUrl,
      null,
      DiscoverySource.HOMEPAGE,
      0,
    );
    if (homepageResult === "skipped") skippedUrls++;
    if (homepageResult === "external") externalUrls++;
    if (homepageResult === "duplicate") duplicateUrls++;

    /* ── Sitemap URLs ── */
    for (const url of params.sitemapUrls) {
      const result = this.tryAddEntry(
        queue,
        url,
        null,
        DiscoverySource.SITEMAP,
        0,
      );
      if (result === "skipped") skippedUrls++;
      if (result === "external") externalUrls++;
      if (result === "duplicate") duplicateUrls++;
    }

    /* ── Summary ── */
    const entries = queue.toArray() as QueueEntry[];
    const totalUrls = 1 + params.sitemapUrls.length;

    this.logger.info("URL discovery completed", {
      totalUrls,
      added: entries.length,
      skipped: skippedUrls,
      duplicates: duplicateUrls,
      external: externalUrls,
    });

    return {
      entries,
      totalUrls,
      skippedUrls,
      duplicateUrls,
      externalUrls,
    };
  }

  /* ──────────────── Private helpers ──────────────── */

  /**
   * Attempt to validate and add a URL to the queue.
   *
   * Returns the outcome: `"added"`, `"skipped"`, `"external"`, or
   * `"duplicate"`.
   */
  private tryAddEntry(
    queue: UrlQueue,
    url: string,
    parentUrl: string | null,
    source: DiscoverySource,
    depth: number,
  ): "added" | "skipped" | "external" | "duplicate" {
    /* ── Normalise & validate scheme ── */
    const normalized = normalizeUrl(url);
    if (!normalized) {
      this.logger.warn("URL discovery — invalid or unsupported scheme", {
        url,
        source,
      });
      return "skipped";
    }

    /* ── Reject external domains ── */
    if (this.baseUrl && this.isExternalDomain(normalized)) {
      this.logger.info("URL discovery — external domain rejected", {
        url: normalized,
        source,
      });
      return "external";
    }

    /* ── Build queue entry ── */
    const entry: QueueEntry = {
      url,
      normalizedUrl: normalized,
      parentUrl,
      depth,
      source,
      discoveredAt: new Date().toISOString(),
    };

    const result = queue.enqueue(entry);

    if (result === "duplicate") {
      this.logger.info("URL discovery — duplicate skipped", {
        url: normalized,
        source,
      });
      return "duplicate";
    }

    this.logger.info("URL discovery — URL added to queue", {
      url: normalized,
      source,
      depth,
    });
    return "added";
  }

  /**
   * Compare hostnames (with `www.` prefix stripped) to determine
   * whether a URL belongs to a different domain.
   */
  private isExternalDomain(normalizedUrl: string): boolean {
    try {
      const urlHost = new URL(normalizedUrl).hostname.replace(/^www\./, "");
      const baseHost = new URL(this.baseUrl).hostname.replace(/^www\./, "");
      return urlHost !== baseHost;
    } catch {
      return true;
    }
  }
}
