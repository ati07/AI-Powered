/**
 * Crawler — HTML downloader type definitions.
 *
 * Defines the result types returned by the HTML downloader.
 * Every call produces a typed result — no exceptions are thrown.
 */

/**
 * Error type discriminator for download failures.
 */
export type HtmlDownloadErrorType =
  | "timeout"
  | "network_error"
  | "http_error"
  | "invalid_content_type"
  | "empty_body"
  | "unknown";

/**
 * Successful HTML download result.
 */
export interface HtmlDownloadSuccess {
  readonly success: true;
  /** The original URL that was requested. */
  readonly originalUrl: string;
  /** The final URL after redirects (same as originalUrl when no redirect happened). */
  readonly finalUrl: string;
  /** HTTP status code (always 200 for successful downloads). */
  readonly statusCode: number;
  /** Content-Type header value (e.g. "text/html; charset=utf-8"). */
  readonly contentType: string;
  /** Response headers as a flat key-value map. */
  readonly headers: Record<string, string>;
  /** Raw HTML content. */
  readonly html: string;
  /** Length of the HTML content in characters. */
  readonly contentLength: number;
  /** Total download duration in milliseconds. */
  readonly durationMs: number;
}

/**
 * Failed HTML download result.
 */
export interface HtmlDownloadError {
  readonly success: false;
  /** The original URL that was requested. */
  readonly originalUrl: string;
  /** Discriminator identifying the error category. */
  readonly error: HtmlDownloadErrorType;
  /** HTTP status code when the server responded (absent for network/timeout errors). */
  readonly statusCode?: number;
  /** Total elapsed time in milliseconds before the failure. */
  readonly durationMs: number;
}

/**
 * Discriminated union — every download produces one of these.
 */
export type HtmlDownloadResult = HtmlDownloadSuccess | HtmlDownloadError;
