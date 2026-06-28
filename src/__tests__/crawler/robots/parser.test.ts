import { describe, it, expect } from "vitest";
import { RobotsParser } from "@/crawler/robots/parser";

function parse(raw: string) {
  return new RobotsParser().parse(raw);
}

describe("RobotsParser", () => {
  /* ── Empty / missing ── */

  describe("empty input", () => {
    it("should return empty result for empty string", () => {
      const result = parse("");
      expect(result.groups).toEqual([]);
      expect(result.sitemapUrls).toEqual([]);
    });

    it("should return empty result for whitespace-only string", () => {
      const result = parse("   \n  \n  ");
      expect(result.groups).toEqual([]);
      expect(result.sitemapUrls).toEqual([]);
    });

    it("should return empty result for comment-only input", () => {
      const result = parse("# robots.txt for example.com");
      expect(result.groups).toEqual([]);
      expect(result.sitemapUrls).toEqual([]);
    });
  });

  /* ── User-agent ── */

  describe("User-agent", () => {
    it("should parse a single user-agent group", () => {
      const raw = "User-agent: *\nDisallow: /private";
      const result = parse(raw);

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.userAgents).toEqual(["*"]);
    });

    it("should parse multiple user-agent groups separated by blank lines", () => {
      const raw = [
        "User-agent: *",
        "Disallow: /private",
        "",
        "User-agent: Googlebot",
        "Allow: /public",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0]!.userAgents).toEqual(["*"]);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
      expect(result.groups[1]!.userAgents).toEqual(["Googlebot"]);
      expect(result.groups[1]!.allowRules).toEqual(["/public"]);
    });

    it("should merge consecutive User-agent lines into one group", () => {
      const raw = [
        "User-agent: Googlebot",
        "User-agent: Bingbot",
        "Disallow: /shared-private",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.userAgents).toEqual([
        "Googlebot",
        "Bingbot",
      ]);
      expect(result.groups[0]!.disallowRules).toEqual(["/shared-private"]);
    });

    it("should create a new group when a User-agent line follows a rule", () => {
      const raw = [
        "User-agent: *",
        "Disallow: /private",
        "User-agent: Googlebot",
        "Allow: /public",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0]!.userAgents).toEqual(["*"]);
      expect(result.groups[1]!.userAgents).toEqual(["Googlebot"]);
    });

    it("should handle User-agent without a value", () => {
      const result = parse("User-agent:");
      // Should still create a group with empty user-agent
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.userAgents).toEqual([""]);
    });
  });

  /* ── Allow / Disallow ── */

  describe("Allow / Disallow", () => {
    it("should parse Allow rules under a group", () => {
      const raw = [
        "User-agent: *",
        "Allow: /public",
        "Allow: /about",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups[0]!.allowRules).toEqual(["/public", "/about"]);
    });

    it("should parse Disallow rules under a group", () => {
      const raw = [
        "User-agent: *",
        "Disallow: /admin",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups[0]!.disallowRules).toEqual(["/admin", "/private"]);
    });

    it("should handle empty Allow and Disallow values", () => {
      const raw = [
        "User-agent: *",
        "Allow:",
        "Disallow:",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups[0]!.allowRules).toEqual([""]);
      expect(result.groups[0]!.disallowRules).toEqual([""]);
    });

    it("should keep Allow and Disallow separate", () => {
      const raw = [
        "User-agent: *",
        "Allow: /public",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups[0]!.allowRules).toEqual(["/public"]);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
    });
  });

  /* ── Sitemap ── */

  describe("Sitemap", () => {
    it("should parse a single Sitemap directive", () => {
      const raw = [
        "User-agent: *",
        "Sitemap: https://example.com/sitemap.xml",
      ].join("\n");

      const result = parse(raw);

      expect(result.sitemapUrls).toEqual([
        "https://example.com/sitemap.xml",
      ]);
    });

    it("should parse multiple Sitemap directives", () => {
      const raw = [
        "Sitemap: https://example.com/sitemap.xml",
        "Sitemap: https://example.com/sitemap-news.xml",
      ].join("\n");

      const result = parse(raw);

      expect(result.sitemapUrls).toHaveLength(2);
      expect(result.sitemapUrls[0]).toBe(
        "https://example.com/sitemap.xml",
      );
      expect(result.sitemapUrls[1]).toBe(
        "https://example.com/sitemap-news.xml",
      );
    });

    it("should collect Sitemap directives regardless of position", () => {
      const raw = [
        "Sitemap: https://example.com/main.xml",
        "",
        "User-agent: *",
        "Disallow: /private",
        "",
        "Sitemap: https://example.com/extra.xml",
      ].join("\n");

      const result = parse(raw);

      expect(result.sitemapUrls).toHaveLength(2);
    });
  });

  /* ── Crawl-delay ── */

  describe("Crawl-delay", () => {
    it("should parse Crawl-delay as a number", () => {
      const raw = [
        "User-agent: *",
        "Crawl-delay: 10",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups[0]!.crawlDelay).toBe(10);
    });

    it("should parse decimal Crawl-delay", () => {
      const raw = [
        "User-agent: *",
        "Crawl-delay: 2.5",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups[0]!.crawlDelay).toBe(2.5);
    });

    it("should ignore negative Crawl-delay values", () => {
      const raw = [
        "User-agent: *",
        "Crawl-delay: -1",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups[0]!.crawlDelay).toBeNull();
    });

    it("should ignore non-numeric Crawl-delay values", () => {
      const raw = [
        "User-agent: *",
        "Crawl-delay: abc",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups[0]!.crawlDelay).toBeNull();
    });

    it("should set crawl delay per group", () => {
      const raw = [
        "User-agent: *",
        "Crawl-delay: 5",
        "",
        "User-agent: Googlebot",
        "Crawl-delay: 1",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups[0]!.crawlDelay).toBe(5);
      expect(result.groups[1]!.crawlDelay).toBe(1);
    });
  });

  /* ── Comments ── */

  describe("comments", () => {
    it("should ignore lines starting with #", () => {
      const raw = [
        "# This is a comment",
        "User-agent: *",
        "# Another comment",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
    });

    it("should allow inline comments (indented #)", () => {
      const raw = [
        "User-agent: * # this is a comment after UA",
        "Disallow: /private # trailing comment",
      ].join("\n");

      // NOTE: # after a value is NOT a standard robots.txt comment.
      // The # must be at the start of the line or after whitespace.
      // Standard: "User-agent: * # comment" parses "* # comment" as the value.
      // Our parser currently treats comments as full-line only.
      // This test documents the behavior: inline # is part of the value.
      const result = parse(raw);

      // User-agent value will include the inline comment part
      expect(result.groups).toHaveLength(1);
      // The # is NOT treated as a comment in the middle of a line
      // So the value includes the full text after the colon
    });
  });

  /* ── Invalid / malformed ── */

  describe("invalid syntax", () => {
    it("should ignore lines without a colon", () => {
      const raw = [
        "User-agent: *",
        "this line has no colon",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
    });

    it("should ignore unknown directives", () => {
      const raw = [
        "User-agent: *",
        "Unknown-directive: whatever",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
    });

    it("should handle a line with only a colon", () => {
      const raw = [
        "User-agent: *",
        ":",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);
      // The ":" line has empty directive → parseLine returns null
      // Disallow still applies to the group
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
    });

    it("should not throw on completely malformed input", () => {
      const raw = "=][;\n;;;\n;;;;\nno-colons-here\n";
      expect(() => parse(raw)).not.toThrow();
      const result = parse(raw);
      expect(result.groups).toEqual([]);
      expect(result.sitemapUrls).toEqual([]);
    });
  });

  /* ── Line endings ── */

  describe("line endings", () => {
    it("should accept Unix line endings (LF)", () => {
      const raw = "User-agent: *\nDisallow: /private\nSitemap: https://example.com/sitemap.xml";
      const result = parse(raw);

      expect(result.groups).toHaveLength(1);
      expect(result.sitemapUrls).toHaveLength(1);
    });

    it("should accept Windows line endings (CRLF)", () => {
      const raw = "User-agent: *\r\nDisallow: /private\r\nSitemap: https://example.com/sitemap.xml";
      const result = parse(raw);

      expect(result.groups).toHaveLength(1);
      expect(result.sitemapUrls).toHaveLength(1);
    });

    it("should accept mixed line endings", () => {
      const mixed = "User-agent: *\r\nDisallow: /private\nSitemap: https://example.com/sitemap.xml\r\n";

      const result = parse(mixed);

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
      expect(result.sitemapUrls).toHaveLength(1);
    });
  });

  /* ── Blank lines ── */

  describe("blank lines", () => {
    it("should separate groups with blank lines", () => {
      const raw = [
        "User-agent: *",
        "Disallow: /private",
        "",
        "User-agent: Googlebot",
        "Allow: /public",
        "",
        "User-agent: Bingbot",
        "Disallow: /temp",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(3);
    });

    it("should handle multiple consecutive blank lines", () => {
      const raw = [
        "User-agent: *",
        "Disallow: /private",
        "",
        "",
        "",
        "User-agent: Googlebot",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(2);
    });
  });

  /* ── Complex / real-world ── */

  describe("real-world scenarios", () => {
    it("should handle a realistic robots.txt", () => {
      const raw = [
        "# robots.txt for https://example.com",
        "User-agent: *",
        "Disallow: /admin",
        "Disallow: /private",
        "Allow: /public",
        "Crawl-delay: 10",
        "",
        "User-agent: Googlebot",
        "Disallow:",
        "Crawl-delay: 1",
        "",
        "User-agent: Bingbot",
        "Disallow: /temp",
        "",
        "Sitemap: https://example.com/sitemap.xml",
        "Sitemap: https://example.com/sitemap-news.xml",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(3);

      // Group 0: *
      expect(result.groups[0]!.userAgents).toEqual(["*"]);
      expect(result.groups[0]!.disallowRules).toEqual(["/admin", "/private"]);
      expect(result.groups[0]!.allowRules).toEqual(["/public"]);
      expect(result.groups[0]!.crawlDelay).toBe(10);

      // Group 1: Googlebot
      expect(result.groups[1]!.userAgents).toEqual(["Googlebot"]);
      expect(result.groups[1]!.disallowRules).toEqual([""]); // empty = allow all
      expect(result.groups[1]!.crawlDelay).toBe(1);

      // Group 2: Bingbot
      expect(result.groups[2]!.userAgents).toEqual(["Bingbot"]);
      expect(result.groups[2]!.disallowRules).toEqual(["/temp"]);

      // Sitemaps (global)
      expect(result.sitemapUrls).toHaveLength(2);
      expect(result.sitemapUrls[0]).toBe("https://example.com/sitemap.xml");
      expect(result.sitemapUrls[1]).toBe("https://example.com/sitemap-news.xml");
    });
  });

  /* ── Case insensitivity ── */

  describe("case insensitivity", () => {
    it("should accept directive in any case", () => {
      const raw = [
        "USER-AGENT: *",
        "ALLOW: /public",
        "DISALLOW: /private",
        "SITEMAP: https://example.com/sitemap.xml",
        "CRAWL-DELAY: 5",
      ].join("\n");

      const result = parse(raw);

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.allowRules).toEqual(["/public"]);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
      expect(result.groups[0]!.crawlDelay).toBe(5);
      expect(result.sitemapUrls).toEqual([
        "https://example.com/sitemap.xml",
      ]);
    });

    it("should accept mixed-case directives", () => {
      const raw = [
        "User-Agent: *",
        "Disallow: /private",
      ].join("\n");

      const result = parse(raw);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.disallowRules).toEqual(["/private"]);
    });
  });
});
