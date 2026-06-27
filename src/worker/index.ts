import { PrismaScanRepository } from "@/infrastructure/db/repositories/prisma-scan.repository";
import { ScanProcessor } from "@/worker/processors/scan-processor";
import { ScanWorker } from "@/worker/worker";
import { ConsoleLogger } from "@/shared/logger";

/**
 * ── Worker Entry Point ──────────────────────────────────
 *  Run with: npx tsx src/worker/index.ts
 *
 *  Starts the background worker that polls for and
 *  processes pending scans.
 * ────────────────────────────────────────────────────────
 */

const logger = new ConsoleLogger();
const scanRepo = new PrismaScanRepository();
const scanProcessor = new ScanProcessor(scanRepo, logger);
const worker = new ScanWorker(scanRepo, scanProcessor, logger);

function shutdown(): void {
  logger.info("Shutting down worker…");
  worker.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

worker.start();
logger.info("Worker entry point ready");
