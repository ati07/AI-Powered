/**
 * Shared HTTP client — retry policy.
 *
 * Determines which HTTP status codes should be retried and computes
 * exponential backoff delays.
 */

/**
 * HTTP status codes that are considered safe to retry.
 *
 * - 429 Too Many Requests
 * - 500 Internal Server Error
 * - 502 Bad Gateway
 * - 503 Service Unavailable
 * - 504 Gateway Timeout
 */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Returns `true` when the given HTTP status code should trigger a retry.
 */
export function isRetryableHttpStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(status);
}

/**
 * Compute the delay before the next retry attempt using exponential backoff.
 *
 * Formula: `baseDelayMs × 2^attempt`
 *
 * @param attempt    Zero-based retry attempt index (0 = first retry).
 * @param baseDelayMs  Base delay in milliseconds.
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
): number {
  return baseDelayMs * Math.pow(2, attempt);
}
