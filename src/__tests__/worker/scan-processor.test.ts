import { describe, it, expect, vi, beforeEach, afterEach, type Mocked } from "vitest";
import { ScanProcessor } from "@/worker/processors/scan-processor";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { ScanEntity, ScanStatus } from "@/domain/entities/scan.entity";
import { type ILogger } from "@/shared/logger";

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

describe("ScanProcessor", () => {
  let scanRepo: Mocked<IScanRepository>;
  let logger: Mocked<ILogger>;
  let processor: ScanProcessor;

  beforeEach(() => {
    vi.useFakeTimers();
    scanRepo = createMockScanRepo();
    logger = createMockLogger();
    processor = new ScanProcessor(scanRepo, logger, 0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should transition PENDING → RUNNING → COMPLETED on success", async () => {
    const scan = makePendingScan();
    scanRepo.findById.mockResolvedValue(scan);
    scanRepo.update.mockResolvedValue(scan);

    const promise = processor.process("scan-1");
    await vi.runAllTimersAsync();

    await promise;

    // Should have called update twice: once for RUNNING, once for COMPLETED
    expect(scanRepo.update).toHaveBeenCalledTimes(2);

    // First call: transition to RUNNING
    const firstUpdate = scanRepo.update.mock.calls[0]![0];
    expect(firstUpdate.status).toBe(ScanStatus.RUNNING);
    expect(firstUpdate.startedAt).not.toBeNull();

    // Second call: transition to COMPLETED
    const secondUpdate = scanRepo.update.mock.calls[1]![0];
    expect(secondUpdate.status).toBe(ScanStatus.COMPLETED);
    expect(secondUpdate.finishedAt).not.toBeNull();
  });

  it("should log info messages during processing", async () => {
    const scan = makePendingScan();
    scanRepo.findById.mockResolvedValue(scan);
    scanRepo.update.mockResolvedValue(scan);

    const promise = processor.process("scan-1");
    await vi.runAllTimersAsync();
    await promise;

    expect(logger.info).toHaveBeenCalled();
  });

  it("should transition RUNNING → FAILED when work throws", async () => {
    const scan = makePendingScan();
    scanRepo.findById.mockResolvedValue(scan);

    // Make the second update call (the COMPLETED transition) throw
    // so the catch block transitions to FAILED
    scanRepo.update
      .mockResolvedValueOnce(scan)   // first call: RUNNING update succeeds
      .mockRejectedValueOnce(new Error("Crawl error")); // second call: COMPLETED update fails

    const promise = processor.process("scan-1");
    await vi.runAllTimersAsync();
    await promise;

    // Should have 3 calls: RUNNING, COMPLETED (fails inside try), then FAILED
    expect(scanRepo.update).toHaveBeenCalledTimes(3);

    const firstUpdate = scanRepo.update.mock.calls[0]![0];
    expect(firstUpdate.status).toBe(ScanStatus.RUNNING);

    const failedUpdate = scanRepo.update.mock.calls[2]![0];
    expect(failedUpdate.status).toBe(ScanStatus.FAILED);
    expect(failedUpdate.error).toBe("Crawl error");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should warn and return when scan is not found", async () => {
    scanRepo.findById.mockResolvedValue(null);

    await processor.process("scan-1");

    expect(scanRepo.update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should call findById with the correct scan ID", async () => {
    scanRepo.findById.mockResolvedValue(null);

    await processor.process("scan-1");

    expect(scanRepo.findById).toHaveBeenCalledWith({ id: "scan-1" });
  });
});
