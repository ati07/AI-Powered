/**
 * Shared HTTP client — the single entry point for all outbound HTTP
 * requests made by crawler components.
 *
 * No crawler module should call `fetch()` directly.  Every request goes
 * through this class so that timeout, retry, logging, User-Agent, and
 * error handling are applied consistently.
 */

import { type ILogger } from "@/shared/logger";
import {
  type HttpClientConfig,
  type RequestConfig,
  type HttpResponse,
} from "./types";
import {
  HttpTimeoutError,
  HttpRetryExceededError,
  HttpResponseError,
} from "./errors";
import { createTimeoutSignal } from "./timeout";
import { isRetryableHttpStatus, calculateBackoffDelay } from "./retry-policy";
import { getUserAgent } from "./user-agent";

/* ──────────────── Defaults ──────────────── */

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1_000;

/* ──────────────── Helpers ──────────────── */

/**
 * Promisified setTimeout — used for the retry backoff delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalise a base-url + path into an absolute URL.
 */
function resolveUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) return path;
  const base = baseUrl.replace(/\/+$/, "");
  const relative = path.replace(/^\/+/, "");
  return `${base}/${relative}`;
}

/**
 * Attempt to parse a response body as JSON when the Content-Type header
 * indicates JSON; fall back to plain text otherwise.
 */
async function parseBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

/* ──────────────── Client ──────────────── */

export class HttpClient {
  constructor(
    private readonly logger: ILogger,
    private readonly config: HttpClientConfig = {},
  ) {}

  /**
   * Execute a GET request with timeout, retry, and logging.
   *
   * @param url         Relative or absolute URL.
   * @param reqConfig   Optional per-request overrides.
   *
   * @throws {HttpTimeoutError}       When the timeout fires every attempt.
   * @throws {HttpRetryExceededError} When all retries are exhausted.
   * @throws {HttpResponseError}      On a non-retryable (or final) non-2xx status.
   * @throws {Error}                  Any other unexpected error (not retried).
   */
  async get<T = unknown>(
    url: string,
    reqConfig?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    const resolvedUrl = resolveUrl(this.config.baseUrl, url);

    const timeout =
      reqConfig?.timeout ?? this.config.timeout ?? DEFAULT_TIMEOUT;
    const maxRetries =
      reqConfig?.retry?.maxRetries ??
      this.config.retry?.maxRetries ??
      DEFAULT_MAX_RETRIES;
    const baseDelayMs =
      reqConfig?.retry?.baseDelayMs ??
      this.config.retry?.baseDelayMs ??
      DEFAULT_BASE_DELAY_MS;

    /* Merge headers: instance-level defaults first, per-request on top. */
    const headers: Record<string, string> = {
      "User-Agent": getUserAgent(),
      ...this.config.headers,
      ...reqConfig?.headers,
    };

    this.logger.info("http request started", {
      method: "GET",
      url: resolvedUrl,
      timeout,
      maxRetries,
    });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { signal, clear } = createTimeoutSignal(timeout, reqConfig?.signal);

      try {
        const response = await fetch(resolvedUrl, {
          method: "GET",
          headers,
          signal,
        });
        clear();

        const elapsed = Date.now() - startTime;

        /* ── Success ── */
        if (response.ok) {
          this.logger.info("http request succeeded", {
            url: resolvedUrl,
            status: response.status,
            elapsed,
            attempt,
          });
          const data = await parseBody<T>(response);
          return { status: response.status, headers: response.headers, data, url: response.url };
        }

        /* ── Non-ok status ── */
        const body = await response.text().catch(() => undefined);

        if (attempt < maxRetries && isRetryableHttpStatus(response.status)) {
          const delay = calculateBackoffDelay(attempt, baseDelayMs);
          this.logger.warn("http request failed, retrying", {
            url: resolvedUrl,
            status: response.status,
            attempt: attempt + 1,
            maxRetries,
            delay,
            elapsed,
          });
          await sleep(delay);
          continue;
        }

        /* Not retryable or retries exhausted. */
        this.logger.error("http request failed", {
          url: resolvedUrl,
          status: response.status,
          elapsed,
        });

        if (attempt >= maxRetries) {
          throw new HttpRetryExceededError(
            resolvedUrl,
            maxRetries,
            new HttpResponseError(response.status, response.statusText, body),
          );
        }

        throw new HttpResponseError(
          response.status,
          response.statusText,
          body,
        );
      } catch (error) {
        clear();

        /* ── Timeout ── */
        if (error instanceof DOMException && error.name === "TimeoutError") {
          if (attempt < maxRetries) {
            const delay = calculateBackoffDelay(attempt, baseDelayMs);
            this.logger.warn("http request timed out, retrying", {
              url: resolvedUrl,
              attempt: attempt + 1,
              maxRetries,
              delay,
              timeout,
            });
            await sleep(delay);
            continue;
          }

          this.logger.error("http request timed out, retries exhausted", {
            url: resolvedUrl,
            timeout,
          });
          throw new HttpRetryExceededError(
            resolvedUrl,
            maxRetries,
            new HttpTimeoutError(resolvedUrl, timeout),
          );
        }

        /* ── External abort (not a timeout) — never retry ── */
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        /* ── Network error ── */
        if (error instanceof TypeError) {
          if (attempt < maxRetries) {
            const delay = calculateBackoffDelay(attempt, baseDelayMs);
            this.logger.warn("http request failed (network error), retrying", {
              url: resolvedUrl,
              attempt: attempt + 1,
              maxRetries,
              delay,
            });
            await sleep(delay);
            continue;
          }

          this.logger.error(
            "http request failed (network error), retries exhausted",
            { url: resolvedUrl },
          );
          throw new HttpRetryExceededError(
            resolvedUrl,
            maxRetries,
            error as Error,
          );
        }

        /* ── Our own custom errors — re-throw as-is ── */
        if (
          error instanceof HttpResponseError ||
          error instanceof HttpRetryExceededError
        ) {
          throw error;
        }

        /* ── Anything else — not retryable ── */
        throw error;
      }
    }

    /* TypeScript guard — the loop always returns or throws before reaching here,
       so this line is unreachable in practice. */
    throw new HttpRetryExceededError(resolvedUrl, maxRetries);
  }
}
