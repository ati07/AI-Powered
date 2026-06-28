/**
 * Tests — RecommendationEngine.
 *
 * Covers all recommendation categories with edge cases,
 * new fields (id, affectedField, fix, order), new rules
 * (too-short, incorrect canonical), deduplication, and
 * deterministic ordering.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RecommendationEngine } from "@/scoring/recommendations/recommendation-engine";
import { type ScorablePage } from "@/scoring/calculator/types";

/* ──────────────── Helpers ──────────────── */

function makePage(overrides?: Partial<ScorablePage>): ScorablePage {
  return {
    id: "page-1",
    scanId: "scan-1",
    url: "https://example.com/page",
    title: "This Is a Perfectly Optimised Title for SEO", // 44 chars, within 30-60
    metaDescription: "A perfect meta description that is long enough to exceed the minimum threshold and describes the page content well for optimal SEO results.", // ~130 chars, within 120-160
    canonical: "https://example.com/page",
    robots: "index, follow",
    openGraph: {
      "og:title": "Page Title",
      "og:description": "Description",
      "og:image": "https://example.com/image.jpg",
    },
    twitter: {
      "twitter:card": "summary_large_image",
      "twitter:title": "Page Title",
    },
    headings: {
      h1: ["Main Heading"],
      h2: ["Subheading"],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
    },
    images: [
      { src: "/img1.jpg", alt: "Alt text" },
    ],
    links: [
      { href: "/a", text: "A", normalizedUrl: "https://example.com/a", type: "internal" },
      { href: "/b", text: "B", normalizedUrl: "https://example.com/b", type: "internal" },
      { href: "/c", text: "C", normalizedUrl: "https://example.com/c", type: "internal" },
      { href: "/d", text: "D", normalizedUrl: "https://example.com/d", type: "internal" },
      { href: "/e", text: "E", normalizedUrl: "https://example.com/e", type: "internal" },
    ],
    structuredData: [{ raw: "{}", json: {} }],
    ...overrides,
  };
}

/* ──────────────── Suite ──────────────── */

describe("RecommendationEngine", () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  it("should return an empty array for a perfectly optimized page", () => {
    const recs = engine.generate(makePage());
    expect(recs).toHaveLength(0);
  });

  it("should return immutable recommendations", () => {
    const recs = engine.generate(makePage({ title: null }));
    expect(() => {
      (recs as unknown as Array<unknown>).push({} as never);
    }).toThrow();
  });

  /* ═══════════════════════════════════════════════
     New fields
     ═══════════════════════════════════════════════ */

  describe("recommendation fields", () => {
    it("should include id, affectedField, fix, order in each recommendation", () => {
      const recs = engine.generate(makePage({ title: null }));
      const rec = recs[0]!;
      expect(rec.id).toBeTruthy();
      expect(typeof rec.id).toBe("string");
      expect(rec.affectedField).toBeTruthy();
      expect(typeof rec.affectedField).toBe("string");
      expect(rec.fix).toBeTruthy();
      expect(typeof rec.fix).toBe("string");
      expect(rec.order).toBeGreaterThanOrEqual(0);
      expect(typeof rec.order).toBe("number");
    });

    it("should have a deterministic id (same page + same issue = same id)", () => {
      const recs1 = engine.generate(makePage({ title: null }));
      const recs2 = engine.generate(makePage({ title: null }));
      const id1 = recs1.find((r) => r.category === "title")!.id;
      const id2 = recs2.find((r) => r.category === "title")!.id;
      expect(id1).toBe(id2);
    });

    it("should have backward-compatible recommendation field (alias for fix)", () => {
      const recs = engine.generate(makePage({ title: null }));
      const rec = recs.find((r) => r.category === "title")!;
      expect(rec.recommendation).toBe(rec.fix);
    });
  });

  /* ═══════════════════════════════════════════════
     Deterministic ordering
     ═══════════════════════════════════════════════ */

  describe("deterministic ordering", () => {
    it("should order by severity (critical before important before suggestion)", () => {
      const recs = engine.generate(makePage({
        title: null,              // critical
        canonical: null,          // important
        twitter: {},              // suggestion
      }));
      // Find order values
      const title = recs.find((r) => r.category === "title")!;
      const canonical = recs.find((r) => r.category === "canonical")!;
      const twitter = recs.find((r) => r.category === "twitterCards")!;
      expect(title.order).toBeLessThan(canonical.order);
      expect(canonical.order).toBeLessThan(twitter.order);
    });

    it("should return recommendations sorted by order ascending", () => {
      const recs = engine.generate(makePage({
        title: null,
        canonical: null,
        twitter: {},
      }));
      for (let i = 1; i < recs.length; i++) {
        expect(recs[i]!.order).toBeGreaterThanOrEqual(recs[i - 1]!.order);
      }
    });
  });

  /* ═══════════════════════════════════════════════
     Deduplication
     ═══════════════════════════════════════════════ */

  describe("deduplication", () => {
    it("should not generate duplicate recommendations", () => {
      // Multiple calls should not matter — dedup is within a single generate()
      const recs = engine.generate(makePage({ title: null }));
      const titleRecs = recs.filter((r) => r.category === "title");
      expect(titleRecs.length).toBe(1);
    });
  });

  /* ═══════════════════════════════════════════════
     Title
     ═══════════════════════════════════════════════ */

  describe("title recommendations", () => {
    it("should recommend adding a title when missing", () => {
      const recs = engine.generate(makePage({ title: null }));
      const rec = recs.find((r) => r.category === "title");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("critical");
      expect(rec!.affectedField).toBe("title");
    });

    it("should recommend expanding title when too short (< 30 chars)", () => {
      const recs = engine.generate(makePage({ title: "Short" }));
      const rec = recs.find((r) => r.category === "title");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("suggestion");
      expect(rec!.affectedField).toBe("title");
    });

    it("should recommend shortening title when too long (> 60 chars)", () => {
      const recs = engine.generate(makePage({ title: "A".repeat(70) }));
      const rec = recs.find((r) => r.category === "title");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("important");
      expect(rec!.affectedField).toBe("title");
    });

    it("should not recommend when title is optimal (30-60 chars)", () => {
      const recs = engine.generate(makePage({ title: "Optimal Title Length for Testing Purposes" })); // 45 chars
      expect(recs.filter((r) => r.category === "title")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Meta Description
     ═══════════════════════════════════════════════ */

  describe("meta description recommendations", () => {
    it("should recommend adding meta description when missing", () => {
      const recs = engine.generate(makePage({ metaDescription: null }));
      const rec = recs.find((r) => r.category === "metaDescription");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("critical");
      expect(rec!.affectedField).toBe("metaDescription");
    });

    it("should recommend expanding meta description when too short (< 120 chars)", () => {
      const recs = engine.generate(makePage({
        metaDescription: "Short description.",
      }));
      const rec = recs.find((r) => r.category === "metaDescription");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("suggestion");
      expect(rec!.affectedField).toBe("metaDescription");
    });

    it("should recommend shortening meta description when too long (> 160 chars)", () => {
      const recs = engine.generate(makePage({ metaDescription: "A".repeat(200) }));
      const rec = recs.find((r) => r.category === "metaDescription");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("important");
      expect(rec!.affectedField).toBe("metaDescription");
    });

    it("should not recommend when meta description is optimal (120-160 chars)", () => {
      const recs = engine.generate(makePage({
        metaDescription: "A".repeat(140),
      }));
      expect(recs.filter((r) => r.category === "metaDescription")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Heading Structure
     ═══════════════════════════════════════════════ */

  describe("heading structure recommendations", () => {
    it("should recommend adding H1 when missing", () => {
      const recs = engine.generate(makePage({
        headings: { h1: [], h2: ["Sub"], h3: [], h4: [], h5: [], h6: [] },
      }));
      const rec = recs.find((r) => r.category === "headingStructure");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("critical");
      expect(rec!.affectedField).toBe("h1");
    });

    it("should recommend fixing multiple H1s", () => {
      const recs = engine.generate(makePage({
        headings: { h1: ["First", "Second"], h2: [], h3: [], h4: [], h5: [], h6: [] },
      }));
      const rec = recs.find((r) => r.category === "headingStructure" && r.title.includes("Multiple"));
      expect(rec).toBeDefined();
      expect(rec!.affectedField).toBe("h1");
    });

    it("should recommend adding H2 when missing", () => {
      const recs = engine.generate(makePage({
        headings: { h1: ["Main"], h2: [], h3: [], h4: [], h5: [], h6: [] },
      }));
      const rec = recs.find((r) => r.category === "headingStructure" && r.title.includes("H2"));
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("suggestion");
      expect(rec!.affectedField).toBe("h2");
    });

    it("should not recommend when heading structure is optimal", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "headingStructure")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Canonical
     ═══════════════════════════════════════════════ */

  describe("canonical recommendations", () => {
    it("should recommend adding canonical when missing", () => {
      const recs = engine.generate(makePage({ canonical: null }));
      const rec = recs.find((r) => r.category === "canonical");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("important");
    });

    it("should recommend incorrect canonical when it does not match page URL", () => {
      const recs = engine.generate(makePage({
        canonical: "https://other.com/different",
        url: "https://example.com/page",
      }));
      const rec = recs.find((r) => r.category === "canonical" && r.title.includes("Incorrect"));
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("important");
      expect(rec!.affectedField).toBe("canonical");
    });

    it("should not flag self-referencing canonical as incorrect", () => {
      const recs = engine.generate(makePage({
        canonical: "https://example.com/page",
        url: "https://example.com/page",
      }));
      const incorrect = recs.find((r) => r.category === "canonical" && r.title.includes("Incorrect"));
      expect(incorrect).toBeUndefined();
    });

    it("should not recommend when canonical is present and correct", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "canonical")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Indexability
     ═══════════════════════════════════════════════ */

  describe("indexability recommendations", () => {
    it("should recommend removing noindex when set", () => {
      const recs = engine.generate(makePage({ robots: "noindex" }));
      const rec = recs.find((r) => r.category === "indexability");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("critical");
      expect(rec!.affectedField).toBe("robots");
    });

    it("should not recommend when page is indexable", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "indexability")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Structured Data
     ═══════════════════════════════════════════════ */

  describe("structured data recommendations", () => {
    it("should recommend adding structured data when missing", () => {
      const recs = engine.generate(makePage({ structuredData: null }));
      const rec = recs.find((r) => r.category === "structuredData");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("important");
      expect(rec!.affectedField).toBe("structuredData");
    });

    it("should not recommend when structured data is present", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "structuredData")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Internal Linking
     ═══════════════════════════════════════════════ */

  describe("internal linking recommendations", () => {
    it("should recommend adding links when none found", () => {
      const recs = engine.generate(makePage({ links: null }));
      const rec = recs.find((r) => r.category === "internalLinking");
      expect(rec).toBeDefined();
      expect(rec!.affectedField).toBe("links");
    });

    it("should recommend internal links when only external", () => {
      const recs = engine.generate(makePage({
        links: [
          { href: "https://other.com", text: "Other", normalizedUrl: null, type: "external" },
        ],
      }));
      const rec = recs.find((r) => r.category === "internalLinking" && r.title.includes("No Internal"));
      expect(rec).toBeDefined();
      expect(rec!.affectedField).toBe("links");
    });

    it("should suggest more links when few internal", () => {
      const recs = engine.generate(makePage({
        links: [
          { href: "/a", text: "A", normalizedUrl: "https://example.com/a", type: "internal" },
        ],
      }));
      const rec = recs.find((r) => r.category === "internalLinking");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("suggestion");
      expect(rec!.affectedField).toBe("links");
    });

    it("should not recommend when 5+ internal links", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "internalLinking")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Images
     ═══════════════════════════════════════════════ */

  describe("images recommendations", () => {
    it("should recommend adding alt text when missing", () => {
      const recs = engine.generate(makePage({
        images: [{ src: "/a.jpg", alt: null }],
      }));
      const rec = recs.find((r) => r.category === "images");
      expect(rec).toBeDefined();
      expect(rec!.affectedField).toBe("images");
    });

    it("should be critical when ALL images lack alt text", () => {
      const recs = engine.generate(makePage({
        images: [
          { src: "/a.jpg", alt: null },
          { src: "/b.jpg", alt: "" },
        ],
      }));
      const rec = recs.find((r) => r.category === "images")!;
      expect(rec.severity).toBe("critical");
    });

    it("should be important when SOME images lack alt text", () => {
      const recs = engine.generate(makePage({
        images: [
          { src: "/a.jpg", alt: "Alt" },
          { src: "/b.jpg", alt: null },
        ],
      }));
      const rec = recs.find((r) => r.category === "images")!;
      expect(rec.severity).toBe("important");
    });

    it("should not recommend when no images (neutral)", () => {
      const recs = engine.generate(makePage({ images: null }));
      expect(recs.filter((r) => r.category === "images")).toHaveLength(0);
    });

    it("should not recommend when all images have alt text", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "images")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Open Graph
     ═══════════════════════════════════════════════ */

  describe("open graph recommendations", () => {
    it("should recommend adding OG tags when none present", () => {
      const recs = engine.generate(makePage({ openGraph: {} }));
      const rec = recs.find((r) => r.category === "openGraph");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("important");
      expect(rec!.affectedField).toBe("openGraph");
    });

    it("should recommend missing og:title", () => {
      const recs = engine.generate(makePage({
        openGraph: { "og:description": "Desc", "og:image": "img.jpg" },
      }));
      const rec = recs.find((r) => r.category === "openGraph" && r.title.includes("og:title"));
      expect(rec).toBeDefined();
    });

    it("should recommend missing og:description", () => {
      const recs = engine.generate(makePage({
        openGraph: { "og:title": "Title", "og:image": "img.jpg" },
      }));
      const rec = recs.find((r) => r.category === "openGraph" && r.title.includes("og:description"));
      expect(rec).toBeDefined();
    });

    it("should recommend missing og:image", () => {
      const recs = engine.generate(makePage({
        openGraph: { "og:title": "Title", "og:description": "Desc" },
      }));
      const rec = recs.find((r) => r.category === "openGraph" && r.title.includes("og:image"));
      expect(rec).toBeDefined();
    });

    it("should not recommend when all OG tags present", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "openGraph")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Twitter Cards
     ═══════════════════════════════════════════════ */

  describe("twitter cards recommendations", () => {
    it("should recommend adding TC tags when none present", () => {
      const recs = engine.generate(makePage({ twitter: {} }));
      const rec = recs.find((r) => r.category === "twitterCards");
      expect(rec).toBeDefined();
      expect(rec!.severity).toBe("suggestion");
      expect(rec!.affectedField).toBe("twitter");
    });

    it("should recommend missing twitter:card", () => {
      const recs = engine.generate(makePage({
        twitter: { "twitter:title": "Title" },
      }));
      const rec = recs.find((r) => r.category === "twitterCards" && r.title.includes("twitter:card"));
      expect(rec).toBeDefined();
    });

    it("should recommend missing twitter:title", () => {
      const recs = engine.generate(makePage({
        twitter: { "twitter:card": "summary" },
      }));
      const rec = recs.find((r) => r.category === "twitterCards" && r.title.includes("twitter:title"));
      expect(rec).toBeDefined();
    });

    it("should not recommend when all TC tags present", () => {
      const recs = engine.generate(makePage());
      expect(recs.filter((r) => r.category === "twitterCards")).toHaveLength(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Multiple recommendations
     ═══════════════════════════════════════════════ */

  describe("multiple recommendations", () => {
    it("should generate multiple recommendations for multiple issues", () => {
      const recs = engine.generate(makePage({
        title: null,
        metaDescription: null,
        canonical: null,
        structuredData: null,
      }));
      expect(recs.length).toBeGreaterThanOrEqual(4);
    });

    it("should include all required fields in each recommendation", () => {
      const recs = engine.generate(makePage({ title: null }));
      const rec = recs[0]!;
      expect(rec.id).toBeTruthy();
      expect(rec.category).toBeTruthy();
      expect(rec.severity).toBeTruthy();
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.fix).toBeTruthy();
      expect(rec.recommendation).toBeTruthy();
      expect(rec.affectedField).toBeTruthy();
      expect(typeof rec.order).toBe("number");
    });

    it("should include actionable fix text", () => {
      const recs = engine.generate(makePage({ title: null }));
      const rec = recs.find((r) => r.category === "title")!;
      expect(rec.fix).toContain("Add");
    });
  });
});
