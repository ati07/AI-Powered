import { describe, it, expect } from "vitest";
import { SitemapParser } from "@/crawler/sitemap/parser";

function parse(raw: string) {
  return new SitemapParser().parse(raw);
}

/* ──────────────── Fixtures ──────────────── */

const SIMPLE_URLSET = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://example.com/contact</loc>
  </url>
</urlset>`;

const SITEMAP_INDEX = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-images.xml</loc>
  </sitemap>
</sitemapindex>`;

describe("SitemapParser", () => {
  /* ── Empty / invalid ── */

  describe("empty input", () => {
    it("should return unknown for empty string", () => {
      const result = parse("");
      expect(result.type).toBe("unknown");
      expect(result.entries).toEqual([]);
      expect(result.childSitemaps).toEqual([]);
    });

    it("should return unknown for whitespace-only string", () => {
      const result = parse("   \n  \n  ");
      expect(result.type).toBe("unknown");
    });

    it("should return unknown for non-XML content", () => {
      const result = parse("this is not XML at all");
      expect(result.type).toBe("unknown");
    });
  });

  /* ── Urlset ── */

  describe("urlset parsing", () => {
    it("should parse a simple urlset sitemap", () => {
      const result = parse(SIMPLE_URLSET);

      expect(result.type).toBe("urlset");
      expect(result.entries).toHaveLength(3);
      expect(result.childSitemaps).toEqual([]);
    });

    it("should extract loc from each entry", () => {
      const result = parse(SIMPLE_URLSET);

      expect(result.entries[0]!.loc).toBe("https://example.com/");
      expect(result.entries[1]!.loc).toBe("https://example.com/about");
      expect(result.entries[2]!.loc).toBe("https://example.com/contact");
    });

    it("should extract lastmod when present", () => {
      const result = parse(SIMPLE_URLSET);

      expect(result.entries[0]!.lastmod).toBe("2024-01-15");
      expect(result.entries[1]!.lastmod).toBe("2024-01-10");
      expect(result.entries[2]!.lastmod).toBeNull();
    });

    it("should extract changefreq when present", () => {
      const result = parse(SIMPLE_URLSET);

      expect(result.entries[0]!.changefreq).toBe("daily");
      expect(result.entries[1]!.changefreq).toBe("monthly");
      expect(result.entries[2]!.changefreq).toBeNull();
    });

    it("should extract priority as a number when present", () => {
      const result = parse(SIMPLE_URLSET);

      expect(result.entries[0]!.priority).toBe(1.0);
      expect(result.entries[1]!.priority).toBeNull();
      expect(result.entries[2]!.priority).toBeNull();
    });
  });

  /* ── Sitemap index ── */

  describe("sitemap index parsing", () => {
    it("should parse a sitemap index", () => {
      const result = parse(SITEMAP_INDEX);

      expect(result.type).toBe("sitemapindex");
      expect(result.childSitemaps).toHaveLength(2);
      expect(result.entries).toEqual([]);
    });

    it("should extract loc from each child sitemap", () => {
      const result = parse(SITEMAP_INDEX);

      expect(result.childSitemaps[0]!.loc).toBe(
        "https://example.com/sitemap-pages.xml",
      );
      expect(result.childSitemaps[1]!.loc).toBe(
        "https://example.com/sitemap-images.xml",
      );
    });

    it("should extract lastmod when present", () => {
      const result = parse(SITEMAP_INDEX);

      expect(result.childSitemaps[0]!.lastmod).toBe("2024-01-15");
      expect(result.childSitemaps[1]!.lastmod).toBeNull();
    });
  });

  /* ── Priority edge cases ── */

  describe("priority parsing", () => {
    it("should parse decimal priorities", () => {
      const xml = `<urlset xmlns="..."><url><loc>https://example.com/</loc><priority>0.5</priority></url></urlset>`;
      const result = parse(xml);
      expect(result.entries[0]!.priority).toBe(0.5);
    });

    it("should parse integer priorities", () => {
      const xml = `<urlset xmlns="..."><url><loc>https://example.com/</loc><priority>1</priority></url></urlset>`;
      const result = parse(xml);
      expect(result.entries[0]!.priority).toBe(1);
    });

    it("should return null for non-numeric priority", () => {
      const xml = `<urlset xmlns="..."><url><loc>https://example.com/</loc><priority>abc</priority></url></urlset>`;
      const result = parse(xml);
      expect(result.entries[0]!.priority).toBeNull();
    });

    it("should return null for empty priority", () => {
      const xml = `<urlset xmlns="..."><url><loc>https://example.com/</loc><priority></priority></url></urlset>`;
      const result = parse(xml);
      expect(result.entries[0]!.priority).toBeNull();
    });
  });

  /* ── Duplicate entries ── */

  describe("duplicate <url> blocks", () => {
    it("should preserve duplicates (parser is format-aware, dedup is service-level)", () => {
      const xml = `<urlset xmlns="...">
        <url><loc>https://example.com/a</loc></url>
        <url><loc>https://example.com/a</loc></url>
      </urlset>`;
      const result = parse(xml);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]!.loc).toBe(result.entries[1]!.loc);
    });
  });

  /* ── Case insensitivity ── */

  describe("tag name case", () => {
    it("should handle uppercase tags", () => {
      const xml = "<URLSET><URL><LOC>https://example.com/</LOC></URL></URLSET>";
      const result = parse(xml);
      expect(result.type).toBe("urlset");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.loc).toBe("https://example.com/");
    });

    it("should handle mixed-case tags", () => {
      const xml =
        '<UrlSet><Url><Loc>https://example.com/</Loc></Url></UrlSet>';
      const result = parse(xml);
      expect(result.entries).toHaveLength(1);
    });
  });

  /* ── Malformed XML ── */

  describe("malformed XML", () => {
    it("should not throw on unclosed tags", () => {
      const xml = "<urlset><url><loc>https://example.com";
      expect(() => parse(xml)).not.toThrow();
    });

    it("should extract entries from partially valid XML", () => {
      const xml =
        '<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>';
      const result = parse(xml);
      expect(result.entries).toHaveLength(2);
    });

    it("should return unknown for completely malformed content", () => {
      const result = parse("=][;\n;;;\n;;;;");
      expect(result.type).toBe("unknown");
      expect(result.entries).toEqual([]);
    });
  });

  /* ── CDATA ── */

  describe("CDATA in loc", () => {
    it("should strip CDATA wrapper from loc value", () => {
      const xml = `<urlset xmlns="...">
        <url>
          <loc><![CDATA[https://example.com/cdata-page]]></loc>
        </url>
      </urlset>`;
      const result = parse(xml);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.loc).toBe("https://example.com/cdata-page");
    });
  });

  /* ── Comments ── */

  describe("XML comments", () => {
    it("should ignore XML comments between entries", () => {
      const xml = `<urlset xmlns="...">
        <url><loc>https://example.com/a</loc></url>
        <!-- this is a comment -->
        <url><loc>https://example.com/b</loc></url>
      </urlset>`;
      const result = parse(xml);
      expect(result.entries).toHaveLength(2);
    });
  });

  /* ── Whitespace ── */

  describe("whitespace handling", () => {
    it("should trim whitespace from loc values", () => {
      const xml = `<urlset xmlns="...">
        <url>
          <loc>
            https://example.com/whitespace
          </loc>
        </url>
      </urlset>`;
      const result = parse(xml);
      expect(result.entries[0]!.loc).toBe("https://example.com/whitespace");
    });
  });

  /* ── No <url> inside <sitemap> or vice versa ── */

  describe("format detection", () => {
    it("should return unknown when there are no url or sitemap blocks", () => {
      const xml = "<root><foo>bar</foo></root>";
      const result = parse(xml);
      expect(result.type).toBe("unknown");
    });
  });

  /* ── Prefix / namespace variants ── */

  describe("namespace prefixes", () => {
    it("should handle prefixed tags (xhtml-style)", () => {
      const xml =
        '<urlset xmlns:xs="http://www.w3.org/2001/XMLSchema"><url><loc>https://example.com/ns</loc></url></urlset>';
      const result = parse(xml);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.loc).toBe("https://example.com/ns");
    });
  });
});
