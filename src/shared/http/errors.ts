/**
 * Shared HTTP client — typed error classes.
 *
 * Every HTTP failure is represented by a specific subclass so callers
 * can catch precisely what they care about without inspecting message
 * strings or status codes by hand.
 */

/* ──────────────── Base ──────────────── */

/**
 * Base class for every HTTP-related error.
 *
 * Catching `HttpError` is the broadest net — prefer catching more specific
 * subclasses when the context allows.
 */
export class HttpError extends Error {
  override readonly name: string = "HttpError";

  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly body?: string,
  ) {
    super(message);
  }
}

/* ──────────────── Concrete errors ──────────────── */

/**
 * A request exceeded the configured timeout without receiving a response.
 */
export class HttpTimeoutError extends HttpError {
  override readonly name: string = "HttpTimeoutError";

  constructor(url: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms: ${url}`);
  }
}

/**
 * All retry attempts were exhausted and the request still failed.
 *
 * The `cause` property may hold the last error that triggered a retry.
 */
export class HttpRetryExceededError extends HttpError {
  override readonly name: string = "HttpRetryExceededError";

  constructor(
    url: string,
    maxRetries: number,
    public readonly cause?: Error,
  ) {
    super(`Request failed after ${maxRetries} retries: ${url}`);
  }
}

/**
 * The server returned a non-2xx status code that was not retried
 * (either because it was non-retryable or retries were exhausted).
 */
export class HttpResponseError extends HttpError {
  override readonly name: string = "HttpResponseError";

  constructor(status: number, statusText: string, body?: string) {
    super(`HTTP ${status} ${statusText}`, status, statusText, body);
  }
}
