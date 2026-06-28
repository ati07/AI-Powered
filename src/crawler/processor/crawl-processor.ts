/**
 * ── CrawlProcessor ───────────────────────────────────────
 *  End-to-end crawl pipeline orchestrator.
 *
 *  Implements JobProcessor.  Wires together every crawler module
 *  into a production-ready pipeline:
 *
 *    1. Load scan & website
 *    2. PENDING → RUNNING
 *    3. Fetch robots.txt for sitemap URLs
 *    4. Recursively discover sitemap entries
 *    5. Build the crawl queue (homepage seed + sitemap URLs)
 *    6. Process every URL sequentially:
 *       Download → Parse → Extract SEO → Persist page
 *    7. RUNNING → COMPLETED (or FAILED on fatal error)
 *
 *  Individual page failures are tracked via `pagesFailed` and
 *  do NOT fail the scan.  Fatal infrastructure errors propagate
 *  and transition the scan to FAILED.
 * ─────────────────────────────────────────────────────────
 */

import { type JobProcessor } from "@/worker/processors/job-processor";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type ILogger } from "@/shared/logger";
import { HttpClient } from "@/shared/http/http-client";
import {
  type CrawlConfig,
  DEFAULT_CRAWL_CONFIG,
} from "@/crawler/core/crawl-config";
import { createCrawlerContext } from "@/crawler/core/crawler-context";
import { RobotsService } from "@/crawler/robots/service";
import { SitemapService } from "@/crawler/sitemap/service";
import { DiscoveryService } from "@/crawler/discovery/service";
import { HtmlDownloader } from "@/crawler/html/downloader";
import { isDownloadSuccess } from "@/crawler/html/downloader";
import { HtmlParser } from "@/crawler/parser/parser";
import { SeoExtractor } from "@/crawler/parser/extractor";
import { CreatePageUseCase } from "@/application/page/use-cases/create-page.use-case";
import { ScorePageUseCase } from "@/application/scoring/score-page.usecase";
import { ScanSummaryUseCase } from "@/application/scoring/scan-summary.usecase";
import type { QueueEntry } from "@/crawler/discovery/types";
import type { CreatePageInput } from "@/application/page/page.schema";
import type { PageEntity } from "@/domain/entities/page.entity";

/* ──────────────── Types ──────────────── */

/**
 * Optional per-scan services for dependency injection.
 *
 * When provided the CrawlProcessor uses these instead of creating
 * fresh ones, allowing tests to inject mocks.
 */
export interface CrawlServices {
  readonly sitemapService: SitemapService;
  readonly discoveryService: DiscoveryService;
  readonly htmlDownloader: HtmlDownloader;
  readonly htmlParser: HtmlParser;
  readonly seoExtractor: SeoExtractor;
}

/* ──────────────── Constants ──────────────── */

/** Default sitemap path when robots.txt provides none. */
const DEFAULT_SITEMAP_PATH = "/sitemap.xml";

/** Error message used when a website cannot be found. */
const WEBSITE_NOT_FOUND_MSG = "Website not found — cannot determine base URL";

/* ──────────────── Processor ──────────────── */

export class CrawlProcessor implements JobProcessor {
  private readonly httpClient: HttpClient;
  private readonly robotsService: RobotsService;

  constructor(
    private readonly scanRepo: IScanRepository,
    private readonly websiteRepo: IWebsiteRepository,
    private readonly createPageUseCase: CreatePageUseCase,
    private readonly scorePageUseCase: ScorePageUseCase,
    private readonly scanSummaryUseCase: ScanSummaryUseCase,
    private readonly logger: ILogger,
    httpClient: HttpClient,
    private readonly config: CrawlConfig = DEFAULT_CRAWL_CONFIG,
    /** Injectable per-scan services (for testing). */
    private readonly services?: CrawlServices,
  ) {
    this.httpClient = httpClient;
    this.robotsService = new RobotsService(logger, httpClient);
  }

  /**
   * Process a single scan through the entire crawl pipeline.
   *
   * @param scanId — The ID of the scan to process.
   */
  async process(scanId: string): Promise<void> {
    /* ════════════════════════════════════════════
       1. Load scan
       ════════════════════════════════════════════ */
    const scan = await this.scanRepo.findById({ id: scanId });
    if (!scan) {
      this.logger.warn(`Scan ${scanId} not found, skipping`);
      return;
    }
    this.logger.info(`Processing scan ${scanId} (status=${scan.status})`);

    /* ════════════════════════════════════════════
       2. Load website for base URL
       ════════════════════════════════════════════ */
    const website = await this.websiteRepo.findById({ id: scan.websiteId });
    if (!website) {
      this.logger.error(
        `Website ${scan.websiteId} not found for scan ${scanId} — failing scan`,
      );

      // Must start the scan first (PENDING → RUNNING) before failing it,
      // because the domain state machine only allows RUNNING → FAILED.
      const started = scan.start();
      await this.scanRepo.update({
        id: started.id,
        status: started.status,
        startedAt: started.startedAt,
        updatedAt: new Date(),
      });

      const failed = started.fail(WEBSITE_NOT_FOUND_MSG);
      await this.scanRepo.update({
        id: failed.id,
        status: failed.status,
        finishedAt: failed.finishedAt,
        error: failed.error,
        updatedAt: new Date(),
      });
      return;
    }

    const rawDomain = website.domain.getOriginalValue();
    const baseUrl = rawDomain.startsWith("http://") || rawDomain.startsWith("https://")
      ? rawDomain
      : `https://${rawDomain}`;

    /* ════════════════════════════════════════════
       3. Transition PENDING → RUNNING
       ════════════════════════════════════════════ */
    const running = scan.start();
    await this.scanRepo.update({
      id: running.id,
      status: running.status,
      startedAt: running.startedAt,
      updatedAt: new Date(),
    });
    this.logger.info(`Scan ${scanId} started`, { baseUrl });

    /* ════════════════════════════════════════════
       4. Build per-scan CrawlerContext & services
       ════════════════════════════════════════════ */
    const ctx = createCrawlerContext(
      this.logger,
      this.httpClient,
      this.config,
      { baseUrl, scanId, websiteId: scan.websiteId },
    );

    const sitemapService =
      this.services?.sitemapService ?? new SitemapService(ctx);
    const discoveryService =
      this.services?.discoveryService ?? new DiscoveryService(ctx);
    const htmlDownloader =
      this.services?.htmlDownloader ?? new HtmlDownloader(ctx);
    const htmlParser =
      this.services?.htmlParser ?? new HtmlParser(ctx);
    const seoExtractor =
      this.services?.seoExtractor ?? new SeoExtractor(ctx);

    try {
      /* ════════════════════════════════════════════
         5. Pipeline — Robots → Sitemaps → Discovery
         ════════════════════════════════════════════ */

      // 5a. Fetch robots.txt for sitemap URLs
      this.logger.info("Fetching robots.txt", { baseUrl });
      const robotsResult = await this.robotsService.fetchAndParse(baseUrl);
      const sitemapUrls = robotsResult.sitemapUrls;
      this.logger.info(
        `Found ${sitemapUrls.length} sitemap URL(s) in robots.txt`,
      );

      // 5b. Discover sitemap entries recursively
      const sitemapStartUrls =
        sitemapUrls.length > 0
          ? sitemapUrls
          : [`${baseUrl}${DEFAULT_SITEMAP_PATH}`];

      const allSitemapEntries: Array<{ loc: string }> = [];
      for (const sitemapUrl of sitemapStartUrls) {
        const result = await sitemapService.discover(sitemapUrl);
        allSitemapEntries.push(...result.entries);
        this.logger.info("Sitemap discovery result", {
          url: sitemapUrl,
          urlsDiscovered: result.urlsDiscovered,
          sitemapsProcessed: result.sitemapsProcessed,
        });
      }
      this.logger.info(
        `Total discovered from sitemaps: ${allSitemapEntries.length} URLs`,
      );

      // 5c. Build the crawl queue
      const sitemapPageUrls = allSitemapEntries.map((e) => e.loc);
      const discoveryResult = discoveryService.discover({
        sitemapUrls: sitemapPageUrls,
        homepageUrl: baseUrl,
      });

      const queueEntries = discoveryResult.entries;
      const totalUrls = queueEntries.length;
      this.logger.info("Crawl queue built", {
        totalUrls,
        skippedUrls: discoveryResult.skippedUrls,
        duplicateUrls: discoveryResult.duplicateUrls,
        externalUrls: discoveryResult.externalUrls,
      });

      /* ════════════════════════════════════════════
         6. Process each URL in sequence
         ════════════════════════════════════════════ */

      // Initialise counters
      let pagesCrawled = 0;
      let pagesFailedCount = 0;

      // Set pagesFound before processing starts
      if (totalUrls > 0) {
        await this.scanRepo.updateProgress({
          id: scanId,
          pagesFound: totalUrls,
          pagesCrawled: 0,
          pagesFailed: 0,
        });
      }

      for (const entry of queueEntries) {
        try {
          const savedPage = await this.processPage(
            entry,
            scanId,
            htmlDownloader,
            htmlParser,
            seoExtractor,
          );

          // Score the page after successful persistence
          if (savedPage) {
            try {
              await this.scorePageUseCase.execute({ page: savedPage });
            } catch (scoreErr) {
              // Scoring failure is non-fatal — log and continue
              this.logger.warn("Page scoring failed — continuing scan", {
                url: entry.normalizedUrl,
                error: scoreErr instanceof Error ? scoreErr.message : "Unknown error",
              });
            }
          }

          // Success
          pagesCrawled++;
          this.logger.info("Page crawled and scored successfully", {
            url: entry.normalizedUrl,
            totalCrawled: pagesCrawled,
            totalFailed: pagesFailedCount,
            remaining: totalUrls - pagesCrawled - pagesFailedCount,
          });
        } catch (err) {
          // Individual page failure — count and continue
          pagesFailedCount++;
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";

          this.logger.warn("Page processing failed — continuing scan", {
            url: entry.normalizedUrl,
            error: errorMessage,
            totalCrawled: pagesCrawled,
            totalFailed: pagesFailedCount,
          });
        }

        // Persist progress after every URL
        await this.scanRepo.updateProgress({
          id: scanId,
          pagesFound: totalUrls,
          pagesCrawled,
          pagesFailed: pagesFailedCount,
        });
      }

      /* ════════════════════════════════════════════
         7. Compute scan summary & transition COMPLETED
         ════════════════════════════════════════════ */

      // Compute and persist the AI Visibility Score summary
      try {
        const summary = await this.scanSummaryUseCase.execute({
          scanId,
        });
        this.logger.info("Scan summary computed", {
          averageScore: summary.averageScore,
          highestScore: summary.highestScore,
          lowestScore: summary.lowestScore,
          pagesScored: summary.pagesScored,
        });
      } catch (summaryErr) {
        this.logger.warn("Failed to compute scan summary — continuing", {
          error: summaryErr instanceof Error ? summaryErr.message : "Unknown error",
        });
      }

      const completed = running.complete();
      await this.scanRepo.update({
        id: completed.id,
        status: completed.status,
        finishedAt: completed.finishedAt,
        pagesFound: totalUrls,
        pagesCrawled,
        pagesFailed: pagesFailedCount,
        updatedAt: new Date(),
      });

      this.logger.info(`Scan ${scanId} completed`, {
        pagesFound: totalUrls,
        pagesCrawled,
        pagesFailed: pagesFailedCount,
      });
    } catch (err) {
      /* ════════════════════════════════════════════
         8. On fatal error: RUNNING → FAILED
         ════════════════════════════════════════════ */
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      this.logger.error(`Scan ${scanId} failed: ${errorMessage}`);

      const failed = running.fail(errorMessage);
      try {
        await this.scanRepo.update({
          id: failed.id,
          status: failed.status,
          finishedAt: failed.finishedAt,
          error: failed.error,
          updatedAt: new Date(),
        });
      } catch (updateErr) {
        // Last-resort: if even the FAILED update fails, log and swallow
        this.logger.error(
          `Failed to update scan ${scanId} to FAILED status: ${
            updateErr instanceof Error ? updateErr.message : String(updateErr)
          }`,
        );
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Private helpers
     ═══════════════════════════════════════════════ */

  /**
   * Filter a record-like object, removing any undefined values so the
   * result satisfies `Record<string, string>`.
   */
  private filterRecord(
    obj: Readonly<Record<string, string | undefined>>,
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Process a single page: download → parse → extract SEO → persist.
   *
   * Returns the saved PageEntity on success.
   * Throws on any error — the caller is responsible for counting
   * failures and deciding whether to continue.
   */
  private async processPage(
    entry: QueueEntry,
    scanId: string,
    downloader: HtmlDownloader,
    parser: HtmlParser,
    extractor: SeoExtractor,
  ): Promise<PageEntity> {
    /* ── 6a. Download ── */
    const downloadResult = await downloader.download(entry.normalizedUrl);

    if (!isDownloadSuccess(downloadResult)) {
      const errorType = downloadResult.error;
      throw new Error(
        `Download failed: ${errorType}` +
          (downloadResult.statusCode
            ? ` (HTTP ${downloadResult.statusCode})`
            : ""),
      );
    }

    /* ── 6b. Parse HTML ── */
    const extractionStart = Date.now();
    const $ = parser.parse(downloadResult.html);

    /* ── 6c. Extract SEO data ── */
    const seoResult = extractor.extract($);
    const extractionDurationMs = Date.now() - extractionStart;

    /* ── 6d. Build CreatePageInput ── */
    const pageInput: CreatePageInput = {
      scanId,
      url: entry.url,
      finalUrl: downloadResult.finalUrl,
      statusCode: downloadResult.statusCode,
      contentType: downloadResult.contentType,

      // Document / Meta
      title: seoResult.document.title ?? null,
      metaDescription: seoResult.meta.description ?? null,
      canonical: seoResult.canonical.url ?? null,
      robots: seoResult.meta.robots ?? null,

      // Social (filter out undefined values — OpenGraphInfo/TwitterInfo
      // allow optional properties but CreatePageInput requires string values)
      openGraph: this.filterRecord(seoResult.openGraph),
      twitter: this.filterRecord(seoResult.twitter),

      // Structure
      language: seoResult.document.language ?? null,
      charset: seoResult.document.charset ?? null,
      viewport: seoResult.document.viewport ?? null,

      // Collections (spread readonly arrays into mutable ones)
      headings: {
        h1: [...seoResult.headings.h1],
        h2: [...seoResult.headings.h2],
        h3: [...seoResult.headings.h3],
        h4: [...seoResult.headings.h4],
        h5: [...seoResult.headings.h5],
        h6: [...seoResult.headings.h6],
      },
      images: [...seoResult.images],
      links: [
        ...seoResult.internalLinks.map((l) => ({
          ...l,
          type: "internal" as const,
        })),
        ...seoResult.externalLinks.map((l) => ({
          ...l,
          type: "external" as const,
        })),
      ],
      structuredData: [...seoResult.structuredData],

      // Crawl metadata
      crawlDepth: entry.depth,
      parentUrl: entry.parentUrl ?? null,
      source: entry.source,

      // Warnings & timing
      warnings: [...seoResult.warnings],
      downloadDurationMs: downloadResult.durationMs,
      extractionDurationMs,
    };

    /* ── 6e. Persist ── */
    const result = await this.createPageUseCase.execute(pageInput);

    return result.page;
  }
}
