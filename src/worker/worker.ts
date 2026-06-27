import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type JobProcessor } from "@/worker/processors/job-processor";
import { type ILogger } from "@/shared/logger";

/**
 * ── ScanWorker ───────────────────────────────────────────
 *  Background worker that polls for pending scans and
 *  processes them one at a time.
 *
 *  Responsibilities:
 *  - Poll every 5 seconds for the next pending scan.
 *  - Delegate processing to the JobProcessor.
 *  - Never stop because of a single scan failure.
 *  - Log all lifecycle events.
 *
 *  The worker has no business logic — it delegates to
 *  the JobProcessor interface.
 * ────────────────────────────────────────────────────────
 */
export class ScanWorker {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private active = false;

  constructor(
    private readonly scanRepo: IScanRepository,
    private readonly jobProcessor: JobProcessor,
    private readonly logger: ILogger,
    private readonly pollIntervalMs: number = 5000,
  ) {}

  /**
   * Start the worker polling loop.
   * Does nothing if already started.
   */
  start(): void {
    if (this.active) {
      this.logger.warn("Worker is already running");
      return;
    }

    this.active = true;
    this.logger.info(`Worker started (poll interval: ${this.pollIntervalMs}ms)`);

    // Poll immediately, then every interval
    this.poll();
    this.timerId = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  /**
   * Gracefully stop the worker.
   */
  stop(): void {
    if (!this.active) return;

    this.active = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.logger.info("Worker stopped");
  }

  /**
   * Whether the worker loop is currently active.
   */
  get isActive(): boolean {
    return this.active;
  }

  /**
   * Single poll cycle: find the next pending scan and process it.
   * Exposed as public for testing.
   */
  async poll(): Promise<void> {
    try {
      const scan = await this.scanRepo.findNextPending();
      if (!scan) return;

      this.logger.info(
        `Found pending scan ${scan.id} for website ${scan.websiteId}`,
      );
      await this.jobProcessor.process(scan.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(`Worker poll cycle failed: ${message}`);
      // Never stop — continue polling
    }
  }
}
