import { describe, it, expect } from "vitest";
import {
  CreatePageInputSchema,
  CreatePagesInputSchema,
  GetPagesByScanInputSchema,
  GetPageByUrlInputSchema,
} from "@/application/page/page.schema";

const validUuid = "00000000-0000-0000-0000-000000000001";

function validPageInput() {
  return {
    scanId: validUuid,
    url: "https://example.com/page",
    finalUrl: "https://example.com/page",
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    title: "Test Page",
    metaDescription: "A test description",
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
    warnings: [],
    downloadDurationMs: 100,
    extractionDurationMs: 50,
  };
}

describe("CreatePageInputSchema", () => {
  it("should accept a valid complete page input", () => {
    const result = CreatePageInputSchema.safeParse(validPageInput());
    expect(result.success).toBe(true);
  });

  it("should accept a minimal page input (nullable fields omitted)", () => {
    const input = {
      scanId: validUuid,
      url: "https://example.com/page",
      finalUrl: "https://example.com/page",
      statusCode: 200,
      contentType: "text/html",
      crawlDepth: 0,
      source: "homepage",
      downloadDurationMs: 0,
      extractionDurationMs: 0,
    };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID scanId", () => {
    const input = { ...validPageInput(), scanId: "not-a-uuid" };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-URL url", () => {
    const input = { ...validPageInput(), url: "not-a-url" };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-positive statusCode", () => {
    const input = { ...validPageInput(), statusCode: -1 };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject negative crawlDepth", () => {
    const input = { ...validPageInput(), crawlDepth: -1 };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty source", () => {
    const input = { ...validPageInput(), source: "" };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty content type", () => {
    const input = { ...validPageInput(), contentType: "" };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject negative download duration", () => {
    const input = { ...validPageInput(), downloadDurationMs: -1 };
    const result = CreatePageInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("CreatePagesInputSchema", () => {
  it("should accept valid bulk input", () => {
    const input = {
      scanId: validUuid,
      pages: [
        {
          url: "https://example.com/a",
          finalUrl: "https://example.com/a",
          statusCode: 200,
          contentType: "text/html",
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
          crawlDepth: 1,
          parentUrl: "https://example.com/a",
          source: "internal_link",
          downloadDurationMs: 80,
          extractionDurationMs: 30,
        },
      ],
    };
    const result = CreatePagesInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty pages array", () => {
    const input = { scanId: validUuid, pages: [] };
    const result = CreatePagesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-UUID scanId", () => {
    const input = { scanId: "bad", pages: [{ url: "https://example.com/a", finalUrl: "https://example.com/a", statusCode: 200, contentType: "text/html", crawlDepth: 0, source: "sitemap", downloadDurationMs: 0, extractionDurationMs: 0 }] };
    const result = CreatePagesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("GetPagesByScanInputSchema", () => {
  it("should accept valid scanId", () => {
    const result = GetPagesByScanInputSchema.safeParse({ scanId: validUuid });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID scanId", () => {
    const result = GetPagesByScanInputSchema.safeParse({ scanId: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("GetPageByUrlInputSchema", () => {
  it("should accept valid input", () => {
    const result = GetPageByUrlInputSchema.safeParse({
      scanId: validUuid,
      url: "https://example.com/page",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID scanId", () => {
    const result = GetPageByUrlInputSchema.safeParse({
      scanId: "bad",
      url: "https://example.com/page",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-URL", () => {
    const result = GetPageByUrlInputSchema.safeParse({
      scanId: validUuid,
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
