import { describe, it, expect, vi, beforeEach } from "vitest";
import { RobotsDownloader } from "@/crawler/robots/downloader";
import { HttpClient } from "@/shared/http/http-client";
import { HttpResponseError } from "@/shared/http/errors";

/* ──────────────── Helpers ──────────────── */

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

/**
 * Create a minimal mock of the HttpClient class.
 *
 * Only the `get` method needs to be mocked for the downloader tests.
 */
function createMockHttpClient() {
  return { get: vi.fn() };
}

/* ──────────────── Suite ──────────────── */

describe("RobotsDownloader", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let httpClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    logger = createMockLogger();
    httpClient = createMockHttpClient();
  });

  /* ── Success ── */

  describe("success", () => {
    it("should return the raw robots.txt text on a successful download", async () => {
      const raw = "User-agent: *\nDisallow: /private";
      const headers = new Headers({ "content-type": "text/plain" });

      httpClient.get.mockResolvedValue({
        status: 200,
        headers,
        data: raw,
      });

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      const result = await downloader.download("https://example.com");

      expect(result).toBe(raw);
      expect(httpClient.get).toHaveBeenCalledWith(
        "https://example.com/robots.txt",
      );
    });

    it("should log the download lifecycle on success", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: "some content",
      });

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      await downloader.download("https://example.com");

      expect(logger.info).toHaveBeenCalledWith(
        "robots.txt download started",
        expect.objectContaining({ url: "https://example.com/robots.txt" }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "robots.txt download succeeded",
        expect.objectContaining({
          url: "https://example.com/robots.txt",
          status: 200,
        }),
      );
    });
  });

  /* ── 404 ── */

  describe("404 handling", () => {
    it("should return empty string when robots.txt returns 404", async () => {
      const error = new HttpResponseError(404, "Not Found");
      httpClient.get.mockRejectedValue(error);

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      const result = await downloader.download("https://example.com");

      expect(result).toBe("");
      expect(logger.info).toHaveBeenCalledWith(
        "robots.txt not found (404) — continuing with defaults",
        expect.anything(),
      );
    });
  });

  /* ── Other errors ── */

  describe("error handling", () => {
    it("should return empty string on other HTTP errors", async () => {
      const error = new HttpResponseError(500, "Internal Server Error");
      httpClient.get.mockRejectedValue(error);

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      const result = await downloader.download("https://example.com");

      expect(result).toBe("");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return empty string on network errors", async () => {
      const error = new TypeError("fetch failed");
      httpClient.get.mockRejectedValue(error);

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      const result = await downloader.download("https://example.com");

      expect(result).toBe("");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should include the error message in the warning log", async () => {
      httpClient.get.mockRejectedValue(new Error("Something went wrong"));

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      await downloader.download("https://example.com");

      expect(logger.warn).toHaveBeenCalledWith(
        "robots.txt download failed — continuing with defaults",
        expect.objectContaining({ error: "Something went wrong" }),
      );
    });
  });

  /* ── URL construction ── */

  describe("URL construction", () => {
    it("should append /robots.txt to the base URL", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: "",
      });

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      await downloader.download("https://example.com");

      expect(httpClient.get).toHaveBeenCalledWith(
        "https://example.com/robots.txt",
      );
    });

    it("should handle URLs with trailing slashes", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: "",
      });

      const downloader = new RobotsDownloader(logger, httpClient as unknown as HttpClient);
      await downloader.download("https://example.com/");

      expect(httpClient.get).toHaveBeenCalledWith(
        "https://example.com/robots.txt",
      );
    });
  });
});
