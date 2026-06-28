import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { GetScanDashboardPagesUseCase } from "@/application/scan/use-cases/get-scan-dashboard-pages.use-case";
import { type IPageRepository } from "@/domain/repositories/page.repository";
import {
  type FindScanPagesPaginatedResult,
  type PageWithScoreItem,
} from "@/domain/repositories/page.repository";
import { PageEntity } from "@/domain/entities/page.entity";
import { PageScoreEntity } from "@/domain/entities/page-score.entity";
import { ValidationError } from "@/application/common/errors";

const validUuid = "00000000-0000-0000-0000-000000000001";

function createMockPageRepo(): Mocked<IPageRepository> {
  return {
    create: vi.fn(),
    createMany: vi.fn(),
    findByScan: vi.fn(),
    findByUrl: vi.fn(),
    findByScanPaginated: vi.fn(),
  };
}

function makePage(url: string): PageEntity {
  return new PageEntity({
    id: crypto.randomUUID(),
    scanId: validUuid,
    url,
    finalUrl: url,
    statusCode: 200,
    contentType: "text/html",
    crawlDepth: 0,
    source: "sitemap",
    downloadDurationMs: 0,
    extractionDurationMs: 0,
  });
}

function makeScore(pageId: string, score: number): PageScoreEntity {
  return new PageScoreEntity({
    id: crypto.randomUUID(),
    pageId,
    scanId: validUuid,
    overallScore: score,
    categoryScores: [
      { category: "title", label: "Title Tag", score: 100, weight: 0.15, weightedScore: 15, maxWeightedScore: 15 },
    ],
    deductions: [],
    recommendations: [],
    scoredAt: new Date(),
  });
}

describe("GetScanDashboardPagesUseCase", () => {
  let pageRepo: Mocked<IPageRepository>;
  let useCase: GetScanDashboardPagesUseCase;

  beforeEach(() => {
    pageRepo = createMockPageRepo();
    useCase = new GetScanDashboardPagesUseCase(pageRepo);
  });

  it("should return paginated pages with scores", async () => {
    const pages = [makePage("https://example.com/a"), makePage("https://example.com/b")];
    const items: PageWithScoreItem[] = pages.map((p) => ({
      page: p,
      score: makeScore(p.id, 85),
    }));

    const repoResult: FindScanPagesPaginatedResult = {
      items,
      total: 2,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };

    pageRepo.findByScanPaginated.mockResolvedValue(repoResult);

    const result = await useCase.execute({ scanId: validUuid });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items[0]!.score).not.toBeNull();
    expect(result.items[0]!.score!.overallScore).toBe(85);
    expect(result.items[0]!.url).toBe("https://example.com/a");
    expect(pageRepo.findByScanPaginated).toHaveBeenCalledOnce();
  });

  it("should return pages without scores when scoring not yet done", async () => {
    const page = makePage("https://example.com/no-score");
    const items: PageWithScoreItem[] = [{ page, score: null }];

    const repoResult: FindScanPagesPaginatedResult = {
      items,
      total: 1,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };

    pageRepo.findByScanPaginated.mockResolvedValue(repoResult);

    const result = await useCase.execute({ scanId: validUuid });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.score).toBeNull();
    expect(result.items[0]!.hasStructuredData).toBe(false);
  });

  it("should pass filter parameters to repository", async () => {
    pageRepo.findByScanPaginated.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
    });

    await useCase.execute({
      scanId: validUuid,
      page: 2,
      pageSize: 10,
      sortBy: "score",
      sortDir: "desc",
      minScore: 50,
      maxScore: 100,
      indexability: "indexable",
      missingTitle: true,
    });

    expect(pageRepo.findByScanPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        scanId: validUuid,
        page: 2,
        pageSize: 10,
        sortBy: "score",
        sortDir: "desc",
        minScore: 50,
        maxScore: 100,
        indexability: "indexable",
        missingTitle: true,
      }),
    );
  });

  it("should apply default pagination when not specified", async () => {
    pageRepo.findByScanPaginated.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
    });

    await useCase.execute({ scanId: validUuid });

    expect(pageRepo.findByScanPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 25,
        sortBy: "url",
        sortDir: "asc",
      }),
    );
  });

  it("should return empty result when no pages exist", async () => {
    pageRepo.findByScanPaginated.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
    });

    const result = await useCase.execute({ scanId: validUuid });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("should throw ValidationError for invalid scanId", async () => {
    await expect(
      useCase.execute({ scanId: "bad-uuid" }),
    ).rejects.toThrow(ValidationError);
    expect(pageRepo.findByScanPaginated).not.toHaveBeenCalled();
  });

  it("should serialize hasOpenGraph and hasStructuredData correctly", async () => {
    const pageWithOg = new PageEntity({
      id: "page-og",
      scanId: validUuid,
      url: "https://example.com/og",
      finalUrl: "https://example.com/og",
      statusCode: 200,
      contentType: "text/html",
      openGraph: { "og:title": "Test" },
      structuredData: [{ raw: "{}", json: {} }],
      crawlDepth: 0,
      source: "sitemap",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    });

    const pageWithoutOg = new PageEntity({
      id: "page-no-og",
      scanId: validUuid,
      url: "https://example.com/no-og",
      finalUrl: "https://example.com/no-og",
      statusCode: 200,
      contentType: "text/html",
      openGraph: null,
      structuredData: null,
      crawlDepth: 0,
      source: "sitemap",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    });

    pageRepo.findByScanPaginated.mockResolvedValue({
      items: [
        { page: pageWithOg, score: null },
        { page: pageWithoutOg, score: null },
      ],
      total: 2,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    });

    const result = await useCase.execute({ scanId: validUuid });

    expect(result.items[0]!.hasOpenGraph).toBe(true);
    expect(result.items[0]!.hasStructuredData).toBe(true);
    expect(result.items[1]!.hasOpenGraph).toBe(false);
    expect(result.items[1]!.hasStructuredData).toBe(false);
  });
});
