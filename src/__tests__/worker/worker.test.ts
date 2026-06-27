import { describe, it, expect, vi, beforeEach, afterEach, type Mocked } from "vitest";
import { ScanWorker } from "@/worker/worker";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type JobProcessor } from "@/worker/processors/job-processor";
import { type ILogger } from "@/shared/logger";
import { ScanEntity, ScanStatus } from "@/domain/entities/scan.entity";

function createMockScanRepo(): Mocked<IScanRepository> {
  return {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByWebsite: vi.fn(),
    findRunningScan: vi.fn(),
    findNextPending: vi.fn(),
    updateStatus: vi.fn(),
    updateProgress: vi.fn(),
  };
}

function createMockJobProcessor(): Mocked<JobProcessor> {
  return {
    process: vi.fn(),
  };
}

function createMockLogger(): Mocked<ILogger> {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function makePendingScan(): ScanEntity {
  return new ScanEntity({
    id: "scan-1",
    websiteId: "website-1",
    status: ScanStatus.PENDING,
    startedAt: null,
    finishedAt: null,
    pagesFound: 0,
    pagesCrawled: 0,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("ScanWorker", () => {
  let scanRepo: Mocked<IScanRepository>;
  let jobProcessor: Mocked<JobProcessor>;
  let logger: Mocked<ILogger>;
  let worker: ScanWorker;

  beforeEach(() => {
    vi.useFakeTimers();
    scanRepo = createMockScanRepo();
    jobProcessor = createMockJobProcessor();
    logger = createMockLogger();
    worker = new ScanWorker(scanRepo, jobProcessor, logger, 5000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("start / stop", () => {
    it("should start polling and be active", () => {
      worker.start();
      expect(worker.isActive).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Worker started"),
      );
    });

    it("should not start a second time", () => {
      worker.start();
      worker.start();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("already running"),
      );
    });

    it("should stop polling and become inactive", () => {
      worker.start();
      worker.stop();
      expect(worker.isActive).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Worker stopped"),
      );
    });

    it("should stop gracefully when not started", () => {
      // Should not throw
      worker.stop();
      expect(worker.isActive).toBe(false);
    });
  });

  describe("poll", () => {
    it("should process a pending scan when found", async () => {
      const scan = makePendingScan();
      scanRepo.findNextPending.mockResolvedValue(scan);
      jobProcessor.process.mockResolvedValue(undefined);

      await worker.poll();

      expect(scanRepo.findNextPending).toHaveBeenCalledOnce();
      expect(jobProcessor.process).toHaveBeenCalledWith("scan-1");
    });

    it("should do nothing when no pending scan exists", async () => {
      scanRepo.findNextPending.mockResolvedValue(null);

      await worker.poll();

      expect(scanRepo.findNextPending).toHaveBeenCalledOnce();
      expect(jobProcessor.process).not.toHaveBeenCalled();
    });

    it("should recover when jobProcessor throws", async () => {
      const scan = makePendingScan();
      scanRepo.findNextPending.mockResolvedValue(scan);
      jobProcessor.process.mockRejectedValue(new Error("Processing error"));

      // Should not throw
      await worker.poll();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Processing error"),
      );
    });

    it("should recover when findNextPending throws", async () => {
      scanRepo.findNextPending.mockRejectedValue(
        new Error("Database error"),
      );

      // Should not throw
      await worker.poll();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Database error"),
      );
    });
  });

  describe("polling loop", () => {
    it("should poll immediately on start", () => {
      scanRepo.findNextPending.mockResolvedValue(null);
      worker.start();
      expect(scanRepo.findNextPending).toHaveBeenCalledOnce();
    });

    it("should poll on each interval tick", () => {
      scanRepo.findNextPending.mockResolvedValue(null);
      worker.start();

      // Advance past first interval
      vi.advanceTimersByTime(5000);
      expect(scanRepo.findNextPending).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(5000);
      expect(scanRepo.findNextPending).toHaveBeenCalledTimes(3);
    });

    it("should stop polling after stop()", () => {
      scanRepo.findNextPending.mockResolvedValue(null);
      worker.start();
      worker.stop();

      const callCount = scanRepo.findNextPending.mock.calls.length;
      vi.advanceTimersByTime(10000);

      // Should not have polled again after stop
      expect(scanRepo.findNextPending).toHaveBeenCalledTimes(callCount);
    });
  });
});
