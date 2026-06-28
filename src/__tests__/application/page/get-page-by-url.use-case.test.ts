import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { GetPageByUrlUseCase } from "@/application/page/use-cases/get-page-by-url.use-case";
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

describe("GetPageByUrlUseCase", () => {
  let pageRepo: Mocked<IPageRepository>;
  let useCase: GetPageByUrlUseCase;

  beforeEach(() => {
    pageRepo = createMockPageRepo();
    useCase = new GetPageByUrlUseCase(pageRepo);
  });

  it("should return a page when found", async () => {
    const page = new PageEntity({
      id: "page-1",
      scanId: validUuid,
      url: "https://example.com/page",
      finalUrl: "https://example.com/page",
      statusCode: 200,
      contentType: "text/html",
      crawlDepth: 0,
      source: "sitemap",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    });
    pageRepo.findByUrl.mockResolvedValue(page);

    const result = await useCase.execute({
      scanId: validUuid,
      url: "https://example.com/page",
    });

    expect(result.page).not.toBeNull();
    expect(result.page!.url).toBe("https://example.com/page");
    expect(result.page!.scanId).toBe(validUuid);
  });

  it("should return null when page is not found", async () => {
    pageRepo.findByUrl.mockResolvedValue(null);

    const result = await useCase.execute({
      scanId: validUuid,
      url: "https://example.com/missing",
    });

    expect(result.page).toBeNull();
  });

  it("should throw ValidationError for invalid scanId", async () => {
    await expect(
      useCase.execute({ scanId: "bad-uuid", url: "https://example.com/page" }),
    ).rejects.toThrow(ValidationError);
    expect(pageRepo.findByUrl).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for invalid URL", async () => {
    await expect(
      useCase.execute({ scanId: validUuid, url: "not-a-url" }),
    ).rejects.toThrow(ValidationError);
    expect(pageRepo.findByUrl).not.toHaveBeenCalled();
  });
});
