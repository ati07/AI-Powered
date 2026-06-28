import { describe, it, expect, vi, beforeEach } from "vitest";
import { HtmlDownloader, isDownloadSuccess, isDownloadError } from "@/crawler/html/downloader";
import { HttpClient } from "@/shared/http/http-client";
import {
  HttpTimeoutError,
  HttpRetryExceededError,
  HttpResponseError,
} from "@/shared/http/errors";
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

const HTML_BODY = "<!DOCTYPE html><html><body><h1>Hello</h1></body></html>";

/* ──────────────── Suite ──────────────── */

describe("HtmlDownloader", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let httpClient: ReturnType<typeof createMockHttpClient>;
  let ctx: CrawlerContext;

  beforeEach(() => {
    logger = createMockLogger();
    httpClient = createMockHttpClient();
    ctx = createContext(logger, httpClient);
  });

  /* ── Successful download ── */

  describe("successful download", () => {
    it("should return success for text/html content type", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        data: HTML_BODY,
        url: "https://example.com/page",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.html).toBe(HTML_BODY);
        expect(result.originalUrl).toBe("https://example.com/page");
        expect(result.finalUrl).toBe("https://example.com/page");
        expect(result.statusCode).toBe(200);
        expect(result.contentType).toBe("text/html; charset=utf-8");
        expect(result.contentLength).toBe(HTML_BODY.length);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
        expect(result.headers).toBeDefined();
      }
    });

    it("should return success for application/xhtml+xml content type", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "application/xhtml+xml" }),
        data: HTML_BODY,
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(true);
    });

    it("should include all response headers in the result", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({
          "content-type": "text/html",
          "x-custom": "value-123",
          "cache-control": "public, max-age=3600",
        }),
        data: HTML_BODY,
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.headers["content-type"]).toBe("text/html");
        expect(result.headers["x-custom"]).toBe("value-123");
        expect(result.headers["cache-control"]).toBe("public, max-age=3600");
      }
    });
  });

  /* ── Redirect handling ── */

  describe("redirect handling", () => {
    it("should return the final URL after redirects", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        data: HTML_BODY,
        url: "https://example.com/redirected-page",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/old-page");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.originalUrl).toBe("https://example.com/old-page");
        expect(result.finalUrl).toBe("https://example.com/redirected-page");
      }
    });

    it("should use originalUrl as finalUrl when no redirect occurred", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        data: HTML_BODY,
        url: "https://example.com/page",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.finalUrl).toBe("https://example.com/page");
      }
    });
  });

  /* ── Timeout handling ── */

  describe("timeout handling", () => {
    it("should return a timeout error when the request times out", async () => {
      httpClient.get.mockRejectedValue(
        new HttpTimeoutError("https://example.com/page", 30_000),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("timeout");
        expect(result.originalUrl).toBe("https://example.com/page");
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it("should return a timeout error when retries are exhausted due to timeout", async () => {
      httpClient.get.mockRejectedValue(
        new HttpRetryExceededError(
          "https://example.com/page",
          3,
          new HttpTimeoutError("https://example.com/page", 30_000),
        ),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("timeout");
      }
    });
  });

  /* ── Retries exhausted ── */

  describe("retries exhausted", () => {
    it("should return http_error when retries exhausted with HTTP error cause", async () => {
      httpClient.get.mockRejectedValue(
        new HttpRetryExceededError(
          "https://example.com/page",
          3,
          new HttpResponseError(503, "Service Unavailable"),
        ),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("http_error");
        expect(result.statusCode).toBe(503);
      }
    });

    it("should return network_error when retries exhausted with a generic error", async () => {
      httpClient.get.mockRejectedValue(
        new HttpRetryExceededError(
          "https://example.com/page",
          3,
          new Error("DNS resolution failed"),
        ),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("network_error");
      }
    });
  });

  /* ── Invalid content type ── */

  describe("invalid content type", () => {
    it("should reject application/json content type", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        data: '{"key": "value"}',
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/api");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_content_type");
        expect(result.statusCode).toBe(200);
      }
    });

    it("should reject application/pdf content type", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "application/pdf" }),
        data: "%PDF-1.4...",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/doc.pdf");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_content_type");
      }
    });

    it("should reject image content types", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "image/png" }),
        data: "",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/image.png");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_content_type");
      }
    });

    it("should reject text/css content type", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/css" }),
        data: "body { color: red; }",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/style.css");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_content_type");
      }
    });

    it("should reject responses with no content-type header", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: HTML_BODY,
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_content_type");
      }
    });

    it("should log a warning for rejected content types", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "application/pdf" }),
        data: "%PDF-1.4...",
      });

      const downloader = new HtmlDownloader(ctx);
      await downloader.download("https://example.com/doc.pdf");

      expect(logger.warn).toHaveBeenCalledWith(
        "HTML download rejected — invalid content type",
        expect.anything(),
      );
    });
  });

  /* ── HTTP errors ── */

  describe("HTTP errors", () => {
    it("should return http_error with statusCode 404", async () => {
      httpClient.get.mockRejectedValue(new HttpResponseError(404, "Not Found"));

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/missing");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("http_error");
        expect(result.statusCode).toBe(404);
      }
    });

    it("should return http_error with statusCode 500", async () => {
      httpClient.get.mockRejectedValue(
        new HttpResponseError(500, "Internal Server Error"),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/error");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("http_error");
        expect(result.statusCode).toBe(500);
      }
    });

    it("should log a warning for HTTP errors", async () => {
      httpClient.get.mockRejectedValue(new HttpResponseError(404, "Not Found"));

      const downloader = new HtmlDownloader(ctx);
      await downloader.download("https://example.com/missing");

      expect(logger.warn).toHaveBeenCalledWith(
        "HTML download failed — HTTP error",
        expect.objectContaining({ status: 404 }),
      );
    });
  });

  /* ── Empty body ── */

  describe("empty body", () => {
    it("should return empty_body error when HTML is empty", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        data: "",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/empty");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("empty_body");
        expect(result.statusCode).toBe(200);
      }
    });
  });

  /* ── Large HTML ── */

  describe("large HTML", () => {
    it("should handle large HTML content", async () => {
      const largeHtml = "<!DOCTYPE html>" + "x".repeat(100_000);
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        data: largeHtml,
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/large");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.contentLength).toBe(largeHtml.length);
        expect(result.html).toBe(largeHtml);
      }
    });
  });

  /* ── Network errors ── */

  describe("network errors", () => {
    it("should return network_error on TypeError", async () => {
      httpClient.get.mockRejectedValue(new TypeError("fetch failed"));

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("network_error");
      }
    });

    it("should return unknown error for unexpected exceptions", async () => {
      httpClient.get.mockRejectedValue(new Error("Something unexpected"));

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("unknown");
      }
    });
  });

  /* ── Response metadata ── */

  describe("response metadata", () => {
    it("should populate all metadata fields on success", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({
          "content-type": "text/html; charset=utf-8",
          "content-length": String(HTML_BODY.length),
        }),
        data: HTML_BODY,
        url: "https://example.com/page",
      });

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result).toHaveProperty("originalUrl");
        expect(result).toHaveProperty("finalUrl");
        expect(result).toHaveProperty("statusCode");
        expect(result).toHaveProperty("contentType");
        expect(result).toHaveProperty("headers");
        expect(result).toHaveProperty("html");
        expect(result).toHaveProperty("contentLength");
        expect(result).toHaveProperty("durationMs");
      }
    });
  });

  /* ── Duration measurement ── */

  describe("duration measurement", () => {
    it("should measure positive duration", async () => {
      httpClient.get.mockImplementation(
        async () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 200,
                  headers: new Headers({ "content-type": "text/html" }),
                  data: HTML_BODY,
                }),
              10,
            ),
          ),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/page");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.durationMs).toBeGreaterThanOrEqual(5);
      }
    });

    it("should measure duration even on failed requests", async () => {
      httpClient.get.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new HttpResponseError(404, "Not Found")), 10),
          ),
      );

      const downloader = new HtmlDownloader(ctx);
      const result = await downloader.download("https://example.com/missing");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.durationMs).toBeGreaterThanOrEqual(5);
      }
    });
  });

  /* ── Logging ── */

  describe("logging", () => {
    it("should log download start", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        data: HTML_BODY,
      });

      const downloader = new HtmlDownloader(ctx);
      await downloader.download("https://example.com/page");

      expect(logger.info).toHaveBeenCalledWith(
        "HTML download started",
        expect.objectContaining({ url: "https://example.com/page" }),
      );
    });

    it("should log download completion on success", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        data: HTML_BODY,
      });

      const downloader = new HtmlDownloader(ctx);
      await downloader.download("https://example.com/page");

      expect(logger.info).toHaveBeenCalledWith(
        "HTML download completed",
        expect.objectContaining({
          status: 200,
          contentType: "text/html; charset=utf-8",
        }),
      );
    });
  });

  /* ── Discriminated-union guards ── */

  describe("type guard functions", () => {
    it("isDownloadSuccess should return true for success results", () => {
      const result = {
        success: true as const,
        originalUrl: "",
        finalUrl: "",
        statusCode: 200,
        contentType: "text/html",
        headers: {},
        html: "",
        contentLength: 0,
        durationMs: 0,
      };

      expect(isDownloadSuccess(result)).toBe(true);
      expect(isDownloadError(result)).toBe(false);
    });

    it("isDownloadError should return true for error results", () => {
      const result = {
        success: false as const,
        originalUrl: "",
        error: "timeout" as const,
        durationMs: 100,
      };

      expect(isDownloadError(result)).toBe(true);
      expect(isDownloadSuccess(result)).toBe(false);
    });
  });
});
