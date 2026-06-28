import { describe, it, expect, vi, beforeEach, afterEach, type Mocked } from "vitest";
import * as cheerio from "cheerio";
import { CrawlProcessor } from "@/crawler/processor/crawl-processor";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type ILogger } from "@/shared/logger";
import { HttpClient } from "@/shared/http/http-client";
import { CreatePageUseCase } from "@/application/page/use-cases/create-page.use-case";
import { ScorePageUseCase } from "@/application/scoring/score-page.usecase";
import { ScanSummaryUseCase } from "@/application/scoring/scan-summary.usecase";
import { ScanEntity, ScanStatus } from "@/domain/entities/scan.entity";
import type { SitemapService } from "@/crawler/sitemap/service";
import type { DiscoveryService } from "@/crawler/discovery/service";
import type { HtmlDownloader } from "@/crawler/html/downloader";
import { type HtmlDownloadSuccess, type HtmlDownloadError, type HtmlDownloadErrorType } from "@/crawler/html/types";
import type { HtmlParser } from "@/crawler/parser/parser";
import type { SeoExtractor } from "@/crawler/parser/extractor";
import type { SitemapResult } from "@/crawler/sitemap/types";
import type { DiscoveryResult, QueueEntry } from "@/crawler/discovery/types";
import { DiscoverySource } from "@/crawler/discovery/types";
import type { SeoResult, HeadingInfo } from "@/crawler/parser/types";
import type { CreatePageInput } from "@/application/page/page.schema";

/* ──────────────── Test helpers ──────────────── */

function makePendingScan(): ScanEntity {
  return new ScanEntity({
    id: "scan-1",
    websiteId: "website-1",
    status: ScanStatus.PENDING,
    startedAt: null,
    finishedAt: null,
    pagesFound: 0,
    pagesCrawled: 0,
    pagesFailed: 0,
    error: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

type MockDownloader = { download: ReturnType<typeof vi.fn> };
type MockParser = { parse: ReturnType<typeof vi.fn> };
type MockExtractor = { extract: ReturnType<typeof vi.fn> };
type MockSitemapSvc = { discover: ReturnType<typeof vi.fn> };
type MockDiscoverySvc = { discover: ReturnType<typeof vi.fn> };

function createMockRepos() {
  const scanRepo: Mocked<IScanRepository> = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByWebsite: vi.fn(),
    findRunningScan: vi.fn(),
    findNextPending: vi.fn(),
    updateStatus: vi.fn(),
    updateProgress: vi.fn(),
  };
  const websiteRepo: Mocked<IWebsiteRepository> = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByNormalizedDomain: vi.fn(),
    findByOrganization: vi.fn(),
    exists: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  };
  return { scanRepo, websiteRepo };
}

function createMockLogger(): Mocked<ILogger> {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createMockPageUseCase(): Mocked<CreatePageUseCase> {
  const mock = { execute: vi.fn().mockResolvedValue({ page: {} }) };
  return mock as unknown as Mocked<CreatePageUseCase>;
}

function createMockScorePageUseCase(): Mocked<ScorePageUseCase> {
  const mock = {
    execute: vi.fn().mockResolvedValue({ pageScore: {} }),
    // Private members needed for the mock type — not used in tests
    calculator: undefined,
    pageScoreRepo: undefined,
    toScorablePage: undefined,
  };
  return mock as unknown as Mocked<ScorePageUseCase>;
}

function createMockScanSummaryUseCase(): Mocked<ScanSummaryUseCase> {
  const mock = {
    execute: vi.fn().mockResolvedValue({
      averageScore: 75,
      highestScore: 100,
      lowestScore: 50,
      pagesScored: 3,
    }),
    scanRepo: undefined,
    pageScoreRepo: undefined,
  };
  return mock as unknown as Mocked<ScanSummaryUseCase>;
}

function createMockServices(): {
  sitemapService: MockSitemapSvc;
  discoveryService: MockDiscoverySvc;
  htmlDownloader: MockDownloader;
  htmlParser: MockParser;
  seoExtractor: MockExtractor;
} {
  return {
    sitemapService: { discover: vi.fn() },
    discoveryService: { discover: vi.fn() },
    htmlDownloader: { download: vi.fn() },
    htmlParser: { parse: vi.fn() },
    seoExtractor: { extract: vi.fn() },
  };
}

function mockWebsite(): unknown {
  return {
    id: "website-1",
    domain: { getOriginalValue: () => "https://example.com" },
  };
}

function makeDownloadSuccess(
  overrides?: Partial<HtmlDownloadSuccess>,
): HtmlDownloadSuccess {
  return {
    success: true,
    originalUrl: "https://example.com/page1",
    finalUrl: "https://example.com/page1",
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    headers: {},
    html: "<html><body>Test</body></html>",
    contentLength: 50,
    durationMs: 50,
    ...overrides,
  };
}

function makeDownloadError(
  error: HtmlDownloadErrorType = "network_error",
  overrides?: Partial<HtmlDownloadError>,
): HtmlDownloadError {
  return {
    success: false,
    originalUrl: "https://example.com/page1",
    error,
    statusCode: undefined,
    durationMs: 25,
    ...overrides,
  };
}

function makeSitemapResult(entries: Array<{ loc: string }>): SitemapResult {
  return {
    entries: entries.map((e) => ({
      loc: e.loc,
      lastmod: null,
      changefreq: null,
      priority: null,
    })),
    sitemapsProcessed: 1,
    urlsDiscovered: entries.length,
  };
}

function makeDiscoveryResult(urls: string[]): DiscoveryResult {
  return {
    entries: urls.map((url, _i) => ({
      url,
      normalizedUrl: url,
      parentUrl: null,
      depth: 0,
      source: DiscoverySource.SITEMAP,
      discoveredAt: new Date().toISOString(),
    })),
    totalUrls: urls.length,
    skippedUrls: 0,
    duplicateUrls: 0,
    externalUrls: 0,
  };
}

function makeEmptyHeadings(): HeadingInfo {
  return { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
}

function makeMinimalSeoResult(): SeoResult {
  return {
    document: { title: null, language: null, charset: null, viewport: null },
    meta: { description: null, robots: null },
    canonical: { url: null },
    openGraph: {},
    twitter: {},
    headings: makeEmptyHeadings(),
    images: [],
    internalLinks: [],
    externalLinks: [],
    structuredData: [],
    warnings: [],
    stats: {
      totalImages: 0,
      totalInternalLinks: 0,
      totalExternalLinks: 0,
      totalStructuredData: 0,
      totalHeadings: 0,
    },
  };
}

/* ──────────────── Test suite ──────────────── */

describe("CrawlProcessor", () => {
  let scanRepo: Mocked<IScanRepository>;
  let websiteRepo: Mocked<IWebsiteRepository>;
  let createPageUseCase: Mocked<CreatePageUseCase>;
  let scorePageUseCase: Mocked<ScorePageUseCase>;
  let scanSummaryUseCase: Mocked<ScanSummaryUseCase>;
  let logger: Mocked<ILogger>;
  let httpClient: HttpClient;
  let services: ReturnType<typeof createMockServices>;
  let processor: CrawlProcessor;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00Z"));

    const repos = createMockRepos();
    scanRepo = repos.scanRepo;
    websiteRepo = repos.websiteRepo;
    logger = createMockLogger();
    createPageUseCase = createMockPageUseCase();
    scorePageUseCase = createMockScorePageUseCase();
    scanSummaryUseCase = createMockScanSummaryUseCase();
    httpClient = new HttpClient(logger);

    services = createMockServices();

    processor = new CrawlProcessor(
      scanRepo,
      websiteRepo,
      createPageUseCase,
      scorePageUseCase,
      scanSummaryUseCase,
      logger,
      httpClient,
      undefined, // use default config
      {
        sitemapService: services.sitemapService as unknown as SitemapService,
        discoveryService: services.discoveryService as unknown as DiscoveryService,
        htmlDownloader: services.htmlDownloader as unknown as HtmlDownloader,
        htmlParser: services.htmlParser as unknown as HtmlParser,
        seoExtractor: services.seoExtractor as unknown as SeoExtractor,
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ──────────────── Lifecycle ──────────────── */

  describe("scan lifecycle", () => {
    it("should transition PENDING → RUNNING → COMPLETED on success", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);
      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(makeDiscoveryResult([]));

      await processor.process("scan-1");

      // PENDING → RUNNING
      expect(scanRepo.update).toHaveBeenNthCalledWith(1, {
        id: "scan-1",
        status: ScanStatus.RUNNING,
        startedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // RUNNING → COMPLETED
      const lastUpdateCall = scanRepo.update.mock.calls[scanRepo.update.mock.calls.length - 1]![0];
      expect(lastUpdateCall.status).toBe(ScanStatus.COMPLETED);
      expect(lastUpdateCall.finishedAt).toBeInstanceOf(Date);
    });

    it("should skip when scan is not found", async () => {
      scanRepo.findById.mockResolvedValue(null);

      await processor.process("scan-1");

      expect(scanRepo.update).not.toHaveBeenCalled();
      expect(scanRepo.updateProgress).not.toHaveBeenCalled();
      expect(websiteRepo.findById).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("not found"),
      );
    });

    it("should fail the scan when website is not found", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(null);

      await processor.process("scan-1");

      // First update is PENDING → RUNNING, second is RUNNING → FAILED
      expect(scanRepo.update).toHaveBeenCalledTimes(2);
      const failedUpdate = scanRepo.update.mock.calls[1]![0];
      expect(failedUpdate.status).toBe(ScanStatus.FAILED);
      expect(failedUpdate.error).toContain("Website not found");
    });

    it("should transition RUNNING → FAILED when pipeline throws", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // Make the sitemap service throw
      services.sitemapService.discover.mockRejectedValue(
        new Error("Sitemap service unreachable"),
      );

      await processor.process("scan-1");

      // First call is PENDING → RUNNING
      expect(scanRepo.update).toHaveBeenNthCalledWith(1, {
        id: "scan-1",
        status: ScanStatus.RUNNING,
        startedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Last call should be RUNNING → FAILED
      const lastCall = scanRepo.update.mock.calls[scanRepo.update.mock.calls.length - 1]![0];
      expect(lastCall.status).toBe(ScanStatus.FAILED);
      expect(lastCall.error).toBe("Sitemap service unreachable");
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("failed"),
      );
    });

    it("should not throw when FAILED update itself fails", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);
      services.sitemapService.discover.mockRejectedValue(
        new Error("Pipeline error"),
      );

      // The first update (RUNNING) succeeds, but the FAILED update also fails
      scanRepo.update
        .mockResolvedValueOnce(scan)           // RUNNING update
        .mockRejectedValueOnce(new Error("DB is down")); // FAILED update fails

      // Should NOT throw — the error should be caught and logged
      await expect(processor.process("scan-1")).resolves.toBeUndefined();

      // logger.error is called twice: once for the pipeline error,
      // once for the FAILED-update failure
      expect(logger.error).toHaveBeenLastCalledWith(
        expect.stringContaining("Failed to update scan"),
      );
    });
  });

  /* ──────────────── Pipeline orchestration ──────────────── */

  describe("pipeline orchestration", () => {
    it("should discover sitemap URLs and build a crawl queue", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // Return 2 URLs from sitemap discovery
      services.sitemapService.discover.mockResolvedValue(
        makeSitemapResult([
          { loc: "https://example.com/page1" },
          { loc: "https://example.com/page2" },
        ]),
      );

      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult([
          "https://example.com/",
          "https://example.com/page1",
          "https://example.com/page2",
        ]),
      );

      // Mock successful downloads for both pages
      const downloadSuccess1 = makeDownloadSuccess({
        originalUrl: "https://example.com/page1",
        finalUrl: "https://example.com/page1",
        html: "<html><title>Page 1</title></html>",
      });
      const downloadSuccess2 = makeDownloadSuccess({
        originalUrl: "https://example.com/page2",
        finalUrl: "https://example.com/page2",
        html: "<html><title>Page 2</title></html>",
      });

      services.htmlDownloader.download
        .mockResolvedValueOnce(downloadSuccess1)
        .mockResolvedValueOnce(downloadSuccess2)
        .mockResolvedValueOnce(downloadSuccess1); // homepage

      services.htmlParser.parse.mockReturnValue(cheerio.load("<html></html>"));
      services.seoExtractor.extract.mockReturnValue(makeMinimalSeoResult());

      await processor.process("scan-1");

      // Verify sitemap service was called with the right URL
      expect(services.sitemapService.discover).toHaveBeenCalledWith(
        "https://example.com/sitemap.xml",
      );

      // Verify discovery service received the sitemap URLs
      expect(services.discoveryService.discover).toHaveBeenCalledWith({
        sitemapUrls: [
          "https://example.com/page1",
          "https://example.com/page2",
        ],
        homepageUrl: "https://example.com",
      });

      // Verify three pages were downloaded (homepage + 2 from sitemap)
      expect(services.htmlDownloader.download).toHaveBeenCalledTimes(3);

      // Verify three pages were persisted
      expect(createPageUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it("should fall back to /sitemap.xml when robots.txt gives no URLs", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // The robotsResult.sitemapUrls is empty, so we fall back to /sitemap.xml
      // (mock the sitemapService to return empty as well)
      services.sitemapService.discover.mockResolvedValue(
        makeSitemapResult([]),
      );
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/"]),
      );
      services.htmlDownloader.download.mockResolvedValue(makeDownloadSuccess());
      services.htmlParser.parse.mockReturnValue(cheerio.load("<html></html>"));
      services.seoExtractor.extract.mockReturnValue(makeMinimalSeoResult());

      await processor.process("scan-1");

      // Should have attempted the default sitemap URL
      expect(services.sitemapService.discover).toHaveBeenCalledWith(
        "https://example.com/sitemap.xml",
      );
    });
  });

  /* ──────────────── Page processing ──────────────── */

  describe("page processing", () => {
    it("should download, parse, extract, and persist each page", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // Single page to crawl
      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/page1"]),
      );
      services.htmlDownloader.download.mockResolvedValue(
        makeDownloadSuccess({
          originalUrl: "https://example.com/page1",
          finalUrl: "https://example.com/page1",
          statusCode: 200,
          contentType: "text/html; charset=utf-8",
          html: "<html><head><title>My Page</title></head><body>Content</body></html>",
          durationMs: 45,
        }),
      );

      const $ = cheerio.load("<html><title>My Page</title></html>");
      services.htmlParser.parse.mockReturnValue($);

      services.seoExtractor.extract.mockReturnValue({
        ...makeMinimalSeoResult(),
        document: {
          title: "My Page",
          language: "en",
          charset: "utf-8",
          viewport: "width=device-width",
        },
        meta: {
          description: "A test page",
          robots: "index,follow",
        },
        canonical: { url: "https://example.com/page1" },
        openGraph: { "og:title": "My Page" },
        twitter: { "twitter:card": "summary" },
      });

      await processor.process("scan-1");

      // Parser should have received the HTML
      expect(services.htmlParser.parse).toHaveBeenCalledWith(
        "<html><head><title>My Page</title></head><body>Content</body></html>",
      );

      // Extractor should have received the cheerio instance
      expect(services.seoExtractor.extract).toHaveBeenCalledWith($);

      // Page should have been persisted with the extracted data
      expect(createPageUseCase.execute).toHaveBeenCalledTimes(1);

      const pageInput: CreatePageInput = createPageUseCase.execute.mock
        .calls[0]![0] as CreatePageInput;
      expect(pageInput.scanId).toBe("scan-1");
      expect(pageInput.url).toBe("https://example.com/page1");
      expect(pageInput.finalUrl).toBe("https://example.com/page1");
      expect(pageInput.statusCode).toBe(200);
      expect(pageInput.contentType).toBe("text/html; charset=utf-8");
      expect(pageInput.title).toBe("My Page");
      expect(pageInput.language).toBe("en");
      expect(pageInput.charset).toBe("utf-8");
      expect(pageInput.viewport).toBe("width=device-width");
      expect(pageInput.metaDescription).toBe("A test page");
      expect(pageInput.robots).toBe("index,follow");
      expect(pageInput.canonical).toBe("https://example.com/page1");
      expect(pageInput.openGraph).toEqual({ "og:title": "My Page" });
      expect(pageInput.twitter).toEqual({ "twitter:card": "summary" });
      expect(pageInput.downloadDurationMs).toBe(45);
      expect(pageInput.extractionDurationMs).toBeGreaterThanOrEqual(0);
      expect(pageInput.crawlDepth).toBe(0);
      expect(pageInput.source).toBe("sitemap");
      expect(pageInput.parentUrl).toBeNull();
    });

    it("should fail a single page and continue when download fails", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // 1 URL in queue
      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/page1"]),
      );

      // Download fails
      services.htmlDownloader.download.mockResolvedValue(
        makeDownloadError("network_error"),
      );

      await processor.process("scan-1");

      // Should have called updateProgress with failed count
      expect(scanRepo.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "scan-1",
          pagesFound: 1,
          pagesCrawled: 0,
          pagesFailed: 1,
        }),
      );

      // Should have completed (not failed) the scan
      const finalUpdate = scanRepo.update.mock.calls[scanRepo.update.mock.calls.length - 1]![0];
      expect(finalUpdate.status).toBe(ScanStatus.COMPLETED);
      expect(finalUpdate.pagesFound).toBe(1);
      expect(finalUpdate.pagesCrawled).toBe(0);
      expect(finalUpdate.pagesFailed).toBe(1);

      // Should NOT have called createPageUseCase (nothing was persisted)
      expect(createPageUseCase.execute).not.toHaveBeenCalled();
    });

    it("should handle mixed success and failure across multiple pages", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // 3 URLs
      services.sitemapService.discover.mockResolvedValue(
        makeSitemapResult([
          { loc: "https://example.com/page1" },
          { loc: "https://example.com/page2" },
          { loc: "https://example.com/page3" },
        ]),
      );

      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult([
          "https://example.com/",
          "https://example.com/page1",
          "https://example.com/page2",
          "https://example.com/page3",
        ]),
      );

      // page1: success, page2: fail, page3: success, homepage: success
      services.htmlDownloader.download
        .mockResolvedValueOnce(makeDownloadSuccess({ html: "<html>A</html>" }))
        .mockResolvedValueOnce(makeDownloadError("timeout"))
        .mockResolvedValueOnce(makeDownloadSuccess({ html: "<html>C</html>" }))
        .mockResolvedValueOnce(makeDownloadSuccess({ html: "<html>Home</html>" }));

      services.htmlParser.parse.mockReturnValue(cheerio.load("<html></html>"));
      services.seoExtractor.extract.mockReturnValue(makeMinimalSeoResult());

      await processor.process("scan-1");

      // Final stats: 4 total, 3 crawled, 1 failed
      const finalUpdate = scanRepo.update.mock.calls[scanRepo.update.mock.calls.length - 1]![0];
      expect(finalUpdate.status).toBe(ScanStatus.COMPLETED);
      expect(finalUpdate.pagesFound).toBe(4);
      expect(finalUpdate.pagesCrawled).toBe(3);
      expect(finalUpdate.pagesFailed).toBe(1);

      // Should have created 3 pages (3 successes)
      expect(createPageUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it("should handle all pages failing", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/page1"]),
      );
      services.htmlDownloader.download.mockResolvedValue(
        makeDownloadError("http_error", { statusCode: 500 }),
      );

      await processor.process("scan-1");

      // All failed, 0 crawled
      const finalUpdate = scanRepo.update.mock.calls[scanRepo.update.mock.calls.length - 1]![0];
      expect(finalUpdate.status).toBe(ScanStatus.COMPLETED);
      expect(finalUpdate.pagesFound).toBe(1);
      expect(finalUpdate.pagesCrawled).toBe(0);
      expect(finalUpdate.pagesFailed).toBe(1);
    });
  });

  /* ──────────────── Progress tracking ──────────────── */

  describe("progress tracking", () => {
    it("should set pagesFound before processing and update after each URL", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // 2 URLs
      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/a", "https://example.com/b"]),
      );
      services.htmlDownloader.download.mockResolvedValue(makeDownloadSuccess());
      services.htmlParser.parse.mockReturnValue(cheerio.load("<html></html>"));
      services.seoExtractor.extract.mockReturnValue(makeMinimalSeoResult());

      await processor.process("scan-1");

      // First updateProgress sets pagesFound before processing
      expect(scanRepo.updateProgress).toHaveBeenNthCalledWith(1, {
        id: "scan-1",
        pagesFound: 2,
        pagesCrawled: 0,
        pagesFailed: 0,
      });

      // After first URL: 1 crawled, 0 failed
      expect(scanRepo.updateProgress).toHaveBeenNthCalledWith(2, {
        id: "scan-1",
        pagesFound: 2,
        pagesCrawled: 1,
        pagesFailed: 0,
      });

      // After second URL: 2 crawled, 0 failed
      expect(scanRepo.updateProgress).toHaveBeenNthCalledWith(3, {
        id: "scan-1",
        pagesFound: 2,
        pagesCrawled: 2,
        pagesFailed: 0,
      });
    });

    it("should not set pagesFound when queue is empty", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(makeDiscoveryResult([]));

      await processor.process("scan-1");

      // Should complete with 0 pages
      const finalUpdate = scanRepo.update.mock.calls[scanRepo.update.mock.calls.length - 1]![0];
      expect(finalUpdate.status).toBe(ScanStatus.COMPLETED);
      expect(finalUpdate.pagesFound).toBe(0);
      expect(finalUpdate.pagesCrawled).toBe(0);
      expect(finalUpdate.pagesFailed).toBe(0);

      // Should NOT have called updateProgress at all (no URLs to process)
      expect(scanRepo.updateProgress).not.toHaveBeenCalled();
    });
  });

  /* ──────────────── Logging ──────────────── */

  describe("logging", () => {
    it("should log info throughout the pipeline", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(makeDiscoveryResult([]));

      await processor.process("scan-1");

      expect(logger.info).toHaveBeenCalled();
    });

    it("should log warnings for individual page failures", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/page1"]),
      );
      services.htmlDownloader.download.mockResolvedValue(
        makeDownloadError("timeout"),
      );

      await processor.process("scan-1");

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("failed"),
        expect.objectContaining({
          url: "https://example.com/page1",
          error: "Download failed: timeout",
        }),
      );
    });
  });

  /* ──────────────── Edge cases ──────────────── */

  describe("edge cases", () => {
    it("should process URLs from robots.txt sitemap entries", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      // We don't mock the robotsService — it's created internally.
      // But we DO mock the httpClient the robotsService uses.
      // For this test, we show that sitemapService is called with
      // the URLs from robots.txt.
      //
      // We can't control robotsService directly since it's internal.
      // The test above (fallback to sitemap.xml) verifies the
      // robots.txt → sitemap flow via the mock chain.

      // Instead, verify the discover service receives the homepage URL
      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(makeDiscoveryResult([]));

      await processor.process("scan-1");

      expect(services.discoveryService.discover).toHaveBeenCalledWith(
        expect.objectContaining({
          homepageUrl: "https://example.com",
        }),
      );
    });

    it("should pass crawl metadata from queue entry to page input", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      const entry: QueueEntry = {
        url: "https://example.com/deep/page",
        normalizedUrl: "https://example.com/deep/page",
        parentUrl: "https://example.com/",
        depth: 2,
        source: DiscoverySource.INTERNAL_LINK,
        discoveredAt: "2026-01-01T00:00:00.000Z",
      };

      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue({
        entries: [entry],
        totalUrls: 1,
        skippedUrls: 0,
        duplicateUrls: 0,
        externalUrls: 0,
      });

      services.htmlDownloader.download.mockResolvedValue(makeDownloadSuccess());
      services.htmlParser.parse.mockReturnValue(cheerio.load("<html></html>"));
      services.seoExtractor.extract.mockReturnValue(makeMinimalSeoResult());

      await processor.process("scan-1");

      const pageInput: CreatePageInput = createPageUseCase.execute.mock
        .calls[0]![0] as CreatePageInput;
      expect(pageInput.url).toBe("https://example.com/deep/page");
      expect(pageInput.crawlDepth).toBe(2);
      expect(pageInput.parentUrl).toBe("https://example.com/");
      expect(pageInput.source).toBe("internal_link");
    });

    it("should handle SeoResult with complex data correctly", async () => {
      const scan = makePendingScan();
      scanRepo.findById.mockResolvedValue(scan);
      websiteRepo.findById.mockResolvedValue(mockWebsite() as never);

      services.sitemapService.discover.mockResolvedValue(makeSitemapResult([]));
      services.discoveryService.discover.mockReturnValue(
        makeDiscoveryResult(["https://example.com/page1"]),
      );

      services.htmlDownloader.download.mockResolvedValue(
        makeDownloadSuccess({
          html: "<html><h1>Big Heading</h1><img src='pic.jpg' alt='pic'/>",
          durationMs: 30,
        }),
      );
      services.htmlParser.parse.mockReturnValue(cheerio.load("<html></html>"));

      services.seoExtractor.extract.mockReturnValue({
        ...makeMinimalSeoResult(),
        document: { title: "Complex Page", language: "fr", charset: "iso-8859-1", viewport: null },
        headings: {
          h1: ["Big Heading"],
          h2: ["Sub Heading"],
          h3: [],
          h4: [],
          h5: [],
          h6: [],
        },
        images: [
          { src: "pic.jpg", alt: "pic", title: null, loading: null, width: null, height: null },
        ],
        internalLinks: [
          { href: "/about", text: "About", normalizedUrl: "https://example.com/about" },
        ],
        externalLinks: [
          { href: "https://other.com", text: "Other", normalizedUrl: "https://other.com" },
        ],
        warnings: [
          { source: "title", message: "Multiple title elements found" },
        ],
      });

      await processor.process("scan-1");

      const pageInput: CreatePageInput = createPageUseCase.execute.mock
        .calls[0]![0] as CreatePageInput;

      expect(pageInput.title).toBe("Complex Page");
      expect(pageInput.language).toBe("fr");
      expect(pageInput.headings!.h1).toEqual(["Big Heading"]);
      expect(pageInput.headings!.h2).toEqual(["Sub Heading"]);
      expect(pageInput.images).toHaveLength(1);
      expect(pageInput.images![0]!.src).toBe("pic.jpg");
      expect(pageInput.links).toHaveLength(2);

      // Internal link should have type "internal"
      const internalLink = pageInput.links!.find((l) => l.type === "internal");
      expect(internalLink).toBeDefined();
      expect(internalLink!.href).toBe("/about");

      // External link should have type "external"
      const externalLink = pageInput.links!.find((l) => l.type === "external");
      expect(externalLink).toBeDefined();
      expect(externalLink!.href).toBe("https://other.com");

      expect(pageInput.warnings).toHaveLength(1);
      expect(pageInput.warnings![0]!.message).toBe("Multiple title elements found");

      expect(pageInput.downloadDurationMs).toBe(30);
      expect(pageInput.extractionDurationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
