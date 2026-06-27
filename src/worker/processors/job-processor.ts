/**
 * ── JobProcessor ─────────────────────────────────────────
 *  Generic interface for processing a single job.
 *
 *  The worker depends only on this interface.
 *  Never hardcode processing logic inside the worker.
 * ────────────────────────────────────────────────────────
 */
export interface JobProcessor {
  /**
   * Process a job identified by scanId.
   * Throws on failure; the worker catches and handles errors.
   */
  process(scanId: string): Promise<void>;
}
