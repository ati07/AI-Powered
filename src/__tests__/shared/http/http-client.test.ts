import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mocked,
} from "vitest";
import { HttpClient } from "@/shared/http/http-client";
import {
  HttpRetryExceededError,
  HttpResponseError,
} from "@/shared/http/errors";
import { type ILogger } from "@/shared/logger";

/* ──────────────── Test helpers ──────────────── */

function createMockLogger(): Mocked<ILogger> {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

/**
 * Build a `Response` compatible with tests involving JSON parsing.
 */
function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Build a plain-text `Response`.
 */
function textResponse(
  body: string,
  status = 200,
): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * A fetch mock that never settles on its own — used to test time-outs.
 *
 * When the AbortSignal fires (e.g. from our timeout utility) the promise
 * rejects with the signal's reason, simulating what the real fetch does.
 */
function hangingFetch(): typeof fetch {
  return vi.fn().mockImplementation(
    (_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        const signal = (init as { signal?: AbortSignal })?.signal;
        if (signal?.aborted) {
          reject(signal.reason);
          return;
        }
        signal?.addEventListener(
          "abort",
          () => reject(signal.reason),
          { once: true },
        );
      }),
  ) as unknown as typeof fetch;
}

/* ──────────────── Suite ──────────────── */

describe("HttpClient", () => {
  let logger: Mocked<ILogger>;

  beforeEach(() => {
    logger = createMockLogger();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /* ── Successful request ── */

  describe("successful requests", () => {
    it("should return parsed JSON data on a 200 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger);
      const result = await client.get("http://example.com");

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ ok: true });
      expect(result.headers.get("content-type")).toBe("application/json");
    });

    it("should return plain text when Content-Type is not JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValue(textResponse("hello"));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger);
      const result = await client.get("http://example.com");

      expect(result.status).toBe(200);
      expect(result.data).toBe("hello");
    });

    it("should log the request lifecycle", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger);
      await client.get("http://example.com");

      expect(logger.info).toHaveBeenCalledWith(
        "http request started",
        expect.objectContaining({ method: "GET", url: "http://example.com" }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "http request succeeded",
        expect.objectContaining({ status: 200 }),
      );
    });
  });

  /* ── Base URL ── */

  describe("base URL", () => {
    it("should prepend baseUrl when a path is given", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, { baseUrl: "https://base.com" });
      await client.get("/api/data");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://base.com/api/data",
        expect.anything(),
      );
    });

    it("should handle trailing/leading slashes gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, { baseUrl: "https://base.com/" });
      await client.get("api/data");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://base.com/api/data",
        expect.anything(),
      );
    });

    it("should use the URL as-is when no baseUrl is configured", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger);
      await client.get("https://absolute.com/path");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://absolute.com/path",
        expect.anything(),
      );
    });
  });

  /* ── Headers ── */

  describe("headers", () => {
    it("should set the User-Agent header by default", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger);
      await client.get("http://example.com");

      const callHeaders = (mockFetch.mock.calls[0]![1] as RequestInit)
        .headers as Record<string, string>;
      expect(callHeaders["User-Agent"]).toBe(
        "AIVisibilityBot/1.0 (+https://your-domain.com)",
      );
    });

    it("should merge instance-level default headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        headers: { "X-Instance": "foo" },
      });
      await client.get("http://example.com");

      const callHeaders = (mockFetch.mock.calls[0]![1] as RequestInit)
        .headers as Record<string, string>;
      expect(callHeaders["User-Agent"]).toBeDefined();
      expect(callHeaders["X-Instance"]).toBe("foo");
    });

    it("should merge per-request headers on top of instance headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        headers: { Authorization: "Bearer token" },
      });
      await client.get("http://example.com", {
        headers: { "X-Request-Id": "req-123" },
      });

      const callHeaders = (mockFetch.mock.calls[0]![1] as RequestInit)
        .headers as Record<string, string>;
      expect(callHeaders["Authorization"]).toBe("Bearer token");
      expect(callHeaders["X-Request-Id"]).toBe("req-123");
    });

    it("should let per-request headers override instance headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        headers: { "X-Debug": "false" },
      });
      await client.get("http://example.com", {
        headers: { "X-Debug": "true" },
      });

      const callHeaders = (mockFetch.mock.calls[0]![1] as RequestInit)
        .headers as Record<string, string>;
      expect(callHeaders["X-Debug"]).toBe("true");
    });
  });

  /* ── Timeout ── */

  describe("timeout", () => {
    it("should throw HttpRetryExceededError wrapping HttpTimeoutError when timeout fires", async () => {
      vi.useFakeTimers();
      const mockFetch = hangingFetch();
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        timeout: 100,
        retry: { maxRetries: 0, baseDelayMs: 100 },
      });

      // Attach rejection handler BEFORE advancing timers to avoid
      // Node unhandledRejection warnings.
      const promise = client.get("http://example.com");
      const caught = promise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(100);

      await expect(caught).resolves.toBeInstanceOf(HttpRetryExceededError);
      // Should log the failure
      expect(logger.error).toHaveBeenCalled();
    });

    it("should retry on timeout when retries are configured", async () => {
      vi.useFakeTimers();
      // First call: hanging (will time out).  Second call: success.
      const mockFetch = vi.fn();
      mockFetch.mockImplementationOnce((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = (init as { signal?: AbortSignal })?.signal;
          if (signal?.aborted) {
            reject(signal.reason);
            return;
          }
          signal?.addEventListener(
            "abort",
            () => reject(signal.reason),
            { once: true },
          );
        });
      });
      mockFetch.mockResolvedValueOnce(jsonResponse({ recovered: true }));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        timeout: 100,
        retry: { maxRetries: 1, baseDelayMs: 50 },
      });

      const promise = client.get("http://example.com");

      // Advance past the timeout (100ms) then the retry delay (50ms)
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(50);

      const result = await promise;
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ recovered: true });
      expect(logger.warn).toHaveBeenCalledWith(
        "http request timed out, retrying",
        expect.anything(),
      );
    });
  });

  /* ── Retry logic ── */

  describe("retry logic", () => {
    it.each([429, 500, 502, 503, 504])(
      "should retry on status %i and succeed on the next attempt",
      async (status) => {
        vi.useFakeTimers();
        const mockFetch = vi
          .fn()
          .mockResolvedValueOnce(new Response(null, { status }))
          .mockResolvedValueOnce(jsonResponse({ ok: true }));
        vi.stubGlobal("fetch", mockFetch);

        const client = new HttpClient(logger, {
          retry: { maxRetries: 1, baseDelayMs: 100 },
        });

        const promise = client.get("http://example.com");

        // Advance past the retry backoff delay
        await vi.advanceTimersByTimeAsync(100);

        const result = await promise;
        expect(result.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(logger.warn).toHaveBeenCalledWith(
          "http request failed, retrying",
          expect.objectContaining({ status }),
        );
      },
    );

    it("should throw HttpRetryExceededError when all retries are exhausted on retryable status", async () => {
      vi.useFakeTimers();
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 503 }),
      );
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        retry: { maxRetries: 2, baseDelayMs: 50 },
      });

      // Attach handler before timer advancement so the rejection
      // is already handled when it fires.
      const promise = client.get("http://example.com");
      const caught = promise.catch((e) => e);

      // Advance past all retry delays: 50 + 100 = 150ms
      // (attempt 0: retry delay 50, attempt 1: retry delay 100, attempt 2: final)
      await vi.advanceTimersByTimeAsync(150);

      await expect(caught).resolves.toBeInstanceOf(HttpRetryExceededError);
      // Initial call + 2 retries = 3 calls total
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should throw HttpResponseError immediately on a non-retryable status", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 404 }));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        retry: { maxRetries: 3, baseDelayMs: 100 },
      });

      await expect(client.get("http://example.com")).rejects.toThrow(
        HttpResponseError,
      );
      // Only one attempt — no retry for non-retryable status
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on network errors (TypeError from fetch)", async () => {
      vi.useFakeTimers();
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        retry: { maxRetries: 1, baseDelayMs: 100 },
      });

      const promise = client.get("http://example.com");

      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should exhaust retries on repeated network errors", async () => {
      vi.useFakeTimers();
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger, {
        retry: { maxRetries: 1, baseDelayMs: 50 },
      });

      // Attach handler before timer advancement.
      const promise = client.get("http://example.com");
      const caught = promise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(50);

      await expect(caught).resolves.toBeInstanceOf(HttpRetryExceededError);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  /* ── AbortController ── */

  describe("external abort", () => {
    it("should abort the request when an external AbortSignal fires", async () => {
      const abortController = new AbortController();
      const mockFetch = hangingFetch();
      vi.stubGlobal("fetch", mockFetch);

      const client = new HttpClient(logger);

      const promise = client.get("http://example.com", {
        signal: abortController.signal,
      });

      abortController.abort(new Error("Cancelled by user"));

      await expect(promise).rejects.toThrow(Error);
      await expect(promise).rejects.toThrow("Cancelled by user");
    });
  });

  /* ── Per-request config overrides ── */

  describe("per-request config", () => {
    it("should override timeout per-request", async () => {
      vi.useFakeTimers();
      const mockFetch = hangingFetch();
      vi.stubGlobal("fetch", mockFetch);

      // Instance timeout is 5s, but request uses 50ms
      const client = new HttpClient(logger, {
        timeout: 5_000,
        retry: { maxRetries: 0, baseDelayMs: 100 },
      });

      // Attach handler before timer advancement.
      const promise = client.get("http://example.com", { timeout: 50 });
      const caught = promise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(50);

      await expect(caught).resolves.toBeInstanceOf(HttpRetryExceededError);
    });

    it("should override retry config per-request", async () => {
      vi.useFakeTimers();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 503 }));
      vi.stubGlobal("fetch", mockFetch);

      // Instance says 3 retries, but request overrides to 0
      const client = new HttpClient(logger, {
        retry: { maxRetries: 3, baseDelayMs: 100 },
      });

      const promise = client.get("http://example.com", {
        retry: { maxRetries: 0, baseDelayMs: 100 },
      });

      // With 0 retries the single attempt fails and no retry is attempted
      await expect(promise).rejects.toThrow(HttpRetryExceededError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
