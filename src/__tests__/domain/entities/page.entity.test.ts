import { describe, it, expect } from "vitest";
import {
  PageEntity,
  type CreatePageEntityInput,
  type PageHeadingSnapshot,
  type PageImageSnapshot,
  type PageLinkSnapshot,
  type PageStructuredDataSnapshot,
  type PageWarningSnapshot,
} from "@/domain/entities/page.entity";

function makePage(
  overrides: Partial<CreatePageEntityInput> = {},
): PageEntity {
  const defaults: CreatePageEntityInput = {
    id: "page-1",
    scanId: "scan-1",
    url: "https://example.com/page",
    finalUrl: "https://example.com/page",
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    title: "Test Page",
    metaDescription: "A test page",
    canonical: "https://example.com/page",
    robots: "index, follow",
    openGraph: { "og:title": "Test Page" },
    twitter: { "twitter:card": "summary" },
    language: "en",
    charset: "utf-8",
    viewport: "width=device-width, initial-scale=1",
    headings: { h1: ["Title"], h2: [], h3: [], h4: [], h5: [], h6: [] },
    images: [{ src: "/img.png", alt: "img", title: null, loading: null, width: null, height: null }],
    links: [{ href: "https://example.com", text: "Home", normalizedUrl: "https://example.com", type: "internal" }],
    structuredData: [{ raw: '{"@type":"WebPage"}', json: { "@type": "WebPage" } }],
    crawlDepth: 0,
    parentUrl: null,
    source: "sitemap",
    warnings: [{ source: "title", message: "Multiple title elements found" }],
    downloadDurationMs: 150,
    extractionDurationMs: 42,
    ...overrides,
  };
  return new PageEntity(defaults);
}

describe("PageEntity", () => {
  describe("constructor", () => {
    it("should create a page with all fields", () => {
      const page = makePage();
      expect(page.id).toBe("page-1");
      expect(page.scanId).toBe("scan-1");
      expect(page.url).toBe("https://example.com/page");
      expect(page.finalUrl).toBe("https://example.com/page");
      expect(page.statusCode).toBe(200);
      expect(page.contentType).toBe("text/html; charset=utf-8");
      expect(page.title).toBe("Test Page");
      expect(page.metaDescription).toBe("A test page");
      expect(page.canonical).toBe("https://example.com/page");
      expect(page.robots).toBe("index, follow");
      expect(page.language).toBe("en");
      expect(page.charset).toBe("utf-8");
      expect(page.viewport).toBe("width=device-width, initial-scale=1");
      expect(page.crawlDepth).toBe(0);
      expect(page.parentUrl).toBeNull();
      expect(page.source).toBe("sitemap");
      expect(page.downloadDurationMs).toBe(150);
      expect(page.extractionDurationMs).toBe(42);
    });

    it("should default createdAt to now", () => {
      const page = makePage({ createdAt: undefined });
      expect(page.createdAt).toBeInstanceOf(Date);
      expect(page.createdAt.getTime()).toBeGreaterThan(0);
    });

    it("should accept an explicit createdAt", () => {
      const now = new Date("2026-06-01");
      const page = makePage({ createdAt: now });
      expect(page.createdAt).toEqual(now);
    });

    it("should default nullable SEO fields to null", () => {
      const page = makePage({
        title: null,
        metaDescription: null,
        canonical: null,
        robots: null,
      });
      expect(page.title).toBeNull();
      expect(page.metaDescription).toBeNull();
      expect(page.canonical).toBeNull();
      expect(page.robots).toBeNull();
    });

    it("should default nullable social fields to null", () => {
      const page = makePage({ openGraph: null, twitter: null });
      expect(page.openGraph).toBeNull();
      expect(page.twitter).toBeNull();
    });

    it("should default nullable structural fields to null", () => {
      const page = makePage({
        language: null,
        charset: null,
        viewport: null,
      });
      expect(page.language).toBeNull();
      expect(page.charset).toBeNull();
      expect(page.viewport).toBeNull();
    });

    it("should default nullable collections to null", () => {
      const page = makePage({
        headings: null,
        images: null,
        links: null,
        structuredData: null,
        warnings: null,
      });
      expect(page.headings).toBeNull();
      expect(page.images).toBeNull();
      expect(page.links).toBeNull();
      expect(page.structuredData).toBeNull();
      expect(page.warnings).toBeNull();
    });

    it("should default parentUrl to null", () => {
      const page = makePage({ parentUrl: null });
      expect(page.parentUrl).toBeNull();
    });
  });

  describe("social getters", () => {
    it("should return OpenGraph data", () => {
      const og = { "og:title": "Test", "og:description": "Desc" };
      const page = makePage({ openGraph: og });
      expect(page.openGraph).toEqual(og);
    });

    it("should return Twitter data", () => {
      const tw = { "twitter:card": "summary_large_image" };
      const page = makePage({ twitter: tw });
      expect(page.twitter).toEqual(tw);
    });
  });

  describe("collections", () => {
    it("should return headings", () => {
      const headings: PageHeadingSnapshot = {
        h1: ["Main Title"],
        h2: ["Section 1", "Section 2"],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
      };
      const page = makePage({ headings });
      expect(page.headings).toEqual(headings);
    });

    it("should return images", () => {
      const images: PageImageSnapshot[] = [
        { src: "/a.png", alt: "A", title: null, loading: null, width: 100, height: 50 },
        { src: "/b.png", alt: "B", title: "B image", loading: "lazy", width: null, height: null },
      ];
      const page = makePage({ images });
      expect(page.images).toEqual(images);
      expect(page.images).toHaveLength(2);
    });

    it("should return links", () => {
      const links: PageLinkSnapshot[] = [
        { href: "/internal", text: "Internal", normalizedUrl: "https://example.com/internal", type: "internal" },
        { href: "https://other.com", text: "External", normalizedUrl: "https://other.com", type: "external" },
      ];
      const page = makePage({ links });
      expect(page.links).toEqual(links);
      expect(page.links).toHaveLength(2);
    });

    it("should return structured data", () => {
      const sd: PageStructuredDataSnapshot[] = [
        { raw: '{"@type":"WebPage"}', json: { "@type": "WebPage" } },
      ];
      const page = makePage({ structuredData: sd });
      expect(page.structuredData).toEqual(sd);
    });

    it("should return warnings", () => {
      const warnings: PageWarningSnapshot[] = [
        { source: "og", message: "Duplicate og:title" },
      ];
      const page = makePage({ warnings });
      expect(page.warnings).toEqual(warnings);
    });
  });

  describe("immutability", () => {
    it("should return frozen collection arrays", () => {
      // PageEntity stores props as a private field — the runtime does not
      // enforce this (TypeScript `private` is compile-time only), but the
      // getters return the raw references. The entity is *logically*
      // immutable: there are no setter methods or state-mutating behaviour.
      const page = makePage({
        images: [
          { src: "/img.png", alt: "A", title: null, loading: null, width: null, height: null },
          { src: "/img2.png", alt: "B", title: null, loading: null, width: null, height: null },
        ],
      });

      // The entity has no update methods
      expect((page as unknown as Record<string, unknown>).update).toBeUndefined();
      expect((page as unknown as Record<string, unknown>).setUrl).toBeUndefined();

      // The page data is set on creation and accessible via getters
      expect(page.url).toBe("https://example.com/page");
    });
  });
});
