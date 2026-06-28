import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { CreatePagesUseCase } from "@/application/page/use-cases/create-pages.use-case";
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

describe("CreatePagesUseCase", () => {
  let pageRepo: Mocked<IPageRepository>;
  let useCase: CreatePagesUseCase;

  beforeEach(() => {
    pageRepo = createMockPageRepo();
    useCase = new CreatePagesUseCase(pageRepo);
  });

  it("should create multiple pages in bulk", async () => {
    pageRepo.createMany.mockImplementation(async ({ pages }) => pages);

    const result = await useCase.execute({
      scanId: validUuid,
      pages: [
        {
          url: "https://example.com/a",
          finalUrl: "https://example.com/a",
          statusCode: 200,
          contentType: "text/html",
          title: "Page A",
          crawlDepth: 0,
          source: "sitemap",
          downloadDurationMs: 100,
          extractionDurationMs: 50,
        },
        {
          url: "https://example.com/b",
          finalUrl: "https://example.com/b",
          statusCode: 200,
          contentType: "text/html",
          title: "Page B",
          crawlDepth: 1,
          parentUrl: "https://example.com/a",
          source: "internal_link",
          downloadDurationMs: 80,
          extractionDurationMs: 30,
        },
        {
          url: "https://example.com/c",
          finalUrl: "https://example.com/c",
          statusCode: 200,
          contentType: "text/html",
          title: "Page C",
          crawlDepth: 2,
          source: "internal_link",
          downloadDurationMs: 60,
          extractionDurationMs: 20,
        },
      ],
    });

    expect(result.count).toBe(3);
    expect(result.pages).toHaveLength(3);
    expect(result.pages[0]!.url).toBe("https://example.com/a");
    expect(result.pages[1]!.url).toBe("https://example.com/b");
    expect(result.pages[2]!.crawlDepth).toBe(2);
    expect(pageRepo.createMany).toHaveBeenCalledOnce();
  });

  it("should throw ValidationError for empty pages array", async () => {
    await expect(
      useCase.execute({ scanId: validUuid, pages: [] }),
    ).rejects.toThrow(ValidationError);
    expect(pageRepo.createMany).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for invalid page data", async () => {
    await expect(
      useCase.execute({
        scanId: validUuid,
        pages: [
          {
            url: "not-a-url",
            finalUrl: "not-a-url",
            statusCode: -1,
            contentType: "",
            crawlDepth: -1,
            source: "",
            downloadDurationMs: -1,
            extractionDurationMs: -1,
          },
        ],
      }),
    ).rejects.toThrow(ValidationError);
    expect(pageRepo.createMany).not.toHaveBeenCalled();
  });

  it("should generate unique IDs for each page", async () => {
    pageRepo.createMany.mockImplementation(async ({ pages }) => pages);

    const result = await useCase.execute({
      scanId: validUuid,
      pages: [
        {
          url: "https://example.com/a",
          finalUrl: "https://example.com/a",
          statusCode: 200,
          contentType: "text/html",
          crawlDepth: 0,
          source: "sitemap",
          downloadDurationMs: 0,
          extractionDurationMs: 0,
        },
        {
          url: "https://example.com/b",
          finalUrl: "https://example.com/b",
          statusCode: 200,
          contentType: "text/html",
          crawlDepth: 0,
          source: "sitemap",
          downloadDurationMs: 0,
          extractionDurationMs: 0,
        },
      ],
    });

    expect(result.pages[0]!.id).not.toBe(result.pages[1]!.id);
  });

  it("should set the scanId on all created pages", async () => {
    pageRepo.createMany.mockImplementation(async ({ pages }) => pages);

    const result = await useCase.execute({
      scanId: validUuid,
      pages: [
        {
          url: "https://example.com/a",
          finalUrl: "https://example.com/a",
          statusCode: 200,
          contentType: "text/html",
          crawlDepth: 0,
          source: "sitemap",
          downloadDurationMs: 0,
          extractionDurationMs: 0,
        },
        {
          url: "https://example.com/b",
          finalUrl: "https://example.com/b",
          statusCode: 200,
          contentType: "text/html",
          crawlDepth: 0,
          source: "sitemap",
          downloadDurationMs: 0,
          extractionDurationMs: 0,
        },
      ],
    });

    expect(result.pages[0]!.scanId).toBe(validUuid);
    expect(result.pages[1]!.scanId).toBe(validUuid);
  });

  it("should return PageEntity instances", async () => {
    pageRepo.createMany.mockImplementation(async ({ pages }) => pages);

    const result = await useCase.execute({
      scanId: validUuid,
      pages: [
        {
          url: "https://example.com/a",
          finalUrl: "https://example.com/a",
          statusCode: 200,
          contentType: "text/html",
          crawlDepth: 0,
          source: "sitemap",
          downloadDurationMs: 0,
          extractionDurationMs: 0,
        },
      ],
    });

    expect(result.pages[0]).toBeInstanceOf(PageEntity);
  });
});
