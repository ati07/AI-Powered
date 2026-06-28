/**
 * Crawler — HTML Downloader.
 *
 * Downloads HTML pages using the shared HttpClient, validates responses,
 * and returns typed results without throwing.
 *
 * This component is responsible **only** for downloading and validation.
 * It does NOT parse HTML or extract SEO information.
 *
 * Usage:
 *   const downloader = new HtmlDownloader(ctx);
 *   const result = await downloader.download("https://example.com/page");
 *   if (result.success) {
 *     console.log(result.html);
 *   }
 */

import { type ILogger } from "@/shared/logger";
import { type HttpClient } from "@/shared/http/http-client";
import {
  HttpTimeoutError,
  HttpRetryExceededError,
  HttpResponseError,
} from "@/shared/http/errors";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import {
  type HtmlDownloadResult,
  type HtmlDownloadSuccess,
  type HtmlDownloadError,
  type HtmlDownloadErrorType,
} from "./types";

/* ──────────────── Constants ──────────────── */

/** Content types that the downloader accepts. */
const ACCEPTED_CONTENT_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
]);

/* ──────────────── Helpers ──────────────── */

/**
 * Check whether the Content-Type header value is one of the accepted
 * MIME types (parameterised values such as `text/html; charset=utf-8`
 * are matched by their base MIME type only).
 */
function isAcceptedContentType(contentTypeValue: string): boolean {
  const mimeType = contentTypeValue.split(";")[0]!.trim().toLowerCase();
  return ACCEPTED_CONTENT_TYPES.has(mimeType);
}

/**
 * Convert a `Headers` object to a plain key-value record.
 */
function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/* ──────────────── Service ──────────────── */

export class HtmlDownloader {
  private readonly logger: ILogger;
  private readonly httpClient: HttpClient;

  constructor(ctx: CrawlerContext) {
    this.logger = ctx.logger;
    this.httpClient = ctx.httpClient;
  }

  /**
   * Download an HTML page.
   *
   * Validates the HTTP status (must be 200), the Content-Type header
   * (must be `text/html` or `application/xhtml+xml`), and measures
   * the request duration.
   *
   * Never throws — all failures are captured in the returned
   * {@link HtmlDownloadResult}.
   *
   * @param url — Absolute URL of the page to download.
   */
  async download(url: string): Promise<HtmlDownloadResult> {
    const startTime = Date.now();

    this.logger.info("HTML download started", { url });

    try {
      const response = await this.httpClient.get<string>(url);
      const durationMs = Date.now() - startTime;

      /* ── Validate HTTP status ── */
      if (response.status !== 200) {
        this.logger.warn("HTML download rejected — non-200 status", {
          url,
          status: response.status,
          durationMs,
        });

        return this.buildError(url, "http_error", durationMs, response.status);
      }

      /* ── Validate Content-Type ── */
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType || !isAcceptedContentType(contentType)) {
        this.logger.warn("HTML download rejected — invalid content type", {
          url,
          contentType,
          status: response.status,
          durationMs,
        });

        return this.buildError(
          url,
          "invalid_content_type",
          durationMs,
          response.status,
        );
      }

      const html = response.data as string;

      /* ── Validate non-empty body ── */
      if (html.length === 0) {
        this.logger.warn("HTML download rejected — empty body", {
          url,
          contentType,
          durationMs,
        });

        return this.buildError(
          url,
          "empty_body",
          durationMs,
          response.status,
        );
      }

      /* ── Success ── */
      this.logger.info("HTML download completed", {
        url,
        status: response.status,
        contentType,
        bytes: html.length,
        durationMs,
      });

      return {
        success: true,
        originalUrl: url,
        finalUrl: response.url ?? url,
        statusCode: response.status,
        contentType,
        headers: headersToRecord(response.headers),
        html,
        contentLength: html.length,
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;

      /* ── Timeout ── */
      if (error instanceof HttpTimeoutError) {
        this.logger.warn("HTML download failed — timeout", {
          url,
          durationMs,
        });

        return this.buildError(url, "timeout", durationMs);
      }

      /* ── Retry exhausted — unwrap the cause ── */
      if (error instanceof HttpRetryExceededError) {
        if (error.cause instanceof HttpTimeoutError) {
          this.logger.warn("HTML download failed — timeout (retries exhausted)", {
            url,
            durationMs,
          });

          return this.buildError(url, "timeout", durationMs);
        }

        if (error.cause instanceof HttpResponseError) {
          this.logger.warn("HTML download failed — HTTP error (retries exhausted)", {
            url,
            status: error.cause.status,
            durationMs,
          });

          return this.buildError(url, "http_error", durationMs, error.cause.status);
        }

        this.logger.warn("HTML download failed — network error (retries exhausted)", {
          url,
          durationMs,
        });

        return this.buildError(url, "network_error", durationMs);
      }

      /* ── HTTP error (non-retryable or last attempt) ── */
      if (error instanceof HttpResponseError) {
        this.logger.warn("HTML download failed — HTTP error", {
          url,
          status: error.status,
          durationMs,
        });

        return this.buildError(url, "http_error", durationMs, error.status);
      }

      /* ── Network / unknown error ── */
      if (error instanceof TypeError) {
        this.logger.warn("HTML download failed — network error", {
          url,
          durationMs,
        });

        return this.buildError(url, "network_error", durationMs);
      }

      /* ── Catch-all ── */
      this.logger.warn("HTML download failed — unknown error", {
        url,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });

      return this.buildError(url, "unknown", durationMs);
    }
  }

  /* ──────────────── Private helpers ──────────────── */

  /**
   * Build an error result with consistent shape.
   */
  private buildError(
    originalUrl: string,
    error: HtmlDownloadErrorType,
    durationMs: number,
    statusCode?: number,
  ): HtmlDownloadError {
    return {
      success: false,
      originalUrl,
      error,
      statusCode,
      durationMs,
    };
  }
}

/* ──────────────── Discriminated-union guard ──────────────── */

/**
 * Narrow the result type for convenience.
 */
export function isDownloadSuccess(
  result: HtmlDownloadResult,
): result is HtmlDownloadSuccess {
  return result.success === true;
}

export function isDownloadError(
  result: HtmlDownloadResult,
): result is HtmlDownloadError {
  return result.success === false;
}
