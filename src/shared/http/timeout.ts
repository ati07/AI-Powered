/**
 * Shared HTTP client — timeout / AbortSignal utilities.
 */

/**
 * Create an AbortSignal that fires after `timeoutMs` milliseconds.
 *
 * Supports an optional external `signal` — when the external signal aborts
 * (e.g. from a parent cancellation) the returned signal aborts immediately
 * and the timeout is cleared.
 *
 * Callers **must** invoke `clear()` when the request completes or fails to
 * prevent the timer from keeping the process alive unnecessarily.
 *
 * @example
 * const { signal, clear } = createTimeoutSignal(5_000);
 * try {
 *   const res = await fetch(url, { signal });
 *   // …
 * } finally {
 *   clear(); // always clear — even on error
 * }
 */
export function createTimeoutSignal(
  timeoutMs: number,
  externalSignal?: AbortSignal,
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  let cleared = false;

  const timer = setTimeout(() => {
    if (!cleared) {
      controller.abort(
        new DOMException(`Timeout of ${timeoutMs}ms exceeded`, "TimeoutError"),
      );
    }
  }, timeoutMs);

  function clear(): void {
    cleared = true;
    clearTimeout(timer);
  }

  /* Wire up an external signal so the request also aborts when the
     caller cancels the parent operation. */
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
      clear();
    } else {
      const onAbort = (): void => {
        controller.abort(externalSignal.reason);
        clear();
      };
      externalSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return { signal: controller.signal, clear };
}
