import { PrismaScanRepository } from "@/infrastructure/db/repositories/prisma-scan.repository";
import { PrismaWebsiteRepository } from "@/infrastructure/db/repositories/prisma-website.repository";
import { PrismaPageRepository } from "@/infrastructure/db/repositories/prisma-page.repository";
import { PrismaPageScoreRepository } from "@/infrastructure/db/repositories/prisma-page-score.repository";
import { CrawlProcessor } from "@/crawler/processor/crawl-processor";
import { ScanWorker } from "@/worker/worker";
import { ConsoleLogger } from "@/shared/logger";
import { HttpClient } from "@/shared/http/http-client";
import { CreatePageUseCase } from "@/application/page/use-cases/create-page.use-case";
import { ScorePageUseCase } from "@/application/scoring/score-page.usecase";
import { ScanSummaryUseCase } from "@/application/scoring/scan-summary.usecase";

/**
 * ── Worker Entry Point ──────────────────────────────────
 *  Run with: npx tsx src/worker/index.ts
 *
 *  Starts the background worker that polls for and
 *  processes pending scans using the full crawl pipeline.
 * ────────────────────────────────────────────────────────
 */

const logger = new ConsoleLogger();
const httpClient = new HttpClient(logger);
const scanRepo = new PrismaScanRepository();
const websiteRepo = new PrismaWebsiteRepository();
const pageRepo = new PrismaPageRepository();
const pageScoreRepo = new PrismaPageScoreRepository();
const createPageUseCase = new CreatePageUseCase(pageRepo);
const scorePageUseCase = new ScorePageUseCase(pageScoreRepo);
const scanSummaryUseCase = new ScanSummaryUseCase(scanRepo, pageScoreRepo);
const crawlProcessor = new CrawlProcessor(
  scanRepo,
  websiteRepo,
  createPageUseCase,
  scorePageUseCase,
  scanSummaryUseCase,
  logger,
  httpClient,
);
const worker = new ScanWorker(scanRepo, crawlProcessor, logger);

function shutdown(): void {
  logger.info("Shutting down worker…");
  worker.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

worker.start();
logger.info("Worker entry point ready");
