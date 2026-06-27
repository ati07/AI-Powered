import { type JobProcessor } from "@/worker/processors/job-processor";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type ILogger } from "@/shared/logger";

/**
 * ── ScanProcessor ────────────────────────────────────────
 *  Processes a single scan through its lifecycle.
 *
 *  1. Load scan by ID.
 *  2. Transition PENDING → RUNNING.
 *  3. Simulate work (3-second delay).
 *  4. Transition RUNNING → COMPLETED.
 *
 *  On any exception:
 *  5. Transition RUNNING → FAILED with the error message.
 *
 *  No crawler logic yet — the simulated delay will be
 *  replaced by the real crawl pipeline in a future story.
 * ────────────────────────────────────────────────────────
 */
export class ScanProcessor implements JobProcessor {
  constructor(
    private readonly scanRepo: IScanRepository,
    private readonly logger: ILogger,
    private readonly simulatedWorkMs: number = 3000,
  ) {}

  async process(scanId: string): Promise<void> {
    // 1. Load scan
    const scan = await this.scanRepo.findById({ id: scanId });
    if (!scan) {
      this.logger.warn(`Scan ${scanId} not found, skipping`);
      return;
    }

    this.logger.info(`Processing scan ${scanId} (status=${scan.status})`);

    // 2. Transition PENDING → RUNNING
    const running = scan.start();
    await this.scanRepo.update({
      id: running.id,
      status: running.status,
      startedAt: running.startedAt,
      updatedAt: new Date(),
    });

    this.logger.info(`Scan ${scanId} started`);

    try {
      // 3. Simulate work
      //    Will be replaced by the real crawl pipeline.
      await this.sleep(this.simulatedWorkMs);

      // 4. Transition RUNNING → COMPLETED
      const completed = running.complete();
      await this.scanRepo.update({
        id: completed.id,
        status: completed.status,
        finishedAt: completed.finishedAt,
        updatedAt: new Date(),
      });

      this.logger.info(`Scan ${scanId} completed`);
    } catch (err) {
      // 5. On failure: transition RUNNING → FAILED
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      const failed = running.fail(errorMessage);
      await this.scanRepo.update({
        id: failed.id,
        status: failed.status,
        finishedAt: failed.finishedAt,
        error: failed.error,
        updatedAt: new Date(),
      });

      this.logger.error(`Scan ${scanId} failed: ${errorMessage}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
