/**
 * Crawler — sitemap discovery service.
 *
 * Recursively discovers URLs from XML sitemaps with configurable
 * depth, file-count, and URL-count limits.  Deduplicates results
 * and validates URL schemes.
 *
 * Usage:
 *   const service = new SitemapService(logger, httpClient);
 *   const result = await service.discover("https://example.com/sitemap.xml");
 *   // result.entries          → deduplicated SitemapEntry[]
 *   // result.sitemapsProcessed → count of files downloaded
 *   // result.urlsDiscovered   → total unique URL count
 */

import { type ILogger } from "@/shared/logger";
import { normalizeUrl } from "@/shared/http/url";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import { SitemapDownloader } from "./downloader";
import { SitemapParser } from "./parser";
import { type SitemapEntry, type SitemapResult } from "./types";

/* ──────────────── Internal state ──────────────── */

/**
 * Mutable state threaded through recursive discovery.
 */
interface CrawlState {
  /** Sitemap URLs already downloaded (dedup guard, Set of normalized URLs). */
  readonly seenSitemaps: Set<string>;
  /** Page URLs already collected (dedup guard, Set of normalized URLs). */
  readonly seenUrls: Set<string>;
  /** Accumulated page entries. */
  readonly entries: SitemapEntry[];
  /** Total sitemaps downloaded so far. */
  sitemapsProcessed: number;
  /** Set to true when any limit is exceeded — stops further recursion. */
  limitExceeded: boolean;
}

/* ──────────────── Service ──────────────── */

export class SitemapService {
  private readonly downloader: SitemapDownloader;
  private readonly parser: SitemapParser;
  private readonly logger: ILogger;
  private readonly config;

  constructor(ctx: CrawlerContext) {
    this.downloader = new SitemapDownloader(ctx);
    this.parser = new SitemapParser();
    this.logger = ctx.logger;
    this.config = ctx.config;
  }

  /**
   * Discover all sitemap URLs starting from `startUrl`.
   *
   * @param startUrl — Entry-point sitemap URL.
   * @returns A {@link SitemapResult} — never throws.
   */
  async discover(startUrl: string): Promise<SitemapResult> {
    const state: CrawlState = {
      seenSitemaps: new Set<string>(),
      seenUrls: new Set<string>(),
      entries: [],
      sitemapsProcessed: 0,
      limitExceeded: false,
    };

    await this.recurse(startUrl, 0, state);

    return {
      entries: state.entries,
      sitemapsProcessed: state.sitemapsProcessed,
      urlsDiscovered: state.entries.length,
    };
  }

  /* ──────────────── Recursion ──────────────── */

  private async recurse(
    url: string,
    depth: number,
    state: CrawlState,
  ): Promise<void> {
    /* ── Guard: depth exceeded ── */
    if (depth > this.config.maxDepth) {
      this.logger.info("sitemap recursion depth limit reached", {
        url,
        depth,
        maxDepth: this.config.maxDepth,
      });
      return;
    }

    /* ── Guard: already seen this sitemap ── */
    const normalized = normalizeUrl(url);
    if (!normalized) {
      this.logger.warn("sitemap URL is invalid — skipping", { url });
      return;
    }

    if (state.seenSitemaps.has(normalized)) {
      this.logger.info("sitemap already processed — skipping", { url: normalized });
      return;
    }
    state.seenSitemaps.add(normalized);

    /* ── Guard: sitemap count limit ── */
    if (state.sitemapsProcessed >= this.config.maxSitemaps) {
      if (!state.limitExceeded) {
        this.logger.info("sitemap limit reached — stopping discovery", {
          maxSitemaps: this.config.maxSitemaps,
        });
        state.limitExceeded = true;
      }
      return;
    }

    /* ── Download ── */
    const xml = await this.downloader.download(normalized);
    if (xml === "") {
      this.logger.warn("sitemap download returned empty — skipping", {
        url: normalized,
      });
      return;
    }

    /* ── Parse ── */
    state.sitemapsProcessed++;

    const result = this.parser.parse(xml);

    if (result.type === "unknown") {
      this.logger.info("sitemap could not be parsed — empty or malformed XML", {
        url: normalized,
      });
      return;
    }

    /* ── Sitemap index — recurse into children ── */
    if (result.type === "sitemapindex") {
      this.logger.info("sitemap index discovered — recursing", {
        url: normalized,
        children: result.childSitemaps.length,
        depth,
      });

      for (const child of result.childSitemaps) {
        if (state.limitExceeded) return;
        await this.recurse(child.loc, depth + 1, state);
      }
      return;
    }

    /* ── Urlset — collect page entries ── */
    this.logger.info("sitemap urls discovered", {
      url: normalized,
      count: result.entries.length,
    });

    for (const entry of result.entries) {
      if (state.limitExceeded) return;

      const normalizedLoc = normalizeUrl(entry.loc);
      if (!normalizedLoc) {
        this.logger.warn("sitemap entry has invalid URL — skipping", {
          loc: entry.loc,
        });
        continue;
      }

      /* ── Deduplicate ── */
      if (state.seenUrls.has(normalizedLoc)) {
        this.logger.info("duplicate URL skipped", { url: normalizedLoc });
        continue;
      }
      state.seenUrls.add(normalizedLoc);

      /* ── URL limit ── */
      if (state.entries.length >= this.config.maxUrls) {
        this.logger.info("URL limit reached — stopping discovery", {
          maxUrls: this.config.maxUrls,
        });
        state.limitExceeded = true;
        return;
      }

      state.entries.push({
        loc: normalizedLoc,
        lastmod: entry.lastmod,
        changefreq: entry.changefreq,
        priority: entry.priority,
      });
    }
  }

  /* ──────────────── URL helpers ──────────────── */
}
