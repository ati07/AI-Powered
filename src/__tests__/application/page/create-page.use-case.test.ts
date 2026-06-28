import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { CreatePageUseCase } from "@/application/page/use-cases/create-page.use-case";
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

describe("CreatePageUseCase", () => {
  let pageRepo: Mocked<IPageRepository>;
  let useCase: CreatePageUseCase;

  beforeEach(() => {
    pageRepo = createMockPageRepo();
    useCase = new CreatePageUseCase(pageRepo);
  });

  it("should create a page with all fields", async () => {
    pageRepo.create.mockImplementation(async ({ page }) => page);

    const result = await useCase.execute({
      scanId: validUuid,
      url: "https://example.com/page",
      finalUrl: "https://example.com/page",
      statusCode: 200,
      contentType: "text/html; charset=utf-8",
      title: "Test Page",
      metaDescription: "A description",
      canonical: "https://example.com/page",
      robots: "index, follow",
      openGraph: { "og:title": "Test" },
      twitter: { "twitter:card": "summary" },
      language: "en",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      headings: { h1: ["Title"], h2: [], h3: [], h4: [], h5: [], h6: [] },
      images: [{ src: "/img.png", alt: "Img", title: null, loading: null, width: null, height: null }],
      links: [{ href: "/a", text: "A", normalizedUrl: "https://example.com/a", type: "internal" }],
      structuredData: [{ raw: "{}", json: {} }],
      crawlDepth: 0,
      parentUrl: null,
      source: "sitemap",
      warnings: [{ source: "title", message: "Multiple titles" }],
      downloadDurationMs: 150,
      extractionDurationMs: 42,
    });

    expect(result.page).toBeInstanceOf(PageEntity);
    expect(result.page.url).toBe("https://example.com/page");
    expect(result.page.statusCode).toBe(200);
    expect(result.page.title).toBe("Test Page");
    expect(result.page.crawlDepth).toBe(0);
    expect(result.page.source).toBe("sitemap");
    expect(result.page.downloadDurationMs).toBe(150);
    expect(result.page.extractionDurationMs).toBe(42);
    expect(pageRepo.create).toHaveBeenCalledOnce();
  });

  it("should create a minimal page (nullable fields omitted)", async () => {
    pageRepo.create.mockImplementation(async ({ page }) => page);

    const result = await useCase.execute({
      scanId: validUuid,
      url: "https://example.com/minimal",
      finalUrl: "https://example.com/minimal",
      statusCode: 200,
      contentType: "text/html",
      crawlDepth: 0,
      source: "homepage",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    });

    expect(result.page).toBeInstanceOf(PageEntity);
    expect(result.page.title).toBeNull();
    expect(result.page.openGraph).toBeNull();
    expect(result.page.headings).toBeNull();
    expect(result.page.parentUrl).toBeNull();
  });

  it("should throw ValidationError for invalid input", async () => {
    await expect(
      useCase.execute({
        scanId: "bad-uuid",
        url: "not-a-url",
        finalUrl: "also-bad",
        statusCode: -1,
        contentType: "",
        crawlDepth: -1,
        source: "",
        downloadDurationMs: -1,
        extractionDurationMs: -1,
      }),
    ).rejects.toThrow(ValidationError);

    expect(pageRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for missing required fields", async () => {
    // @ts-expect-error - testing missing required fields
    await expect(useCase.execute({})).rejects.toThrow(ValidationError);
    expect(pageRepo.create).not.toHaveBeenCalled();
  });

  it("should generate a UUID for the page", async () => {
    pageRepo.create.mockImplementation(async ({ page }) => page);

    const result = await useCase.execute({
      scanId: validUuid,
      url: "https://example.com/uuid",
      finalUrl: "https://example.com/uuid",
      statusCode: 200,
      contentType: "text/html",
      crawlDepth: 0,
      source: "homepage",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    });

    expect(result.page.id).toBeDefined();
    expect(result.page.id.length).toBeGreaterThan(0);
  });

  it("should return a PageEntity instance", async () => {
    pageRepo.create.mockImplementation(async ({ page }) => page);

    const result = await useCase.execute({
      scanId: validUuid,
      url: "https://example.com/entity",
      finalUrl: "https://example.com/entity",
      statusCode: 200,
      contentType: "text/html",
      crawlDepth: 0,
      source: "homepage",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    });

    expect(result.page).toBeInstanceOf(PageEntity);
  });
});
