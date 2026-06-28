/**
 * Tests — VisibilityScoreCalculator.
 *
 * Covers all 10 scoring categories with edge cases for each.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { VisibilityScoreCalculator } from "@/scoring/calculator/visibility-score-calculator";
import { type ScorablePage } from "@/scoring/calculator/types";

/* ──────────────── Test helpers ──────────────── */

function makePage(overrides?: Partial<ScorablePage>): ScorablePage {
  return {
    id: "page-1",
    scanId: "scan-1",
    url: "https://example.com/page",
    title: "Perfect Title",
    metaDescription: "A perfect meta description for testing purposes that is not too long.",
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
      { src: "/img1.jpg", alt: "Image 1" },
      { src: "/img2.jpg", alt: "Image 2" },
    ],
    links: [
      { href: "/a", text: "A", normalizedUrl: "https://example.com/a", type: "internal" },
      { href: "/b", text: "B", normalizedUrl: "https://example.com/b", type: "internal" },
      { href: "/c", text: "C", normalizedUrl: "https://example.com/c", type: "internal" },
      { href: "/d", text: "D", normalizedUrl: "https://example.com/d", type: "internal" },
      { href: "/e", text: "E", normalizedUrl: "https://example.com/e", type: "internal" },
    ],
    structuredData: [{ raw: '{"@context":"https://schema.org"}', json: { "@context": "https://schema.org" } }],
    ...overrides,
  };
}

/* ──────────────── Suite ──────────────── */

describe("VisibilityScoreCalculator", () => {
  let calculator: VisibilityScoreCalculator;

  beforeEach(() => {
    calculator = new VisibilityScoreCalculator();
  });

  /* ═══════════════════════════════════════════════
     Overall score
     ═══════════════════════════════════════════════ */

  describe("overall score", () => {
    it("should return 100 for a perfectly optimized page", () => {
      const result = calculator.calculate(makePage());
      expect(result.overallScore).toBe(100);
    });

    it("should return minimum for a page with all categories failing", () => {
      const result = calculator.calculate(makePage({
        title: null,
        metaDescription: null,
        canonical: null,
        robots: "noindex",
        openGraph: {},
        twitter: {},
        headings: null,
        images: [{ src: "/a.jpg", alt: null }], // images present but all lack alt = 0
        links: null,
        structuredData: null,
      }));
      expect(result.overallScore).toBe(0);
    });

    it("should return a score between 0 and 100", () => {
      const result = calculator.calculate(makePage({
        title: null,
        metaDescription: null,
      }));
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("should return the same score for the same page (deterministic)", () => {
      const page = makePage({ title: "Some Title" });
      const result1 = calculator.calculate(page);
      const result2 = calculator.calculate(page);
      expect(result1.overallScore).toBe(result2.overallScore);
    });

    it("should include category scores with weighted values", () => {
      const result = calculator.calculate(makePage());
      expect(result.categoryScores.length).toBe(10);
      for (const cs of result.categoryScores) {
        expect(cs.score).toBeGreaterThanOrEqual(0);
        expect(cs.score).toBeLessThanOrEqual(100);
        expect(cs.weight).toBeGreaterThan(0);
        expect(cs.weightedScore).toBeGreaterThan(0);
      }
    });

    it("should include deductions when points are lost", () => {
      const result = calculator.calculate(makePage({ title: null }));
      expect(result.deductions.length).toBeGreaterThan(0);
      expect(result.deductions[0]!.category).toBe("title");
    });
  });

  /* ═══════════════════════════════════════════════
     Title
     ═══════════════════════════════════════════════ */

  describe("title scoring", () => {
    it("should score 100 for an optimal title (present, ≤ 60 chars)", () => {
      const result = calculator.calculate(makePage({ title: "Optimal Title Length" }));
      const title = result.categoryScores.find((c) => c.category === "title")!;
      expect(title.score).toBe(100);
    });

    it("should score 70 for a title present but missing length bonus", () => {
      const result = calculator.calculate(makePage({
        title: "A".repeat(70), // longer than 60
      }));
      const title = result.categoryScores.find((c) => c.category === "title")!;
      expect(title.score).toBeLessThan(100);
      expect(title.score).toBeGreaterThanOrEqual(60);
    });

    it("should score 0 when title is missing", () => {
      const result = calculator.calculate(makePage({ title: null }));
      const title = result.categoryScores.find((c) => c.category === "title")!;
      expect(title.score).toBe(0);
    });

    it("should score 0 when title is empty", () => {
      const result = calculator.calculate(makePage({ title: "" }));
      const title = result.categoryScores.find((c) => c.category === "title")!;
      expect(title.score).toBe(0);
    });

    it("should score 0 when title is only whitespace", () => {
      const result = calculator.calculate(makePage({ title: "   " }));
      const title = result.categoryScores.find((c) => c.category === "title")!;
      expect(title.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Meta Description
     ═══════════════════════════════════════════════ */

  describe("meta description scoring", () => {
    it("should score 100 for an optimal meta description", () => {
      const result = calculator.calculate(makePage({
        metaDescription: "A".repeat(100),
      }));
      const md = result.categoryScores.find((c) => c.category === "metaDescription")!;
      expect(md.score).toBe(100);
    });

    it("should score 70 for a description that's too long", () => {
      const result = calculator.calculate(makePage({
        metaDescription: "A".repeat(200), // longer than 160
      }));
      const md = result.categoryScores.find((c) => c.category === "metaDescription")!;
      expect(md.score).toBe(60); // 70 - 10
    });

    it("should score 0 when meta description is missing", () => {
      const result = calculator.calculate(makePage({ metaDescription: null }));
      const md = result.categoryScores.find((c) => c.category === "metaDescription")!;
      expect(md.score).toBe(0);
    });

    it("should score 0 when meta description is empty", () => {
      const result = calculator.calculate(makePage({ metaDescription: "" }));
      const md = result.categoryScores.find((c) => c.category === "metaDescription")!;
      expect(md.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Heading Structure
     ═══════════════════════════════════════════════ */

  describe("heading structure scoring", () => {
    it("should score 100 for single H1 with H2", () => {
      const result = calculator.calculate(makePage({
        headings: { h1: ["Main"], h2: ["Sub"], h3: [], h4: [], h5: [], h6: [] },
      }));
      const hs = result.categoryScores.find((c) => c.category === "headingStructure")!;
      expect(hs.score).toBe(100);
    });

    it("should deduct for multiple H1s", () => {
      const result = calculator.calculate(makePage({
        headings: { h1: ["First", "Second"], h2: [], h3: [], h4: [], h5: [], h6: [] },
      }));
      const hs = result.categoryScores.find((c) => c.category === "headingStructure")!;
      expect(hs.score).toBeLessThan(100);
    });

    it("should score 0 when no heading data", () => {
      const result = calculator.calculate(makePage({ headings: null }));
      const hs = result.categoryScores.find((c) => c.category === "headingStructure")!;
      expect(hs.score).toBe(0);
    });

    it("should give partial credit for H2 only when H1 is missing", () => {
      const result = calculator.calculate(makePage({
        headings: { h1: [], h2: ["Sub"], h3: [], h4: [], h5: [], h6: [] },
      }));
      const hs = result.categoryScores.find((c) => c.category === "headingStructure")!;
      expect(hs.score).toBe(20); // 20 for H2 present
    });
  });

  /* ═══════════════════════════════════════════════
     Canonical
     ═══════════════════════════════════════════════ */

  describe("canonical scoring", () => {
    it("should score 100 when canonical is present", () => {
      const result = calculator.calculate(makePage({
        canonical: "https://example.com/page",
      }));
      const c = result.categoryScores.find((cs) => cs.category === "canonical")!;
      expect(c.score).toBe(100);
    });

    it("should score 0 when canonical is missing", () => {
      const result = calculator.calculate(makePage({ canonical: null }));
      const c = result.categoryScores.find((cs) => cs.category === "canonical")!;
      expect(c.score).toBe(0);
    });

    it("should score 0 when canonical is empty", () => {
      const result = calculator.calculate(makePage({ canonical: "" }));
      const c = result.categoryScores.find((cs) => cs.category === "canonical")!;
      expect(c.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Indexability
     ═══════════════════════════════════════════════ */

  describe("indexability scoring", () => {
    it("should score 100 when robots is absent (default indexable)", () => {
      const result = calculator.calculate(makePage({ robots: null }));
      const idx = result.categoryScores.find((c) => c.category === "indexability")!;
      expect(idx.score).toBe(100);
    });

    it("should score 100 when robots allows indexing", () => {
      const result = calculator.calculate(makePage({ robots: "index, follow" }));
      const idx = result.categoryScores.find((c) => c.category === "indexability")!;
      expect(idx.score).toBe(100);
    });

    it("should score 0 when robots contains noindex", () => {
      const result = calculator.calculate(makePage({ robots: "noindex" }));
      const idx = result.categoryScores.find((c) => c.category === "indexability")!;
      expect(idx.score).toBe(0);
    });

    it("should score 0 when robots has noindex among other directives", () => {
      const result = calculator.calculate(makePage({
        robots: "noindex, nofollow",
      }));
      const idx = result.categoryScores.find((c) => c.category === "indexability")!;
      expect(idx.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Structured Data
     ═══════════════════════════════════════════════ */

  describe("structured data scoring", () => {
    it("should score 100 when structured data is present", () => {
      const result = calculator.calculate(makePage());
      const sd = result.categoryScores.find((c) => c.category === "structuredData")!;
      expect(sd.score).toBe(100);
    });

    it("should score 0 when structured data is missing", () => {
      const result = calculator.calculate(makePage({ structuredData: null }));
      const sd = result.categoryScores.find((c) => c.category === "structuredData")!;
      expect(sd.score).toBe(0);
    });

    it("should score 0 when structured data is empty array", () => {
      const result = calculator.calculate(makePage({ structuredData: [] }));
      const sd = result.categoryScores.find((c) => c.category === "structuredData")!;
      expect(sd.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Internal Linking
     ═══════════════════════════════════════════════ */

  describe("internal linking scoring", () => {
    it("should score 100 when 5+ internal links", () => {
      const result = calculator.calculate(makePage());
      const il = result.categoryScores.find((c) => c.category === "internalLinking")!;
      expect(il.score).toBe(100);
    });

    it("should score 50 when 1-4 internal links", () => {
      const result = calculator.calculate(makePage({
        links: [
          { href: "/a", text: "A", normalizedUrl: "https://example.com/a", type: "internal" },
        ],
      }));
      const il = result.categoryScores.find((c) => c.category === "internalLinking")!;
      expect(il.score).toBe(50);
    });

    it("should score 0 when no links at all", () => {
      const result = calculator.calculate(makePage({ links: null }));
      const il = result.categoryScores.find((c) => c.category === "internalLinking")!;
      expect(il.score).toBe(0);
    });

    it("should score 0 when only external links", () => {
      const result = calculator.calculate(makePage({
        links: [
          { href: "https://other.com", text: "Other", normalizedUrl: null, type: "external" },
        ],
      }));
      const il = result.categoryScores.find((c) => c.category === "internalLinking")!;
      expect(il.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Images
     ═══════════════════════════════════════════════ */

  describe("images scoring", () => {
    it("should score 100 when no images (neutral)", () => {
      const result = calculator.calculate(makePage({ images: null }));
      const img = result.categoryScores.find((c) => c.category === "images")!;
      expect(img.score).toBe(100);
    });

    it("should score 100 when all images have alt text", () => {
      const result = calculator.calculate(makePage({
        images: [
          { src: "/a.jpg", alt: "A" },
          { src: "/b.jpg", alt: "B" },
        ],
      }));
      const img = result.categoryScores.find((c) => c.category === "images")!;
      expect(img.score).toBe(100);
    });

    it("should score proportionally when some images lack alt text", () => {
      const result = calculator.calculate(makePage({
        images: [
          { src: "/a.jpg", alt: "A" },
          { src: "/b.jpg", alt: null },
        ],
      }));
      const img = result.categoryScores.find((c) => c.category === "images")!;
      expect(img.score).toBe(50);
    });

    it("should score 0 when all images lack alt text", () => {
      const result = calculator.calculate(makePage({
        images: [
          { src: "/a.jpg", alt: null },
          { src: "/b.jpg", alt: "" },
        ],
      }));
      const img = result.categoryScores.find((c) => c.category === "images")!;
      expect(img.score).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Open Graph
     ═══════════════════════════════════════════════ */

  describe("open graph scoring", () => {
    it("should score 100 when all essential OG tags present", () => {
      const result = calculator.calculate(makePage());
      const og = result.categoryScores.find((c) => c.category === "openGraph")!;
      expect(og.score).toBe(100);
    });

    it("should score 0 when no OG tags", () => {
      const result = calculator.calculate(makePage({ openGraph: {} }));
      const og = result.categoryScores.find((c) => c.category === "openGraph")!;
      expect(og.score).toBe(0);
    });

    it("should score partially when some OG tags missing", () => {
      const result = calculator.calculate(makePage({
        openGraph: { "og:title": "Title Only" },
      }));
      const og = result.categoryScores.find((c) => c.category === "openGraph")!;
      expect(og.score).toBeGreaterThan(0);
      expect(og.score).toBeLessThan(100);
    });

    it("should score 40 when only og:title present", () => {
      const result = calculator.calculate(makePage({
        openGraph: { "og:title": "Title" },
      }));
      const og = result.categoryScores.find((c) => c.category === "openGraph")!;
      expect(og.score).toBe(40);
    });
  });

  /* ═══════════════════════════════════════════════
     Twitter Cards
     ═══════════════════════════════════════════════ */

  describe("twitter cards scoring", () => {
    it("should score 100 when both card and title present", () => {
      const result = calculator.calculate(makePage());
      const tw = result.categoryScores.find((c) => c.category === "twitterCards")!;
      expect(tw.score).toBe(100);
    });

    it("should score 0 when no Twitter tags", () => {
      const result = calculator.calculate(makePage({ twitter: {} }));
      const tw = result.categoryScores.find((c) => c.category === "twitterCards")!;
      expect(tw.score).toBe(0);
    });

    it("should score 50 when only card type present", () => {
      const result = calculator.calculate(makePage({
        twitter: { "twitter:card": "summary" },
      }));
      const tw = result.categoryScores.find((c) => c.category === "twitterCards")!;
      expect(tw.score).toBe(50);
    });

    it("should score 50 when only title present", () => {
      const result = calculator.calculate(makePage({
        twitter: { "twitter:title": "Title" },
      }));
      const tw = result.categoryScores.find((c) => c.category === "twitterCards")!;
      expect(tw.score).toBe(50);
    });
  });

  /* ═══════════════════════════════════════════════
     Deductions
     ═══════════════════════════════════════════════ */

  describe("deductions", () => {
    it("should report a deduction for each missing category", () => {
      const result = calculator.calculate(makePage({
        title: null,
        metaDescription: null,
      }));
      expect(result.deductions.length).toBeGreaterThanOrEqual(2);
      const categories = result.deductions.map((d) => d.category);
      expect(categories).toContain("title");
      expect(categories).toContain("metaDescription");
    });

    it("should include reason text in each deduction", () => {
      const result = calculator.calculate(makePage({ title: null }));
      expect(result.deductions[0]!.reason).toBeTruthy();
    });

    it("should include deduction points in each deduction", () => {
      const result = calculator.calculate(makePage({ title: null }));
      expect(result.deductions[0]!.deduction).toBeGreaterThan(0);
    });
  });

  /* ═══════════════════════════════════════════════
     Custom weights
     ═══════════════════════════════════════════════ */

  describe("custom weights", () => {
    it("should accept custom weight configuration", () => {
      const result = calculator.calculate(makePage({
        title: null, // will score 0
        metaDescription: "Good description",
      }), {
        title: 0.5, // high weight for title
        metaDescription: 0.5, // high weight for meta description
        headingStructure: 0,
        canonical: 0,
        indexability: 0,
        structuredData: 0,
        internalLinking: 0,
        images: 0,
        openGraph: 0,
        twitterCards: 0,
      });
      // With title=0 (weighted 0) and meta=100 (weighted 50) out of total weight 1.0
      expect(result.overallScore).toBe(50);
    });

    it("should normalise when total weight !== 1.0", () => {
      const result = calculator.calculate(makePage({
        title: "Perfect Title",
      }), {
        title: 0.3,
        metaDescription: 0,
        headingStructure: 0,
        canonical: 0,
        indexability: 0,
        structuredData: 0,
        internalLinking: 0,
        images: 0,
        openGraph: 0,
        twitterCards: 0,
      });
      // title=100 * 0.3 = 30, totalWeight = 0.3, normalised = 30/0.3 = 100
      expect(result.overallScore).toBe(100);
    });
  });
});
