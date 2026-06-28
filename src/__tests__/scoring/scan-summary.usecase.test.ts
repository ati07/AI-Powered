/**
 * Tests — ScanSummaryUseCase.
 */

import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { ScanSummaryUseCase } from "@/application/scoring/scan-summary.usecase";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type IPageScoreRepository } from "@/domain/repositories/page-score.repository";
import { PageScoreEntity } from "@/domain/entities/page-score.entity";
import { ScanEntity, ScanStatus } from "@/domain/entities/scan.entity";
import { NotFoundError, ValidationError } from "@/application/common/errors";

/* ──────────────── UUIDs ──────────────── */

const SCAN_ID = "00000000-0000-0000-0000-000000000001";
const WEBSITE_ID = "00000000-0000-0000-0000-000000000010";

/* ──────────────── Helpers ──────────────── */

function makePageScore(
  overrides?: Partial<ConstructorParameters<typeof PageScoreEntity>[0]>,
): PageScoreEntity {
  return new PageScoreEntity({
    id: overrides?.id ?? "00000000-0000-0000-0000-000000000100",
    pageId: overrides?.pageId ?? "00000000-0000-0000-0000-000000000101",
    scanId: overrides?.scanId ?? SCAN_ID,
    overallScore: overrides?.overallScore ?? 75,
    categoryScores: overrides?.categoryScores ?? [],
    deductions: overrides?.deductions ?? [],
    recommendations: overrides?.recommendations ?? [],
    scoredAt: overrides?.scoredAt ?? new Date(),
  });
}

function makeScan(): ScanEntity {
  return new ScanEntity({
    id: SCAN_ID,
    websiteId: WEBSITE_ID,
    status: ScanStatus.COMPLETED,
    startedAt: null,
    finishedAt: null,
    pagesFound: 0,
    pagesCrawled: 0,
    pagesFailed: 0,
    error: null,
  });
}

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

function createMockPageScoreRepo(): Mocked<IPageScoreRepository> {
  return {
    save: vi.fn(),
    findByScan: vi.fn(),
    findByPage: vi.fn(),
  };
}

/* ──────────────── Suite ──────────────── */

describe("ScanSummaryUseCase", () => {
  let scanRepo: Mocked<IScanRepository>;
  let pageScoreRepo: Mocked<IPageScoreRepository>;
  let useCase: ScanSummaryUseCase;

  beforeEach(() => {
    scanRepo = createMockScanRepo();
    pageScoreRepo = createMockPageScoreRepo();
    useCase = new ScanSummaryUseCase(scanRepo, pageScoreRepo);
  });

  it("should compute summary from multiple page scores", async () => {
    scanRepo.findById.mockResolvedValue(makeScan());
    pageScoreRepo.findByScan.mockResolvedValue([
      makePageScore({ overallScore: 80 }),
      makePageScore({
        overallScore: 90,
        id: "00000000-0000-0000-0000-000000000102",
        pageId: "00000000-0000-0000-0000-000000000201",
      }),
      makePageScore({
        overallScore: 70,
        id: "00000000-0000-0000-0000-000000000103",
        pageId: "00000000-0000-0000-0000-000000000202",
      }),
    ]);

    const result = await useCase.execute({ scanId: SCAN_ID });

    expect(result.averageScore).toBe(80); // (80 + 90 + 70) / 3
    expect(result.highestScore).toBe(90);
    expect(result.lowestScore).toBe(70);
    expect(result.pagesScored).toBe(3);
  });

  it("should persist the computed summary to the scan", async () => {
    const scan = makeScan();
    scanRepo.findById.mockResolvedValue(scan);
    pageScoreRepo.findByScan.mockResolvedValue([
      makePageScore({ overallScore: 100 }),
    ]);

    await useCase.execute({ scanId: SCAN_ID });

    expect(scanRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SCAN_ID,
        averageScore: 100,
        highestScore: 100,
        lowestScore: 100,
        pagesScored: 1,
      }),
    );
  });

  it("should return zeros when no scores exist", async () => {
    scanRepo.findById.mockResolvedValue(makeScan());
    pageScoreRepo.findByScan.mockResolvedValue([]);

    const result = await useCase.execute({ scanId: SCAN_ID });

    expect(result.averageScore).toBe(0);
    expect(result.highestScore).toBe(0);
    expect(result.lowestScore).toBe(0);
    expect(result.pagesScored).toBe(0);
  });

  it("should throw NotFoundError when scan does not exist", async () => {
    scanRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ scanId: "00000000-0000-0000-0000-000000099999" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError for invalid input", async () => {
    await expect(
      useCase.execute({ scanId: "not-a-uuid" }),
    ).rejects.toThrow(ValidationError);
  });

  it("should handle single page score", async () => {
    scanRepo.findById.mockResolvedValue(makeScan());
    pageScoreRepo.findByScan.mockResolvedValue([
      makePageScore({ overallScore: 85 }),
    ]);

    const result = await useCase.execute({ scanId: SCAN_ID });

    expect(result.averageScore).toBe(85);
    expect(result.highestScore).toBe(85);
    expect(result.lowestScore).toBe(85);
    expect(result.pagesScored).toBe(1);
  });

  it("should handle a large number of scores", async () => {
    const scores = Array.from({ length: 100 }, (_, i) =>
      makePageScore({
        overallScore: i + 1,
        id: `00000000-0000-0000-0000-00000000${String(i).padStart(4, "0")}`,
        pageId: `00000000-0000-0000-0000-00000001${String(i).padStart(4, "0")}`,
      }),
    );

    scanRepo.findById.mockResolvedValue(makeScan());
    pageScoreRepo.findByScan.mockResolvedValue(scores);

    const result = await useCase.execute({ scanId: SCAN_ID });

    // Sum 1..100 = 5050, /100 = 50.5, Math.round = 51
    expect(result.averageScore).toBe(51);
    expect(result.highestScore).toBe(100);
    expect(result.lowestScore).toBe(1);
    expect(result.pagesScored).toBe(100);
  });

  it("should average scores and round to integer", async () => {
    scanRepo.findById.mockResolvedValue(makeScan());
    pageScoreRepo.findByScan.mockResolvedValue([
      makePageScore({ overallScore: 10 }),
      makePageScore({
        overallScore: 11,
        id: "00000000-0000-0000-0000-000000000102",
        pageId: "00000000-0000-0000-0000-000000000201",
      }),
    ]);

    const result = await useCase.execute({ scanId: SCAN_ID });

    expect(result.averageScore).toBe(11); // (10 + 11) / 2 = 10.5 → rounds to 11
  });
});
