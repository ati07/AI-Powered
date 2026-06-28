/**
 * Shared HTTP client — type definitions.
 *
 * These types define the configuration and response contracts
 * used throughout the HTTP client infrastructure.
 */

/* ──────────────── Configuration ──────────────── */

/**
 * Global configuration for an HttpClient instance.
 */
export interface HttpClientConfig {
  /** Base URL prepended to every request path. */
  readonly baseUrl?: string;
  /** Default timeout in milliseconds (default: 30 000). */
  readonly timeout?: number;
  /** Default headers sent with every request. */
  readonly headers?: Record<string, string>;
  /** Retry behaviour across all requests. */
  readonly retry?: RetryConfig;
}

/**
 * Retry policy configuration.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3). */
  readonly maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1 000). */
  readonly baseDelayMs: number;
}

/**
 * Per-request overrides.
 */
export interface RequestConfig {
  /** Override the instance-level timeout for this request (ms). */
  readonly timeout?: number;
  /** Additional headers merged on top of instance-level headers. */
  readonly headers?: Record<string, string>;
  /** External AbortSignal (e.g. from a parent operation). */
  readonly signal?: AbortSignal;
  /** Per-request retry overrides. */
  readonly retry?: RetryConfig;
}

/* ──────────────── Responses ──────────────── */

/**
 * Normalised HTTP response.
 */
export interface HttpResponse<T = unknown> {
  readonly status: number;
  readonly headers: Headers;
  readonly data: T;
  /**
   * The final URL after any redirects that were followed.
   * Populated when the response passes through the native `fetch` API.
   */
  readonly url?: string;
}
