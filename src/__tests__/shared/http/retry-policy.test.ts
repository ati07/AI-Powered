import { describe, it, expect } from "vitest";
import {
  isRetryableHttpStatus,
  calculateBackoffDelay,
} from "@/shared/http/retry-policy";

describe("isRetryableHttpStatus", () => {
  it("should return true for 429 Too Many Requests", () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
  });

  it("should return true for 500 Internal Server Error", () => {
    expect(isRetryableHttpStatus(500)).toBe(true);
  });

  it("should return true for 502 Bad Gateway", () => {
    expect(isRetryableHttpStatus(502)).toBe(true);
  });

  it("should return true for 503 Service Unavailable", () => {
    expect(isRetryableHttpStatus(503)).toBe(true);
  });

  it("should return true for 504 Gateway Timeout", () => {
    expect(isRetryableHttpStatus(504)).toBe(true);
  });

  it("should return false for 200 OK", () => {
    expect(isRetryableHttpStatus(200)).toBe(false);
  });

  it("should return false for 201 Created", () => {
    expect(isRetryableHttpStatus(201)).toBe(false);
  });

  it("should return false for 301 Moved Permanently", () => {
    expect(isRetryableHttpStatus(301)).toBe(false);
  });

  it("should return false for 401 Unauthorized", () => {
    expect(isRetryableHttpStatus(401)).toBe(false);
  });

  it("should return false for 403 Forbidden", () => {
    expect(isRetryableHttpStatus(403)).toBe(false);
  });

  it("should return false for 404 Not Found", () => {
    expect(isRetryableHttpStatus(404)).toBe(false);
  });
});

describe("calculateBackoffDelay", () => {
  it("should return baseDelayMs for attempt 0", () => {
    expect(calculateBackoffDelay(0, 1_000)).toBe(1_000);
  });

  it("should return 2× base for attempt 1", () => {
    expect(calculateBackoffDelay(1, 1_000)).toBe(2_000);
  });

  it("should return 4× base for attempt 2", () => {
    expect(calculateBackoffDelay(2, 1_000)).toBe(4_000);
  });

  it("should return 8× base for attempt 3", () => {
    expect(calculateBackoffDelay(3, 1_000)).toBe(8_000);
  });

  it("should work with a non-standard base delay", () => {
    expect(calculateBackoffDelay(0, 500)).toBe(500);
    expect(calculateBackoffDelay(1, 500)).toBe(1_000);
    expect(calculateBackoffDelay(2, 500)).toBe(2_000);
  });
});
