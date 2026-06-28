import { describe, it, expect, vi, beforeEach } from "vitest";
import { SitemapDownloader } from "@/crawler/sitemap/downloader";
import { HttpClient } from "@/shared/http/http-client";
import { HttpResponseError } from "@/shared/http/errors";
import { type CrawlerContext } from "@/crawler/core/crawler-context";

/* ──────────────── Helpers ──────────────── */

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createMockHttpClient() {
  return { get: vi.fn() };
}

function createContext(
  logger: ReturnType<typeof createMockLogger>,
  httpClient: ReturnType<typeof createMockHttpClient>,
): CrawlerContext {
  return {
    logger,
    httpClient: httpClient as unknown as HttpClient,
    config: { maxDepth: 3, maxSitemaps: 50, maxUrls: 100_000 },
    baseUrl: "https://example.com",
  };
}

/* ──────────────── Suite ──────────────── */

describe("SitemapDownloader", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let httpClient: ReturnType<typeof createMockHttpClient>;
  let ctx: CrawlerContext;

  beforeEach(() => {
    logger = createMockLogger();
    httpClient = createMockHttpClient();
    ctx = createContext(logger, httpClient);
  });

  /* ── Success ── */

  describe("success", () => {
    it("should return raw XML on a successful download", async () => {
      const xml = `<?xml version="1.0"?><urlset xmlns="..."><url><loc>https://example.com/</loc></url></urlset>`;
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: xml,
      });

      const downloader = new SitemapDownloader(ctx);
      const result = await downloader.download("https://example.com/sitemap.xml");

      expect(result).toBe(xml);
      expect(httpClient.get).toHaveBeenCalledWith(
        "https://example.com/sitemap.xml",
      );
    });

    it("should log the download lifecycle on success", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: "<xml/>",
      });

      const downloader = new SitemapDownloader(ctx);
      await downloader.download("https://example.com/sitemap.xml");

      expect(logger.info).toHaveBeenCalledWith(
        "sitemap download started",
        expect.objectContaining({ url: "https://example.com/sitemap.xml" }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "sitemap download succeeded",
        expect.objectContaining({
          url: "https://example.com/sitemap.xml",
          status: 200,
        }),
      );
    });
  });

  /* ── HTTP errors ── */

  describe("HTTP errors", () => {
    it("should return empty string on 404", async () => {
      httpClient.get.mockRejectedValue(new HttpResponseError(404, "Not Found"));

      const downloader = new SitemapDownloader(ctx);
      const result = await downloader.download("https://example.com/sitemap.xml");

      expect(result).toBe("");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return empty string on 500", async () => {
      httpClient.get.mockRejectedValue(
        new HttpResponseError(500, "Internal Server Error"),
      );

      const downloader = new SitemapDownloader(ctx);
      const result = await downloader.download("https://example.com/sitemap.xml");

      expect(result).toBe("");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should include the HTTP status in the warning log", async () => {
      httpClient.get.mockRejectedValue(new HttpResponseError(404, "Not Found"));

      const downloader = new SitemapDownloader(ctx);
      await downloader.download("https://example.com/sitemap.xml");

      expect(logger.warn).toHaveBeenCalledWith(
        "sitemap download failed — continuing with defaults",
        expect.objectContaining({ status: 404 }),
      );
    });
  });

  /* ── Network errors ── */

  describe("network errors", () => {
    it("should return empty string on network errors", async () => {
      httpClient.get.mockRejectedValue(new TypeError("fetch failed"));

      const downloader = new SitemapDownloader(ctx);
      const result = await downloader.download("https://example.com/sitemap.xml");

      expect(result).toBe("");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should include the error message in the warning log", async () => {
      httpClient.get.mockRejectedValue(new Error("Something went wrong"));

      const downloader = new SitemapDownloader(ctx);
      await downloader.download("https://example.com/sitemap.xml");

      expect(logger.warn).toHaveBeenCalledWith(
        "sitemap download failed — continuing with defaults",
        expect.objectContaining({ error: "Something went wrong" }),
      );
    });
  });

  /* ── URL passthrough ── */

  describe("URL passthrough", () => {
    it("should pass the URL as-is to HttpClient", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: "",
      });

      const downloader = new SitemapDownloader(ctx);
      await downloader.download("https://cdn.example.com/sitemaps/main.xml");

      expect(httpClient.get).toHaveBeenCalledWith(
        "https://cdn.example.com/sitemaps/main.xml",
      );
    });
  });
});
