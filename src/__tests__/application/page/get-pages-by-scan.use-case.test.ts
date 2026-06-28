import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { GetPagesByScanUseCase } from "@/application/page/use-cases/get-pages-by-scan.use-case";
import { type IPageRepository } from "@/domain/repositories/page.repository";
import { PageEntity } from "@/domain/entities/page.entity";
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

describe("GetPagesByScanUseCase", () => {
  let pageRepo: Mocked<IPageRepository>;
  let useCase: GetPagesByScanUseCase;

  beforeEach(() => {
    pageRepo = createMockPageRepo();
    useCase = new GetPagesByScanUseCase(pageRepo);
  });

  it("should return all pages for a scan", async () => {
    const pages = [makePage("https://example.com/a"), makePage("https://example.com/b")];
    pageRepo.findByScan.mockResolvedValue(pages);

    const result = await useCase.execute({ scanId: validUuid });

    expect(result.pages).toHaveLength(2);
    expect(result.count).toBe(2);
    expect(pageRepo.findByScan).toHaveBeenCalledWith({ scanId: validUuid });
  });

  it("should return empty array when no pages exist", async () => {
    pageRepo.findByScan.mockResolvedValue([]);

    const result = await useCase.execute({ scanId: validUuid });

    expect(result.pages).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it("should throw ValidationError for invalid scanId", async () => {
    await expect(
      useCase.execute({ scanId: "bad-uuid" }),
    ).rejects.toThrow(ValidationError);
    expect(pageRepo.findByScan).not.toHaveBeenCalled();
  });
});
