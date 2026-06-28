import { describe, it, expect, vi, beforeEach } from "vitest";
import { SitemapService } from "@/crawler/sitemap/service";
import { HttpClient } from "@/shared/http/http-client";
import { type CrawlerContext } from "@/crawler/core/crawler-context";
import { type CrawlConfig } from "@/crawler/core/crawl-config";

/* ──────────────── Helpers ──────────────── */

function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createMockHttpClient() {
  return { get: vi.fn() };
}

function createContext(
  logger: ReturnType<typeof createMockLogger>,
  httpClient: ReturnType<typeof createMockHttpClient>,
  config?: Partial<CrawlConfig>,
): CrawlerContext {
  return {
    logger,
    httpClient: httpClient as unknown as HttpClient,
    config: {
      maxDepth: config?.maxDepth ?? 3,
      maxSitemaps: config?.maxSitemaps ?? 50,
      maxUrls: config?.maxUrls ?? 100_000,
    },
    baseUrl: "https://example.com",
  };
}

function createService(
  logger: ReturnType<typeof createMockLogger>,
  httpClient: ReturnType<typeof createMockHttpClient>,
  config?: Partial<CrawlConfig>,
): SitemapService {
  const ctx = createContext(logger, httpClient, config);
  return new SitemapService(ctx);
}

/* ──────────────── Fixtures ──────────────── */

const URLSET_A = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><lastmod>2024-01-15</lastmod></url>
  <url><loc>https://example.com/about</loc><changefreq>monthly</changefreq></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>`;

const URLSET_B = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/blog</loc></url>
  <url><loc>https://example.com/pricing</loc></url>
</urlset>`;

const URLSET_DUP = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/extra</loc></url>
</urlset>`;

const SITEMAP_INDEX = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-a.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-b.xml</loc></sitemap>
</sitemapindex>`;

const NESTED_INDEX = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sub-index.xml</loc></sitemap>
</sitemapindex>`;

const SUB_INDEX = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-a.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-b.xml</loc></sitemap>
</sitemapindex>`;

const INVALID_XML = "this is not XML";

/* ──────────────── Suite ──────────────── */

describe("SitemapService", () => {
  let logger: ReturnType<typeof createMockLogger>;
  let httpClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    logger = createMockLogger();
    httpClient = createMockHttpClient();
  });

  /* ── Standard urlset ── */

  describe("standard sitemap", () => {
    it("should return entries from a single urlset sitemap", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A,
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]!.loc).toBe("https://example.com/");
      expect(result.entries[1]!.loc).toBe("https://example.com/about");
      expect(result.entries[2]!.loc).toBe("https://example.com/contact");
      expect(result.sitemapsProcessed).toBe(1);
      expect(result.urlsDiscovered).toBe(3);
    });

    it("should preserve metadata from parsed entries", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A,
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries[0]!.lastmod).toBe("2024-01-15");
      expect(result.entries[1]!.changefreq).toBe("monthly");
      expect(result.entries[2]!.priority).toBeNull();
    });
  });

  /* ── Sitemap index ── */

  describe("sitemap index recursion", () => {
    it("should recursively download child sitemaps and merge entries", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (url === "https://example.com/sitemap.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: SITEMAP_INDEX,
          };
        }
        if (url === "https://example.com/sitemap-a.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_A,
          };
        }
        if (url === "https://example.com/sitemap-b.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_B,
          };
        }
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      // 3 from URLSET_A + 2 from URLSET_B = 5
      expect(result.entries).toHaveLength(5);
      expect(result.sitemapsProcessed).toBe(3); // index + 2 children
      expect(result.urlsDiscovered).toBe(5);
    });

    it("should skip child sitemaps that fail to download", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (url === "https://example.com/sitemap.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: SITEMAP_INDEX,
          };
        }
        if (url === "https://example.com/sitemap-a.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_A,
          };
        }
        // sitemap-b.xml fails
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      // Only URLSET_A's 3 entries
      expect(result.entries).toHaveLength(3);
    });
  });

  /* ── Nested sitemap indexes ── */

  describe("nested sitemap indexes", () => {
    it("should handle multi-level index recursion", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (url === "https://example.com/sitemap.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: NESTED_INDEX,
          };
        }
        if (url === "https://example.com/sub-index.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: SUB_INDEX,
          };
        }
        if (url === "https://example.com/sitemap-a.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_A,
          };
        }
        if (url === "https://example.com/sitemap-b.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_B,
          };
        }
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toHaveLength(5);
      expect(result.sitemapsProcessed).toBe(4); // top index + sub-index + 2 children
    });
  });

  /* ── Duplicate URLs ── */

  describe("duplicate URL deduplication", () => {
    it("should deduplicate URLs across different sitemaps", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (url === "https://example.com/sitemap.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: SITEMAP_INDEX,
          };
        }
        // Both children contain the root URL + extras
        if (
          url === "https://example.com/sitemap-a.xml" ||
          url === "https://example.com/sitemap-b.xml"
        ) {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_DUP,
          };
        }
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      // URLSET_DUP has 2 URLs: / and /extra
      // Duplicated across 2 children → only 2 unique
      expect(result.entries).toHaveLength(2);
    });
  });

  /* ── Invalid XML ── */

  describe("invalid XML handling", () => {
    it("should return empty result for invalid XML", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: INVALID_XML,
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toEqual([]);
      expect(result.sitemapsProcessed).toBe(1); // attempted to parse
      expect(result.urlsDiscovered).toBe(0);
    });
  });

  /* ── Invalid URLs ── */

  describe("invalid URLs in sitemap", () => {
    it("should filter out entries with non-HTTP URLs", async () => {
      const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/valid</loc></url>
        <url><loc>ftp://example.com/file</loc></url>
        <url><loc>javascript:alert(1)</loc></url>
        <url><loc>not-a-url</loc></url>
      </urlset>`;

      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: xml,
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.loc).toBe("https://example.com/valid");
    });
  });

  /* ── Empty sitemap ── */

  describe("empty sitemap", () => {
    it("should return empty result for empty sitemap content", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: "",
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      // Download succeeded but body is empty — zero URLs, zero sitemaps processed
      expect(result.entries).toEqual([]);
      expect(result.sitemapsProcessed).toBe(0);
      expect(result.urlsDiscovered).toBe(0);
    });
  });

  /* ── Download failure ── */

  describe("download failure", () => {
    it("should return empty result when sitemap cannot be downloaded", async () => {
      httpClient.get.mockResolvedValue({
        status: 404,
        headers: new Headers(),
        data: "",
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toEqual([]);
      expect(result.sitemapsProcessed).toBe(0);
      expect(result.urlsDiscovered).toBe(0);
    });
  });

  /* ── Limit enforcement ── */

  describe("limit enforcement", () => {
    it("should enforce maximum recursion depth", async () => {
      // Build a chain of indexes: level 0 → level 1 → level 2 → level 3
      httpClient.get.mockImplementation(async (url: string) => {
        if (url.includes("sitemap-index-")) {
          const level = Number(url.match(/sitemap-index-(\d+)/)![1]!);
          const nextLevel = level + 1;
          return {
            status: 200,
            headers: new Headers(),
            data: `<?xml version="1.0"?>
              <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <sitemap><loc>https://example.com/sitemap-index-${nextLevel}.xml</loc></sitemap>
              </sitemapindex>`,
          };
        }
        // urlset at the leaf
        return {
          status: 200,
          headers: new Headers(),
          data: URLSET_A,
        };
      });

      const service = createService(logger, httpClient, { maxDepth: 2 });
      const result = await service.discover(
        "https://example.com/sitemap-index-0.xml",
      );

      expect(result.urlsDiscovered).toBe(0);
      expect(result.sitemapsProcessed).toBe(3); // 3 indexes (depths 0, 1, 2)
    });

    it("should enforce maximum sitemap count", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        // Return a urlset for any URL, each with a unique page
        const page = url.replace("sitemap", "page");
        return {
          status: 200,
          headers: new Headers(),
          data: `<urlset xmlns="..."><url><loc>${page}</loc></url></urlset>`,
        };
      });

      const service = createService(logger, httpClient, { maxSitemaps: 2 });
      const result = await service.discover(
        "https://example.com/sitemap-1.xml",
      );

      // sitemap-1 (processed), sitemap-2 (processed) → limit reached before sitemap-3
      expect(result.sitemapsProcessed).toBe(1); // only 1 urlset downloaded
      expect(result.entries).toHaveLength(1); // 1 entry from the first urlset
    });

    it("should enforce maximum URL count", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A, // 3 URLs
      });

      const service = createService(logger, httpClient, { maxUrls: 2 });
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toHaveLength(2);
      expect(result.urlsDiscovered).toBe(2);
    });

    it("should log when limits are exceeded", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A,
      });

      const service = createService(logger, httpClient, { maxUrls: 1 });
      await service.discover("https://example.com/sitemap.xml");

      expect(logger.info).toHaveBeenCalledWith(
        "URL limit reached — stopping discovery",
        expect.anything(),
      );
    });
  });

  /* ── Service configuration ── */

  describe("configuration", () => {
    it("should use default limits when no config is provided", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A,
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      // Should work with defaults
      expect(result.entries).toHaveLength(3);
    });

    it("should accept partial config overrides", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A,
      });

      const service = createService(logger, httpClient, { maxUrls: 100 });
      const result = await service.discover("https://example.com/sitemap.xml");

      expect(result.entries).toHaveLength(3);
    });
  });

  /* ── Sitemap URL deduplication ── */

  describe("sitemap URL deduplication", () => {
    it("should not process the same child sitemap twice", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (url === "https://example.com/sitemap.xml") {
          // Index referencing the same child twice
          return {
            status: 200,
            headers: new Headers(),
            data: `<?xml version="1.0"?>
              <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <sitemap><loc>https://example.com/child.xml</loc></sitemap>
                <sitemap><loc>https://example.com/child.xml</loc></sitemap>
              </sitemapindex>`,
          };
        }
        if (url === "https://example.com/child.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_A,
          };
        }
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      const result = await service.discover("https://example.com/sitemap.xml");

      // child.xml only processed once
      expect(result.entries).toHaveLength(3);
      expect(result.sitemapsProcessed).toBe(2); // index + 1 child (deduped)
    });

    it("should not process the same sitemap URL twice even when called with different paths that resolve to the same URL", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (
          url === "https://example.com/index.xml" ||
          url === "https://example.com/./index.xml"
        ) {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_A,
          };
        }
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      // Call discover twice with equivalent URLs
      await service.discover("https://example.com/index.xml");
      const result = await service.discover("https://example.com/./index.xml");

      // Second call should still work since state is per-call
      expect(result.entries).toHaveLength(3);
    });
  });

  /* ── Logging ── */

  describe("logging", () => {
    it("should log the discovery lifecycle", async () => {
      httpClient.get.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: URLSET_A,
      });

      const service = createService(logger, httpClient);
      await service.discover("https://example.com/sitemap.xml");

      expect(logger.info).toHaveBeenCalledWith(
        "sitemap download started",
        expect.anything(),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "sitemap download succeeded",
        expect.anything(),
      );
      expect(logger.info).toHaveBeenCalledWith(
        "sitemap urls discovered",
        expect.anything(),
      );
    });

    it("should log nested sitemap discovery", async () => {
      httpClient.get.mockImplementation(async (url: string) => {
        if (url === "https://example.com/sitemap.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: SITEMAP_INDEX,
          };
        }
        if (url === "https://example.com/sitemap-a.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_A,
          };
        }
        if (url === "https://example.com/sitemap-b.xml") {
          return {
            status: 200,
            headers: new Headers(),
            data: URLSET_B,
          };
        }
        return { status: 404, headers: new Headers(), data: "" };
      });

      const service = createService(logger, httpClient);
      await service.discover("https://example.com/sitemap.xml");

      expect(logger.info).toHaveBeenCalledWith(
        "sitemap index discovered — recursing",
        expect.anything(),
      );
    });
  });
});
