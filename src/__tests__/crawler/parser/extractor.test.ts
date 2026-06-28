import { describe, it, expect, vi, beforeEach } from "vitest";
import { HtmlParser } from "@/crawler/parser/parser";
import { SeoExtractor } from "@/crawler/parser/extractor";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import { type HttpClient } from "@/shared/http/http-client";

/* ──────────────── Helpers ──────────────── */

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createContext(
  logger: ReturnType<typeof createMockLogger>,
): CrawlerContext {
  return {
    logger,
    httpClient: {} as unknown as HttpClient,
    config: { maxDepth: 3, maxSitemaps: 50, maxUrls: 100_000 },
    baseUrl: "https://example.com",
  };
}

/* ──────────────── Suite ──────────────── */

describe("HtmlParser", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let ctx: CrawlerContext;

  beforeEach(() => {
    logger = createMockLogger();
    ctx = createContext(logger);
  });

  it("should parse HTML into a CheerioAPI instance", () => {
    const parser = new HtmlParser(ctx);
    const $ = parser.parse("<html><body><p>Hello</p></body></html>");
    expect($).toBeDefined();
    expect($("p").text()).toBe("Hello");
  });

  it("should handle empty HTML", () => {
    const parser = new HtmlParser(ctx);
    const $ = parser.parse("");
    expect($).toBeDefined();
  });

  it("should handle malformed HTML", () => {
    const parser = new HtmlParser(ctx);
    const $ = parser.parse("<p>unclosed");
    expect($).toBeDefined();
    expect($("p").text()).toBe("unclosed");
  });

  it("should log start and complete", () => {
    const parser = new HtmlParser(ctx);
    parser.parse("<html></html>");
    expect(logger.info).toHaveBeenCalledWith("HTML parser started", expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith("HTML parser complete", expect.any(Object));
  });
});

describe("SeoExtractor", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let ctx: CrawlerContext;
  let parser: HtmlParser;
  let extractor: SeoExtractor;

  beforeEach(() => {
    logger = createMockLogger();
    ctx = createContext(logger);
    parser = new HtmlParser(ctx);
    extractor = new SeoExtractor(ctx);
  });

  /* ── Empty HTML ── */

  describe("empty HTML", () => {
    it("should return default values for empty HTML", () => {
      const $ = parser.parse("");
      const result = extractor.extract($);

      expect(result.document.title).toBeNull();
      expect(result.document.language).toBeNull();
      expect(result.document.charset).toBeNull();
      expect(result.document.viewport).toBeNull();
      expect(result.meta.description).toBeNull();
      expect(result.meta.robots).toBeNull();
      expect(result.canonical.url).toBeNull();
      expect(result.headings.h1).toEqual([]);
      expect(result.images).toEqual([]);
      expect(result.internalLinks).toEqual([]);
      expect(result.externalLinks).toEqual([]);
      expect(result.structuredData).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.stats.totalImages).toBe(0);
    });

    it("should have all stats at zero for empty HTML", () => {
      const $ = parser.parse("");
      const result = extractor.extract($);
      expect(result.stats).toEqual({
        totalImages: 0,
        totalInternalLinks: 0,
        totalExternalLinks: 0,
        totalStructuredData: 0,
        totalHeadings: 0,
      });
    });
  });

  /* ── Malformed HTML ── */

  describe("malformed HTML", () => {
    it("should handle malformed HTML without throwing", () => {
      const $ = parser.parse("<div><p>unclosed<div>nested");
      const result = extractor.extract($);
      expect(result.document.title).toBeNull();
    });
  });

  /* ── Title ── */

  describe("title", () => {
    it("should extract a single title", () => {
      const $ = parser.parse("<html><head><title>My Page</title></head></html>");
      const result = extractor.extract($);
      expect(result.document.title).toBe("My Page");
    });

    it("should return null when title is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.document.title).toBeNull();
    });

    it("should use first title and warn when multiple titles exist", () => {
      const $ = parser.parse(`
        <html><head>
          <title>First Title</title>
          <title>Second Title</title>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.document.title).toBe("First Title");
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some((w) => w.source === "title")).toBe(true);
    });

    it("should trim whitespace from title", () => {
      const $ = parser.parse("<html><head><title>  Spaced Title  </title></head></html>");
      const result = extractor.extract($);
      expect(result.document.title).toBe("Spaced Title");
    });
  });

  /* ── Language ── */

  describe("language", () => {
    it("should extract lang attribute from html element", () => {
      const $ = parser.parse('<html lang="en"><head></head></html>');
      const result = extractor.extract($);
      expect(result.document.language).toBe("en");
    });

    it("should return null when lang attribute is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.document.language).toBeNull();
    });
  });

  /* ── Charset ── */

  describe("charset", () => {
    it("should extract charset from meta charset tag", () => {
      const $ = parser.parse('<html><head><meta charset="utf-8"></head></html>');
      const result = extractor.extract($);
      expect(result.document.charset).toBe("utf-8");
    });

    it("should extract charset from legacy http-equiv", () => {
      const $ = parser.parse(
        '<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"></head></html>',
      );
      const result = extractor.extract($);
      expect(result.document.charset).toBe("iso-8859-1");
    });

    it("should return null when charset is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.document.charset).toBeNull();
    });
  });

  /* ── Viewport ── */

  describe("viewport", () => {
    it("should extract viewport meta tag content", () => {
      const $ = parser.parse(
        '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head></html>',
      );
      const result = extractor.extract($);
      expect(result.document.viewport).toBe("width=device-width, initial-scale=1");
    });

    it("should return null when viewport is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.document.viewport).toBeNull();
    });
  });

  /* ── Meta ── */

  describe("meta description", () => {
    it("should extract meta description", () => {
      const $ = parser.parse(
        '<html><head><meta name="description" content="A great page"></head></html>',
      );
      const result = extractor.extract($);
      expect(result.meta.description).toBe("A great page");
    });

    it("should return null when description is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.meta.description).toBeNull();
    });
  });

  describe("meta robots", () => {
    it("should extract robots meta tag", () => {
      const $ = parser.parse(
        '<html><head><meta name="robots" content="noindex, nofollow"></head></html>',
      );
      const result = extractor.extract($);
      expect(result.meta.robots).toBe("noindex, nofollow");
    });

    it("should return null when robots is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.meta.robots).toBeNull();
    });
  });

  /* ── Canonical ── */

  describe("canonical", () => {
    it("should extract canonical URL", () => {
      const $ = parser.parse(
        '<html><head><link rel="canonical" href="https://example.com/page"></head></html>',
      );
      const result = extractor.extract($);
      expect(result.canonical.url).toBe("https://example.com/page");
    });

    it("should return null when canonical is missing", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(result.canonical.url).toBeNull();
    });
  });

  /* ── OpenGraph ── */

  describe("OpenGraph", () => {
    it("should extract og:title and og:description", () => {
      const $ = parser.parse(`
        <html><head>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/image.jpg">
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.openGraph["og:title"]).toBe("OG Title");
      expect(result.openGraph["og:description"]).toBe("OG Description");
      expect(result.openGraph["og:image"]).toBe("https://example.com/image.jpg");
    });

    it("should warn about duplicate og: properties", () => {
      const $ = parser.parse(`
        <html><head>
          <meta property="og:title" content="First">
          <meta property="og:title" content="Second">
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.openGraph["og:title"]).toBe("First");
      expect(result.warnings.some((w) => w.source === "open-graph")).toBe(true);
    });

    it("should return empty object when no og tags exist", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(Object.keys(result.openGraph)).toHaveLength(0);
    });
  });

  /* ── Twitter ── */

  describe("Twitter", () => {
    it("should extract twitter:card and twitter:site", () => {
      const $ = parser.parse(`
        <html><head>
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:site" content="@example">
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.twitter["twitter:card"]).toBe("summary_large_image");
      expect(result.twitter["twitter:site"]).toBe("@example");
    });

    it("should warn about duplicate twitter: properties", () => {
      const $ = parser.parse(`
        <html><head>
          <meta name="twitter:card" content="summary">
          <meta name="twitter:card" content="summary_large_image">
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.twitter["twitter:card"]).toBe("summary");
      expect(result.warnings.some((w) => w.source === "twitter")).toBe(true);
    });

    it("should return empty object when no twitter tags exist", () => {
      const $ = parser.parse("<html><head></head></html>");
      const result = extractor.extract($);
      expect(Object.keys(result.twitter)).toHaveLength(0);
    });
  });

  /* ── Headings ── */

  describe("headings", () => {
    it("should extract all heading levels", () => {
      const $ = parser.parse(`
        <body>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <h6>Heading 6</h6>
        </body>
      `);
      const result = extractor.extract($);
      expect(result.headings.h1).toEqual(["Heading 1"]);
      expect(result.headings.h2).toEqual(["Heading 2"]);
      expect(result.headings.h3).toEqual(["Heading 3"]);
      expect(result.headings.h4).toEqual(["Heading 4"]);
      expect(result.headings.h5).toEqual(["Heading 5"]);
      expect(result.headings.h6).toEqual(["Heading 6"]);
    });

    it("should extract multiple H1 elements and count them correctly", () => {
      const $ = parser.parse(`
        <body>
          <h1>First H1</h1>
          <h1>Second H1</h1>
        </body>
      `);
      const result = extractor.extract($);
      expect(result.headings.h1).toEqual(["First H1", "Second H1"]);
      expect(result.stats.totalHeadings).toBe(2);
    });

    it("should return empty arrays when no headings exist", () => {
      const $ = parser.parse("<body></body>");
      const result = extractor.extract($);
      expect(result.headings.h1).toEqual([]);
      expect(result.headings.h2).toEqual([]);
      expect(result.stats.totalHeadings).toBe(0);
    });
  });

  /* ── Images ── */

  describe("images", () => {
    it("should extract image src and alt attributes", () => {
      const $ = parser.parse(
        '<body><img src="https://example.com/photo.jpg" alt="A photo"></body>',
      );
      const result = extractor.extract($);
      expect(result.images).toHaveLength(1);
      expect(result.images[0]!.src).toBe("https://example.com/photo.jpg");
      expect(result.images[0]!.alt).toBe("A photo");
    });

    it("should extract image title, loading, width, height", () => {
      const $ = parser.parse(
        '<body><img src="pic.jpg" alt="" title="My Image" loading="lazy" width="800" height="600"></body>',
      );
      const result = extractor.extract($);
      const img = result.images[0]!;
      expect(img.title).toBe("My Image");
      expect(img.loading).toBe("lazy");
      expect(img.width).toBe(800);
      expect(img.height).toBe(600);
    });

    it("should deduplicate images with the same src", () => {
      const $ = parser.parse(`
        <body>
          <img src="https://example.com/logo.png" alt="Logo">
          <img src="https://example.com/logo.png" alt="Logo again">
        </body>
      `);
      const result = extractor.extract($);
      expect(result.images).toHaveLength(1);
    });

    it("should include images without alt text", () => {
      const $ = parser.parse('<body><img src="photo.jpg"></body>');
      const result = extractor.extract($);
      expect(result.images).toHaveLength(1);
      expect(result.images[0]!.alt).toBeNull();
    });

    it("should report correct image count in stats", () => {
      const $ = parser.parse(`
        <body>
          <img src="a.jpg">
          <img src="b.jpg">
        </body>
      `);
      const result = extractor.extract($);
      expect(result.stats.totalImages).toBe(2);
    });
  });

  /* ── Links ── */

  describe("internal links", () => {
    it("should extract internal links", () => {
      const $ = parser.parse(`
        <body>
          <a href="https://example.com/about">About</a>
          <a href="https://example.com/contact">Contact</a>
        </body>
      `);
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(2);
      expect(result.internalLinks[0]!.href).toBe("https://example.com/about");
      expect(result.internalLinks[1]!.href).toBe("https://example.com/contact");
      expect(result.stats.totalInternalLinks).toBe(2);
    });

    it("should treat www.example.com as internal", () => {
      const $ = parser.parse(
        '<body><a href="https://www.example.com/page">Page</a></body>',
      );
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(1);
    });

    it("should normalize internal link URLs", () => {
      const $ = parser.parse(
        '<body><a href="https://Example.COM/Page">Page</a></body>',
      );
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(1);
      expect(result.internalLinks[0]!.normalizedUrl).toBe("https://example.com/Page");
    });
  });

  describe("external links", () => {
    it("should extract external links", () => {
      const $ = parser.parse(`
        <body>
          <a href="https://other.com/page">External</a>
          <a href="https://example.org">Org</a>
        </body>
      `);
      const result = extractor.extract($);
      expect(result.externalLinks).toHaveLength(2);
      expect(result.stats.totalExternalLinks).toBe(2);
    });

    it("should handle relative URLs by resolving against baseUrl", () => {
      const $ = parser.parse('<body><a href="/about">About</a></body>');
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(1);
      expect(result.internalLinks[0]!.normalizedUrl).toBe("https://example.com/about");
    });

    it("should handle absolute URLs without hostname as internal", () => {
      const $ = parser.parse('<body><a href="/path">Path</a></body>');
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(1);
    });
  });

  describe("link skipping", () => {
    it("should skip mailto links", () => {
      const $ = parser.parse(
        '<body><a href="mailto:user@example.com">Email</a></body>',
      );
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(0);
      expect(result.externalLinks).toHaveLength(0);
    });

    it("should skip tel links", () => {
      const $ = parser.parse(
        '<body><a href="tel:+1234567890">Call</a></body>',
      );
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(0);
      expect(result.externalLinks).toHaveLength(0);
    });

    it("should skip javascript links", () => {
      const $ = parser.parse(
        '<body><a href="javascript:void(0)">JS</a></body>',
      );
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(0);
      expect(result.externalLinks).toHaveLength(0);
    });

    it("should skip fragment-only links", () => {
      const $ = parser.parse(
        '<body><a href="#section">Section</a></body>',
      );
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(0);
      expect(result.externalLinks).toHaveLength(0);
    });

    it("should skip empty hrefs", () => {
      const $ = parser.parse('<body><a href="">Empty</a></body>');
      const result = extractor.extract($);
      // Empty href resolves to baseUrl
      expect(result.internalLinks).toHaveLength(0);
    });
  });

  describe("link deduplication", () => {
    it("should deduplicate links with the same normalized URL", () => {
      const $ = parser.parse(`
        <body>
          <a href="https://example.com/page">Page 1</a>
          <a href="https://EXAMPLE.COM/page">Page 2</a>
        </body>
      `);
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(1);
    });

    it("should treat http and https as different normalized URLs", () => {
      const $ = parser.parse(`
        <body>
          <a href="https://example.com/page">HTTPS</a>
          <a href="http://example.com/page">HTTP</a>
        </body>
      `);
      const result = extractor.extract($);
      expect(result.internalLinks).toHaveLength(2);
    });
  });

  /* ── JSON-LD Structured Data ── */

  describe("JSON-LD structured data", () => {
    it("should extract valid JSON-LD", () => {
      const $ = parser.parse(`
        <html><head>
          <script type="application/ld+json">
            {"@context": "https://schema.org", "@type": "WebPage", "name": "Test"}
          </script>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.structuredData).toHaveLength(1);
      expect(result.structuredData[0]!.json).toBeDefined();
      expect((result.structuredData[0]!.json as Record<string, unknown>)["@type"]).toBe("WebPage");
      expect(result.stats.totalStructuredData).toBe(1);
    });

    it("should extract multiple JSON-LD blocks", () => {
      const $ = parser.parse(`
        <html><head>
          <script type="application/ld+json">{"@type": "WebPage"}</script>
          <script type="application/ld+json">{"@type": "Organization"}</script>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.structuredData).toHaveLength(2);
    });

    it("should handle invalid JSON-LD with a warning", () => {
      const $ = parser.parse(`
        <html><head>
          <script type="application/ld+json">
            { invalid json }
          </script>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.structuredData).toHaveLength(1);
      expect(result.structuredData[0]!.json).toBeNull();
      expect(result.structuredData[0]!.raw).toContain("invalid json");
      expect(result.warnings.some((w) => w.source === "json-ld")).toBe(true);
    });

    it("should skip empty JSON-LD blocks", () => {
      const $ = parser.parse(`
        <html><head>
          <script type="application/ld+json"></script>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.structuredData).toHaveLength(0);
    });

    it("should handle JSON-LD array format", () => {
      const $ = parser.parse(`
        <html><head>
          <script type="application/ld+json">
            [{"@type": "WebPage"}, {"@type": "BreadcrumbList"}]
          </script>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.structuredData).toHaveLength(1);
      expect(Array.isArray(result.structuredData[0]!.json)).toBe(true);
    });

    it("should not extract non-JSON-LD scripts", () => {
      const $ = parser.parse(`
        <html><head>
          <script>alert("hello");</script>
          <script type="application/javascript">console.log("test");</script>
        </head></html>
      `);
      const result = extractor.extract($);
      expect(result.structuredData).toHaveLength(0);
    });
  });

  /* ── Full page extraction ── */

  describe("full page extraction", () => {
    it("should extract all SEO metadata from a complete HTML document", () => {
      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Une page test">
  <meta name="robots" content="index, follow">
  <title>Page de Test</title>
  <link rel="canonical" href="https://example.com/page">
  <meta property="og:title" content="OG Title">
  <meta property="og:description" content="OG Desc">
  <meta property="og:image" content="https://example.com/og-image.jpg">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:site" content="@test">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>
</head>
<body>
  <h1>Main Title</h1>
  <h2>Section 1</h2>
  <h2>Section 2</h2>
  <h3>Subsection</h3>
  <img src="https://example.com/hero.jpg" alt="Hero" width="1200" height="600" loading="eager">
  <img src="https://example.com/icon.png" alt="Icon" width="32" height="32">
  <a href="https://example.com/about">About Us</a>
  <a href="https://example.com/contact">Contact</a>
  <a href="https://external.com/page">External</a>
</body>
</html>`;

      const $ = parser.parse(html);
      const result = extractor.extract($);

      // Document
      expect(result.document.title).toBe("Page de Test");
      expect(result.document.language).toBe("fr");
      expect(result.document.charset).toBe("utf-8");
      expect(result.document.viewport).toBe("width=device-width, initial-scale=1");

      // Meta
      expect(result.meta.description).toBe("Une page test");
      expect(result.meta.robots).toBe("index, follow");

      // Canonical
      expect(result.canonical.url).toBe("https://example.com/page");

      // OpenGraph
      expect(result.openGraph["og:title"]).toBe("OG Title");
      expect(result.openGraph["og:description"]).toBe("OG Desc");
      expect(result.openGraph["og:image"]).toBe("https://example.com/og-image.jpg");

      // Twitter
      expect(result.twitter["twitter:card"]).toBe("summary");
      expect(result.twitter["twitter:site"]).toBe("@test");

      // Headings
      expect(result.headings.h1).toEqual(["Main Title"]);
      expect(result.headings.h2).toEqual(["Section 1", "Section 2"]);
      expect(result.headings.h3).toEqual(["Subsection"]);
      expect(result.headings.h4).toEqual([]);

      // Images
      expect(result.images).toHaveLength(2);
      expect(result.images[0]!.src).toBe("https://example.com/hero.jpg");
      expect(result.images[0]!.alt).toBe("Hero");
      expect(result.images[0]!.width).toBe(1200);

      // Links
      expect(result.internalLinks).toHaveLength(2);
      expect(result.externalLinks).toHaveLength(1);

      // Structured data
      expect(result.structuredData).toHaveLength(1);

      // Stats
      expect(result.stats).toEqual({
        totalImages: 2,
        totalInternalLinks: 2,
        totalExternalLinks: 1,
        totalStructuredData: 1,
        totalHeadings: 4,
      });
    });
  });

  /* ── Result immutability ── */

  describe("immutability", () => {
    it("should return frozen objects", () => {
      const $ = parser.parse("<html><body><h1>Title</h1></body></html>");
      const result = extractor.extract($);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.document)).toBe(true);
      expect(Object.isFrozen(result.stats)).toBe(true);
    });
  });

  /* ── Logging ── */

  describe("logging", () => {
    it("should log extraction start and complete", () => {
      const $ = parser.parse("<html></html>");
      extractor.extract($);
      expect(logger.info).toHaveBeenCalledWith("SEO extraction started");
      expect(logger.info).toHaveBeenCalledWith(
        "SEO extraction complete",
        expect.objectContaining({ totalImages: 0, totalInternalLinks: 0, totalExternalLinks: 0 }),
      );
    });

    it("should log warnings", () => {
      const $ = parser.parse(
        '<html><head><title>A</title><title>B</title></head></html>',
      );
      extractor.extract($);
      expect(logger.warn).toHaveBeenCalledWith("SEO extraction warning", {
        source: "title",
        message: expect.stringContaining("<title>"),
      });
    });
  });

  /* ── Warnings ── */

  describe("warnings array", () => {
    it("should collect multiple warnings across extraction areas", () => {
      const $ = parser.parse(`
        <html><head>
          <title>T1</title><title>T2</title>
          <meta property="og:title" content="A">
          <meta property="og:title" content="B">
          <script type="application/ld+json">{invalid}</script>
        </head></html>
      `);
      const result = extractor.extract($);
      const sources = result.warnings.map((w) => w.source);
      expect(sources).toContain("title");
      expect(sources).toContain("open-graph");
      expect(sources).toContain("json-ld");
    });
  });

  /* ── Result completeness ── */

  describe("result shape", () => {
    it("should have all required top-level keys", () => {
      const $ = parser.parse("<html></html>");
      const result = extractor.extract($);
      const keys = Object.keys(result);
      expect(keys).toContain("document");
      expect(keys).toContain("meta");
      expect(keys).toContain("canonical");
      expect(keys).toContain("openGraph");
      expect(keys).toContain("twitter");
      expect(keys).toContain("headings");
      expect(keys).toContain("images");
      expect(keys).toContain("internalLinks");
      expect(keys).toContain("externalLinks");
      expect(keys).toContain("structuredData");
      expect(keys).toContain("warnings");
      expect(keys).toContain("stats");
    });
  });

  /* ── Non-HTTP links ── */

  describe("non-HTTP links", () => {
    it("should include ftp links as external with null normalizedUrl", () => {
      const $ = parser.parse(
        '<body><a href="ftp://files.example.com/file">Download</a></body>',
      );
      const result = extractor.extract($);
      expect(result.externalLinks).toHaveLength(1);
      expect(result.externalLinks[0]!.normalizedUrl).toBeNull();
    });
  });
});
