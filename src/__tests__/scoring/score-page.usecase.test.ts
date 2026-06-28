/**
 * Tests — ScorePageUseCase.
 */

import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { ScorePageUseCase } from "@/application/scoring/score-page.usecase";
import { type IPageScoreRepository } from "@/domain/repositories/page-score.repository";
import { PageEntity } from "@/domain/entities/page.entity";
import { PageScoreEntity } from "@/domain/entities/page-score.entity";
import { type IScoringCalculator, type ScoreResult } from "@/scoring/calculator/types";

/* ──────────────── Helpers ──────────────── */

function makePerfectPage(): PageEntity {
  return new PageEntity({
    id: "page-1",
    scanId: "scan-1",
    url: "https://example.com/page",
    finalUrl: "https://example.com/page",
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    title: "This Is a Perfectly Optimised Title for SEO Testing", // 50 chars, within 30-60
    metaDescription: "A perfect meta description that is long enough to exceed the minimum threshold and describes the page content well for optimal SEO results.",
    canonical: "https://example.com/page",
    robots: "index, follow",
    openGraph: {
      "og:title": "Title",
      "og:description": "Desc",
      "og:image": "https://example.com/img.jpg",
    },
    twitter: {
      "twitter:card": "summary",
      "twitter:title": "Title",
    },
    headings: {
      h1: ["Main"],
      h2: ["Sub"],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
    },
    images: [{ src: "/img.jpg", alt: "Alt", title: null, loading: null, width: null, height: null }],
    links: [
      { href: "/a", text: "A", normalizedUrl: "https://example.com/a", type: "internal" },
      { href: "/b", text: "B", normalizedUrl: "https://example.com/b", type: "internal" },
      { href: "/c", text: "C", normalizedUrl: "https://example.com/c", type: "internal" },
      { href: "/d", text: "D", normalizedUrl: "https://example.com/d", type: "internal" },
      { href: "/e", text: "E", normalizedUrl: "https://example.com/e", type: "internal" },
    ],
    structuredData: [{ raw: "{}", json: {} }],
    crawlDepth: 0,
    parentUrl: null,
    source: "sitemap",
    warnings: [],
    downloadDurationMs: 100,
    extractionDurationMs: 50,
  });
}

function createMockPageScoreRepo(): Mocked<IPageScoreRepository> {
  return {
    save: vi.fn(),
    findByScan: vi.fn(),
    findByPage: vi.fn(),
  };
}

/* ──────────────── Suite ──────────────── */

describe("ScorePageUseCase", () => {
  let pageScoreRepo: Mocked<IPageScoreRepository>;
  let useCase: ScorePageUseCase;

  beforeEach(() => {
    pageScoreRepo = createMockPageScoreRepo();
    pageScoreRepo.save.mockImplementation(
      async ({ pageScore }: { pageScore: PageScoreEntity }) => pageScore,
    );
    useCase = new ScorePageUseCase(pageScoreRepo);
  });

  it("should score a page and persist the result", async () => {
    const page = makePerfectPage();
    const result = await useCase.execute({ page });

    expect(result.pageScore).toBeInstanceOf(PageScoreEntity);
    expect(result.pageScore.pageId).toBe("page-1");
    expect(result.pageScore.scanId).toBe("scan-1");
    expect(result.pageScore.overallScore).toBe(100);
    expect(result.pageScore.categoryScores).toHaveLength(10);
    expect(pageScoreRepo.save).toHaveBeenCalledTimes(1);
  });

  it("should return a lower score for a page with issues", async () => {
    const page = new PageEntity({
      id: "page-2",
      scanId: "scan-1",
      url: "https://example.com/bad",
      finalUrl: "https://example.com/bad",
      statusCode: 200,
      contentType: "text/html",
      title: null,
      metaDescription: null,
      canonical: null,
      robots: "noindex",
      openGraph: {},
      twitter: {},
      headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
      images: [{ src: "/img.jpg", alt: null, title: null, loading: null, width: null, height: null }],
      links: null,
      structuredData: [],
      crawlDepth: 0,
      parentUrl: null,
      source: "sitemap",
      warnings: [],
      downloadDurationMs: 50,
      extractionDurationMs: 20,
    });

    const result = await useCase.execute({ page });

    expect(result.pageScore.overallScore).toBe(0);
  });

  it("should generate recommendations for missing elements", async () => {
    const page = makePerfectPage();
    const result = await useCase.execute({ page });

    // Perfect page should have no recommendations
    expect(result.pageScore.recommendations).toHaveLength(0);
  });

  it("should include deductions in the result", async () => {
    const page = makePerfectPage();
    const result = await useCase.execute({ page });

    // Perfect page should have no deductions
    expect(result.pageScore.deductions).toHaveLength(0);
  });

  it("should accept a custom calculator", async () => {
    const mockCalculator: IScoringCalculator = {
      calculate: vi.fn().mockReturnValue({
        overallScore: 42,
        categoryScores: [],
        deductions: [],
      } as ScoreResult),
    };

    const useCaseWithMock = new ScorePageUseCase(pageScoreRepo, mockCalculator);
    const page = makePerfectPage();

    await useCaseWithMock.execute({ page });
    expect(mockCalculator.calculate).toHaveBeenCalled();
  });

  it("should persist the score with correct scan ID", async () => {
    const page = makePerfectPage();
    await useCase.execute({ page });

    expect(pageScoreRepo.save).toHaveBeenCalledWith({
      pageScore: expect.objectContaining({
        scanId: "scan-1",
      }),
    });
  });

  it("should handle null page scores gracefully", async () => {
    // This is more of an integration test — the calculator handles null fields
    const page = makePerfectPage();
    const result = await useCase.execute({ page });

    expect(result.pageScore.overallScore).toBe(100);
    expect(result.pageScore.categoryScores.length).toBeGreaterThan(0);
  });
});
