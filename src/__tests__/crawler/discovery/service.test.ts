import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscoveryService } from "@/crawler/discovery/service";
import { DiscoverySource } from "@/crawler/discovery/types";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import { type CrawlConfig } from "@/crawler/core/crawl-config";

/* ──────────────── Helpers ──────────────── */

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createContext(
  logger: ReturnType<typeof createMockLogger>,
  config?: Partial<CrawlConfig>,
): CrawlerContext {
  return {
    logger,
    httpClient: { get: vi.fn() } as unknown as import("@/shared/http/http-client").HttpClient,
    config: {
      maxDepth: config?.maxDepth ?? 3,
      maxSitemaps: config?.maxSitemaps ?? 50,
      maxUrls: config?.maxUrls ?? 100_000,
    },
    baseUrl: "https://example.com",
  };
}

function createService(
  logger: ReturnType<typeof createMockLogger>,
  config?: Partial<CrawlConfig>,
): DiscoveryService {
  const ctx = createContext(logger, config);
  return new DiscoveryService(ctx);
}

/* ──────────────── Suite ──────────────── */

describe("DiscoveryService", () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
  });

  /* ── Basic discovery ── */

  describe("basic discovery", () => {
    it("should add the homepage as the first entry", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [],
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.url).toBe("https://example.com");
      expect(result.entries[0]!.source).toBe(DiscoverySource.HOMEPAGE);
      expect(result.entries[0]!.depth).toBe(0);
      expect(result.entries[0]!.parentUrl).toBeNull();
    });

    it("should add sitemap URLs after the homepage", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [
          "https://example.com/about",
          "https://example.com/contact",
        ],
      });

      expect(result.entries).toHaveLength(3);
      // Homepage is first
      expect(result.entries[0]!.source).toBe(DiscoverySource.HOMEPAGE);
      // Sitemap URLs follow
      expect(result.entries[1]!.source).toBe(DiscoverySource.SITEMAP);
      expect(result.entries[1]!.url).toBe("https://example.com/about");
      expect(result.entries[2]!.source).toBe(DiscoverySource.SITEMAP);
      expect(result.entries[2]!.url).toBe("https://example.com/contact");
      // All have depth 0
      expect(result.entries.every((e) => e.depth === 0)).toBe(true);
    });
  });

  /* ── External domain rejection ── */

  describe("external domain rejection", () => {
    it("should reject URLs from external domains", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["https://other.com/page"],
      });

      expect(result.entries).toHaveLength(1); // only homepage
      expect(result.externalUrls).toBe(1);
    });

    it("should treat www.example.com as same domain as example.com", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["https://www.example.com/page"],
      });

      expect(result.entries).toHaveLength(2);
      expect(result.externalUrls).toBe(0);
    });

    it("should reject multiple external URLs and count them correctly", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [
          "https://example.com/valid",
          "https://evil.com/phish",
          "https://other.net/malware",
        ],
      });

      expect(result.entries).toHaveLength(2); // homepage + valid
      expect(result.externalUrls).toBe(2);
    });
  });

  /* ── Invalid scheme handling ── */

  describe("invalid scheme handling", () => {
    it("should skip URLs with unsupported schemes", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["ftp://example.com/file", "javascript:alert(1)"],
      });

      expect(result.entries).toHaveLength(1); // only homepage
      expect(result.skippedUrls).toBe(2);
    });
  });

  /* ── Duplicate detection ── */

  describe("duplicate detection", () => {
    it("should deduplicate the homepage if it also appears in sitemap URLs", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["https://example.com/", "https://example.com/about"],
      });

      // Homepage should only appear once
      expect(result.entries).toHaveLength(2);
      expect(result.duplicateUrls).toBe(1);
    });

    it("should deduplicate sitemap URLs that normalize to the same value", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [
          "https://example.com/page",
          "https://Example.COM/page", // same normalized (hostname lowercased)
          "https://example.com/page?query=1",
        ],
      });

      // /page and /Example.COM/page normalize to the same URL → 1 duplicate
      // /page?query=1 is distinct (different query string)
      expect(result.duplicateUrls).toBe(1);
      expect(result.entries).toHaveLength(3); // homepage + page + page?query=1
    });
  });

  /* ── Counter accuracy ── */

  describe("counter accuracy", () => {
    it("should report correct totals for a mixed set of URLs", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [
          "https://example.com/about", // valid
          "https://example.com/", // duplicate of homepage
          "ftp://example.com/file", // skipped (bad scheme)
          "https://other.com/page", // external
          "https://example.com/contact", // valid
        ],
      });

      expect(result.totalUrls).toBe(6); // 1 homepage + 5 sitemap
      expect(result.entries).toHaveLength(3); // homepage + about + contact
      expect(result.skippedUrls).toBe(1); // ftp
      expect(result.duplicateUrls).toBe(1); // / duplicate of homepage
      expect(result.externalUrls).toBe(1); // other.com
    });

    it("should handle when only the homepage is provided", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [],
      });

      expect(result.totalUrls).toBe(1);
      expect(result.entries).toHaveLength(1);
      expect(result.skippedUrls).toBe(0);
      expect(result.duplicateUrls).toBe(0);
      expect(result.externalUrls).toBe(0);
    });
  });

  /* ── URL normalization ── */

  describe("URL normalization", () => {
    it("should normalize the homepage URL via the shared utility", () => {
      const service = createService(logger);
      const result = service.discover({
        homepageUrl: "https://Example.COM",
        sitemapUrls: [],
      });

      // normalizedUrl should be lowercase hostname
      expect(result.entries[0]!.normalizedUrl).toBe("https://example.com/");
    });
  });

  /* ── Logging ── */

  describe("logging", () => {
    it("should log the discovery lifecycle", () => {
      const service = createService(logger);
      service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: [],
      });

      expect(logger.info).toHaveBeenCalledWith(
        "URL discovery started",
        expect.anything(),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "URL discovery completed",
        expect.anything(),
      );
    });

    it("should log when a URL is added to the queue", () => {
      const service = createService(logger);
      service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["https://example.com/about"],
      });

      expect(logger.info).toHaveBeenCalledWith(
        "URL discovery — URL added to queue",
        expect.objectContaining({ url: "https://example.com/", source: DiscoverySource.HOMEPAGE }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "URL discovery — URL added to queue",
        expect.objectContaining({ url: "https://example.com/about", source: DiscoverySource.SITEMAP }),
      );
    });

    it("should log when an external URL is rejected", () => {
      const service = createService(logger);
      service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["https://other.com/page"],
      });

      expect(logger.info).toHaveBeenCalledWith(
        "URL discovery — external domain rejected",
        expect.anything(),
      );
    });

    it("should log when a duplicate URL is skipped", () => {
      const service = createService(logger);
      service.discover({
        homepageUrl: "https://example.com",
        sitemapUrls: ["https://example.com/"],
      });

      expect(logger.info).toHaveBeenCalledWith(
        "URL discovery — duplicate skipped",
        expect.anything(),
      );
    });

    it("should warn when an invalid URL is encountered", () => {
      const service = createService(logger);
      service.discover({
        homepageUrl: "not-a-url",
        sitemapUrls: [],
      });

      expect(logger.warn).toHaveBeenCalledWith(
        "URL discovery — invalid or unsupported scheme",
        expect.anything(),
      );
    });
  });
});
