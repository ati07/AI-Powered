import { describe, it, expect, vi, beforeEach } from "vitest";
import { RobotsService } from "@/crawler/robots/service";
import { HttpClient } from "@/shared/http/http-client";

/* ──────────────── Helpers ──────────────── */

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createMockHttpClient() {
  return { get: vi.fn() };
}

/* ──────────────── Suite ──────────────── */

describe("RobotsService", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let httpClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    logger = createMockLogger();
    httpClient = createMockHttpClient();
  });

  /* ── Success ── */

  describe("fetchAndParse", () => {
    it("should download, parse and return structured results", async () => {
      const raw = [
        "User-agent: *",
        "Disallow: /private",
        "",
        "Sitemap: https://example.com/sitemap.xml",
      ].join("\n");

      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: raw,
      });

      const service = new RobotsService(logger, httpClient as unknown as HttpClient);
      const result = await service.fetchAndParse("https://example.com");

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.userAgents).toEqual(["*"]);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
      expect(result.sitemapUrls).toEqual([
        "https://example.com/sitemap.xml",
      ]);
    });

    it("should return empty result when download returns empty string", async () => {
      httpClient.get.mockResolvedValue({
        status: 404,
        headers: new Headers(),
        data: "",
      });

      // The downloader catches 404 and returns ""
      // So we need httpClient.get to throw HttpResponseError for 404
      // Actually, let me think about this...
      // The downloader catches errors from httpClient.get.
      // For 404, httpClient.get throws HttpResponseError (since 404 is not ok).
      // The downloader catches it and returns "".
      // The service sees "" and returns empty result.
      const { HttpResponseError } = await import("@/shared/http/errors");
      httpClient.get.mockRejectedValue(
        new HttpResponseError(404, "Not Found"),
      );

      const service = new RobotsService(logger, httpClient as unknown as HttpClient);
      const result = await service.fetchAndParse("https://example.com");

      expect(result.groups).toEqual([]);
      expect(result.sitemapUrls).toEqual([]);
    });

    it("should return empty result when download fails", async () => {
      httpClient.get.mockRejectedValue(new Error("Network error"));

      const service = new RobotsService(logger, httpClient as unknown as HttpClient);
      const result = await service.fetchAndParse("https://example.com");

      expect(result.groups).toEqual([]);
      expect(result.sitemapUrls).toEqual([]);
    });

    it("should log the parse completion", async () => {
      const raw = "User-agent: *\nDisallow:";
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: raw,
      });

      const service = new RobotsService(logger, httpClient as unknown as HttpClient);
      await service.fetchAndParse("https://example.com");

      expect(logger.info).toHaveBeenCalledWith(
        "robots.txt parse started",
        expect.objectContaining({ bytes: raw.length }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "robots.txt parse completed",
        expect.objectContaining({ groups: 1, sitemapUrls: 0 }),
      );
    });
  });
});
