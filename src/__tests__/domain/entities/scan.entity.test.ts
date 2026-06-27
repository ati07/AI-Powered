import { describe, it, expect } from "vitest";
import {
  ScanEntity,
  ScanStatus,
  InvalidScanTransitionError,
  type CreateScanEntityInput,
} from "@/domain/entities/scan.entity";

function makeScan(
  overrides: Partial<CreateScanEntityInput> = {},
): ScanEntity {
  const defaults: CreateScanEntityInput = {
    id: "scan-1",
    websiteId: "website-1",
    status: ScanStatus.PENDING,
    startedAt: null,
    finishedAt: null,
    pagesFound: 0,
    pagesCrawled: 0,
    error: null,
    ...overrides,
  };
  return new ScanEntity(defaults);
}

describe("ScanEntity", () => {
  describe("constructor", () => {
    it("should create a scan with required fields", () => {
      const scan = makeScan();
      expect(scan.id).toBe("scan-1");
      expect(scan.websiteId).toBe("website-1");
      expect(scan.status).toBe(ScanStatus.PENDING);
    });

    it("should default pagesFound to 0", () => {
      const scan = makeScan();
      expect(scan.pagesFound).toBe(0);
    });

    it("should default pagesCrawled to 0", () => {
      const scan = makeScan();
      expect(scan.pagesCrawled).toBe(0);
    });

    it("should default error to null", () => {
      const scan = makeScan();
      expect(scan.error).toBeNull();
    });

    it("should default startedAt to null", () => {
      const scan = makeScan();
      expect(scan.startedAt).toBeNull();
    });

    it("should default finishedAt to null", () => {
      const scan = makeScan();
      expect(scan.finishedAt).toBeNull();
    });

    it("should set createdAt and updatedAt when provided", () => {
      const now = new Date("2026-01-01");
      const scan = makeScan({ createdAt: now, updatedAt: now });
      expect(scan.createdAt).toEqual(now);
      expect(scan.updatedAt).toEqual(now);
    });
  });

  describe("start", () => {
    it("should transition from PENDING to RUNNING", () => {
      const scan = makeScan();
      const started = scan.start();
      expect(started.status).toBe(ScanStatus.RUNNING);
    });

    it("should record startedAt timestamp", () => {
      const scan = makeScan();
      const started = scan.start();
      expect(started.startedAt).not.toBeNull();
      expect(started.startedAt!.getTime()).toBeGreaterThanOrEqual(
        scan.createdAt.getTime(),
      );
    });

    it("should not mutate the original entity", () => {
      const scan = makeScan();
      scan.start();
      expect(scan.status).toBe(ScanStatus.PENDING);
    });
  });

  describe("complete", () => {
    it("should transition from RUNNING to COMPLETED", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      const completed = scan.complete();
      expect(completed.status).toBe(ScanStatus.COMPLETED);
    });

    it("should record finishedAt timestamp", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      const completed = scan.complete();
      expect(completed.finishedAt).not.toBeNull();
    });

    it("should not mutate the original entity", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      scan.complete();
      expect(scan.status).toBe(ScanStatus.RUNNING);
    });
  });

  describe("fail", () => {
    it("should transition from RUNNING to FAILED", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      const failed = scan.fail("Something went wrong");
      expect(failed.status).toBe(ScanStatus.FAILED);
    });

    it("should store the error message", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      const failed = scan.fail("Timeout error");
      expect(failed.error).toBe("Timeout error");
    });

    it("should record finishedAt timestamp", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      const failed = scan.fail("Error");
      expect(failed.finishedAt).not.toBeNull();
    });
  });

  describe("cancel", () => {
    it("should transition from PENDING to CANCELLED", () => {
      const scan = makeScan();
      const cancelled = scan.cancel();
      expect(cancelled.status).toBe(ScanStatus.CANCELLED);
    });

    it("should transition from RUNNING to CANCELLED", () => {
      const scan = makeScan({ status: ScanStatus.RUNNING });
      const cancelled = scan.cancel();
      expect(cancelled.status).toBe(ScanStatus.CANCELLED);
    });

    it("should record finishedAt timestamp", () => {
      const scan = makeScan();
      const cancelled = scan.cancel();
      expect(cancelled.finishedAt).not.toBeNull();
    });
  });

  describe("incrementPagesFound", () => {
    it("should increment the pagesFound count", () => {
      const scan = makeScan();
      const updated = scan.incrementPagesFound();
      expect(updated.pagesFound).toBe(1);
    });

    it("should increment multiple times", () => {
      const scan = makeScan();
      const updated = scan.incrementPagesFound().incrementPagesFound();
      expect(updated.pagesFound).toBe(2);
    });

    it("should not mutate the original entity", () => {
      const scan = makeScan();
      scan.incrementPagesFound();
      expect(scan.pagesFound).toBe(0);
    });
  });

  describe("incrementPagesCrawled", () => {
    it("should increment the pagesCrawled count", () => {
      const scan = makeScan();
      const updated = scan.incrementPagesCrawled();
      expect(updated.pagesCrawled).toBe(1);
    });

    it("should increment multiple times", () => {
      const scan = makeScan();
      const updated = scan.incrementPagesCrawled().incrementPagesCrawled();
      expect(updated.pagesCrawled).toBe(2);
    });

    it("should not mutate the original entity", () => {
      const scan = makeScan();
      scan.incrementPagesCrawled();
      expect(scan.pagesCrawled).toBe(0);
    });
  });

  describe("invalid state transitions", () => {
    it("should throw from PENDING to COMPLETED", () => {
      const scan = makeScan();
      expect(() => scan.complete()).toThrow(InvalidScanTransitionError);
    });

    it("should throw from PENDING to FAILED", () => {
      const scan = makeScan();
      expect(() => scan.fail("error")).toThrow(InvalidScanTransitionError);
    });

    it("should throw from COMPLETED to RUNNING", () => {
      const scan = makeScan({
        status: ScanStatus.COMPLETED,
        startedAt: new Date(),
        finishedAt: new Date(),
      });
      expect(() => scan.start()).toThrow(InvalidScanTransitionError);
    });

    it("should throw from COMPLETED to FAILED", () => {
      const scan = makeScan({
        status: ScanStatus.COMPLETED,
        startedAt: new Date(),
        finishedAt: new Date(),
      });
      expect(() => scan.fail("error")).toThrow(InvalidScanTransitionError);
    });

    it("should throw from FAILED to RUNNING", () => {
      const scan = makeScan({
        status: ScanStatus.FAILED,
        error: "error",
        startedAt: new Date(),
        finishedAt: new Date(),
      });
      expect(() => scan.start()).toThrow(InvalidScanTransitionError);
    });

    it("should throw from CANCELLED to RUNNING", () => {
      const scan = makeScan({
        status: ScanStatus.CANCELLED,
        startedAt: new Date(),
        finishedAt: new Date(),
      });
      expect(() => scan.start()).toThrow(InvalidScanTransitionError);
    });

    it("should include the transition details in the error message", () => {
      const scan = makeScan();
      expect(() => scan.complete()).toThrow(
        "Cannot transition scan from PENDING to COMPLETED",
      );
    });
  });
});
