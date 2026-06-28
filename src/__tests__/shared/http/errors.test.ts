import { describe, it, expect } from "vitest";
import {
  HttpError,
  HttpTimeoutError,
  HttpRetryExceededError,
  HttpResponseError,
} from "@/shared/http/errors";

describe("HttpError", () => {
  it("should be the base class for all HTTP errors", () => {
    const error = new HttpResponseError(404, "Not Found");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("HttpResponseError");
    expect(error.status).toBe(404);
    expect(error.statusText).toBe("Not Found");
  });
});

describe("HttpTimeoutError", () => {
  it("should include the URL and timeout in the message", () => {
    const error = new HttpTimeoutError("https://example.com", 5_000);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("HttpTimeoutError");
    expect(error.message).toContain("timed out");
    expect(error.message).toContain("5000ms");
    expect(error.message).toContain("https://example.com");
    expect(error.status).toBeUndefined();
  });
});

describe("HttpRetryExceededError", () => {
  it("should wrap the last cause when provided", () => {
    const cause = new Error("Underlying failure");
    const error = new HttpRetryExceededError(
      "https://example.com",
      3,
      cause,
    );

    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("HttpRetryExceededError");
    expect(error.message).toContain("3 retries");
    expect(error.message).toContain("https://example.com");
    expect(error.cause).toBe(cause);
  });

  it("should work without a cause", () => {
    const error = new HttpRetryExceededError("https://example.com", 3);

    expect(error.name).toBe("HttpRetryExceededError");
    expect(error.cause).toBeUndefined();
  });

  it("should capture the max retries count in the message", () => {
    const error = new HttpRetryExceededError("https://example.com", 5);

    expect(error.message).toContain("5 retries");
  });
});

describe("HttpResponseError", () => {
  it("should capture status and statusText", () => {
    const error = new HttpResponseError(429, "Too Many Requests");

    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("HttpResponseError");
    expect(error.message).toContain("429");
    expect(error.message).toContain("Too Many Requests");
    expect(error.status).toBe(429);
    expect(error.statusText).toBe("Too Many Requests");
  });

  it("should optionally include a response body", () => {
    const error = new HttpResponseError(
      500,
      "Internal Server Error",
      '{"error":"crash"}',
    );

    expect(error.body).toBe('{"error":"crash"}');
  });

  it("should be catchable as HttpError", () => {
    const error = new HttpResponseError(403, "Forbidden");

    expect(error instanceof HttpError).toBe(true);
  });
});
