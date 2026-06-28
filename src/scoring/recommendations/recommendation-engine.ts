/**
 * Scoring — RecommendationEngine.
 *
 * Generates deterministic, actionable SEO recommendations based on
 * extracted page metadata.  No randomness, no LLM, no external API calls.
 *
 * Each recommendation has an id, severity, category, title, description,
 * fix, affectedField, and deterministic order.  Duplicates are prevented
 * within a single generate() call.
 */

import type {
  Recommendation,
  RecommendationSeverity,
  ScorablePage,
} from "@/scoring/calculator/types";

/* ──────────────── Constants ──────────────── */

/** Minimum recommended title length. */
const MIN_TITLE_LENGTH = 30;

/** Maximum recommended title length. */
const MAX_TITLE_LENGTH = 60;

/** Minimum recommended meta description length. */
const MIN_META_DESCRIPTION_LENGTH = 120;

/** Maximum recommended meta description length. */
const MAX_META_DESCRIPTION_LENGTH = 160;

/** Minimum internal links for good site architecture. */
const MIN_INTERNAL_LINKS = 5;

/**
 * Severity priority mapping — lower number = higher priority.
 * Used for deterministic ordering.
 */
const SEVERITY_ORDER: Record<RecommendationSeverity, number> = {
  critical: 0,
  important: 1,
  suggestion: 2,
};

/* ──────────────── Category order offsets ──────────────── */

const CAT_TITLE = 0;
const CAT_META = 1;
const CAT_HEADING = 2;
const CAT_CANONICAL = 3;
const CAT_INDEXABILITY = 4;
const CAT_STRUCTURED = 5;
const CAT_LINKING = 6;
const CAT_IMAGES = 7;
const CAT_OG = 8;
const CAT_TWITTER = 9;

/* ──────────────── Helpers ──────────────── */

/**
 * Generate a deterministic id for a recommendation.
 * Combines page ID, category, and a rule key into a stable string.
 */
function recommendationId(pageId: string, category: string, rule: string): string {
  return `${pageId}::${category}::${rule}`;
}

/**
 * Normalise a URL for canonical comparison:
 * - Lowercase
 * - Remove trailing slash
 * - Remove protocol (http/https)
 * - Remove www. prefix
 */
function normaliseUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/**
 * Compute a deterministic sort order value.
 * Lower values come first in the list (higher priority).
 */
function makeOrder(severity: RecommendationSeverity, categoryOrder: number, ruleOrder: number): number {
  return SEVERITY_ORDER[severity] * 1000 + categoryOrder * 10 + ruleOrder;
}

/* ──────────────── Engine ──────────────── */

export class RecommendationEngine {
  /**
   * Generate recommendations for a page.
   *
   * @param page — SEO metadata from a crawled page.
   * @returns An immutable array of recommendations, ordered by severity
   *          (critical first) then by category.
   */
  generate(page: ScorablePage): readonly Recommendation[] {
    const recommendations: Recommendation[] = [];
    const seen = new Set<string>();

    this.recommendTitle(page, recommendations, seen);
    this.recommendMetaDescription(page, recommendations, seen);
    this.recommendHeadingStructure(page, recommendations, seen);
    this.recommendCanonical(page, recommendations, seen);
    this.recommendIndexability(page, recommendations, seen);
    this.recommendStructuredData(page, recommendations, seen);
    this.recommendInternalLinking(page, recommendations, seen);
    this.recommendImages(page, recommendations, seen);
    this.recommendOpenGraph(page, recommendations, seen);
    this.recommendTwitterCards(page, recommendations, seen);

    // Deterministic sort: by severity (critical first) then by category
    recommendations.sort((a, b) => a.order - b.order);

    return Object.freeze(recommendations);
  }

  /* ═══════════════════════════════════════════════
     Title recommendations
     ═══════════════════════════════════════════════ */

  private recommendTitle(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    if (!page.title || page.title.trim().length === 0) {
      if (this.dedup("title", "missing", seen)) {
        out.push(this.makeRec(page.id, "title", "title", "critical", CAT_TITLE, 0,
          "Missing Title Tag",
          "The page does not have a title tag. Title tags are critical for SEO and accessibility.",
          "Add a descriptive, keyword-rich title tag within the <head> section (max 60 characters).",
        ));
      }
      return;
    }

    const length = page.title.trim().length;

    if (length < MIN_TITLE_LENGTH) {
      if (this.dedup("title", "too-short", seen)) {
        out.push(this.makeRec(page.id, "title", "title", "suggestion", CAT_TITLE, 1,
          "Title Tag Too Short",
          `Title tag is only ${length} characters (recommended at least ${MIN_TITLE_LENGTH}). Short titles may not fully describe the page content.`,
          `Expand the title tag to ${MIN_TITLE_LENGTH}–${MAX_TITLE_LENGTH} descriptive characters.`,
        ));
      }
    }

    if (length > MAX_TITLE_LENGTH) {
      if (this.dedup("title", "too-long", seen)) {
        out.push(this.makeRec(page.id, "title", "title", "important", CAT_TITLE, 2,
          "Title Tag Too Long",
          `Title tag is ${length} characters (recommended max ${MAX_TITLE_LENGTH}). Long titles may be truncated in search results.`,
          `Shorten the title tag to ${MAX_TITLE_LENGTH} characters or fewer.`,
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Meta description recommendations
     ═══════════════════════════════════════════════ */

  private recommendMetaDescription(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    if (!page.metaDescription || page.metaDescription.trim().length === 0) {
      if (this.dedup("metaDescription", "missing", seen)) {
        out.push(this.makeRec(page.id, "metaDescription", "metaDescription", "critical", CAT_META, 0,
          "Missing Meta Description",
          "The page does not have a meta description. Meta descriptions influence click-through rates from search results.",
          "Add a meta description tag summarizing the page content (max 160 characters).",
        ));
      }
      return;
    }

    const length = page.metaDescription.trim().length;

    if (length < MIN_META_DESCRIPTION_LENGTH) {
      if (this.dedup("metaDescription", "too-short", seen)) {
        out.push(this.makeRec(page.id, "metaDescription", "metaDescription", "suggestion", CAT_META, 1,
          "Meta Description Too Short",
          `Meta description is only ${length} characters (recommended at least ${MIN_META_DESCRIPTION_LENGTH}). Short descriptions may not adequately summarise the page.`,
          `Expand the meta description to ${MIN_META_DESCRIPTION_LENGTH}–${MAX_META_DESCRIPTION_LENGTH} descriptive characters.`,
        ));
      }
    }

    if (length > MAX_META_DESCRIPTION_LENGTH) {
      if (this.dedup("metaDescription", "too-long", seen)) {
        out.push(this.makeRec(page.id, "metaDescription", "metaDescription", "important", CAT_META, 2,
          "Meta Description Too Long",
          `Meta description is ${length} characters (recommended max ${MAX_META_DESCRIPTION_LENGTH}). Long descriptions may be truncated in results.`,
          `Shorten the meta description to ${MAX_META_DESCRIPTION_LENGTH} characters or fewer.`,
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Heading structure recommendations
     ═══════════════════════════════════════════════ */

  private recommendHeadingStructure(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    const headings = page.headings;
    if (!headings) {
      if (this.dedup("headingStructure", "no-data", seen)) {
        out.push(this.makeRec(page.id, "headingStructure", "headings", "important", CAT_HEADING, 0,
          "No Heading Data",
          "Heading structure data is not available for this page.",
          "Ensure the HTML parser extracts heading tags from the page.",
        ));
      }
      return;
    }

    if (headings.h1.length === 0) {
      if (this.dedup("headingStructure", "missing-h1", seen)) {
        out.push(this.makeRec(page.id, "headingStructure", "h1", "critical", CAT_HEADING, 1,
          "Missing H1 Tag",
          "The page does not contain an H1 tag. H1 tags define the primary heading and help search engines understand page structure.",
          "Add exactly one H1 tag that describes the main topic of the page.",
        ));
      }
    }

    if (headings.h1.length > 1) {
      if (this.dedup("headingStructure", "multiple-h1", seen)) {
        out.push(this.makeRec(page.id, "headingStructure", "h1", "important", CAT_HEADING, 2,
          "Multiple H1 Tags",
          `Found ${headings.h1.length} H1 tags on the page. Multiple H1s can dilute the semantic structure.`,
          "Use only one H1 tag per page. Use H2–H6 for sub-sections.",
        ));
      }
    }

    if (headings.h2.length === 0) {
      if (this.dedup("headingStructure", "no-h2", seen)) {
        out.push(this.makeRec(page.id, "headingStructure", "h2", "suggestion", CAT_HEADING, 3,
          "No H2 Tags",
          "The page does not contain H2 tags. H2s help organize content into logical sections.",
          "Add H2 tags to structure the main sections of your content.",
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Canonical URL recommendations
     ═══════════════════════════════════════════════ */

  private recommendCanonical(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    if (!page.canonical || page.canonical.trim().length === 0) {
      if (this.dedup("canonical", "missing", seen)) {
        out.push(this.makeRec(page.id, "canonical", "canonical", "important", CAT_CANONICAL, 0,
          "Missing Canonical URL",
          "The page does not specify a canonical URL. Without a canonical, search engines may treat duplicate or similar pages as separate content.",
          "Add a <link rel='canonical'> tag pointing to the preferred version of this page.",
        ));
      }
      return;
    }

    // Check for incorrect / non-self-referencing canonical
    if (page.url && page.canonical) {
      const pageUrl = normaliseUrl(page.url);
      const canonicalUrl = normaliseUrl(page.canonical);

      if (pageUrl && canonicalUrl && pageUrl !== canonicalUrl) {
        if (this.dedup("canonical", "incorrect", seen)) {
          out.push(this.makeRec(page.id, "canonical", "canonical", "important", CAT_CANONICAL, 1,
            "Incorrect Canonical URL",
            `The canonical URL "${page.canonical}" does not match the page URL "${page.url}". This may cause search engines to treat this page as a duplicate of another.`,
            `Update the canonical URL to point to this page (self-referencing) or the correct preferred version: "${page.url}".`,
          ));
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Indexability recommendations
     ═══════════════════════════════════════════════ */

  private recommendIndexability(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    if (page.robots && page.robots.toLowerCase().includes("noindex")) {
      if (this.dedup("indexability", "noindex", seen)) {
        out.push(this.makeRec(page.id, "indexability", "robots", "critical", CAT_INDEXABILITY, 0,
          "Page Set to Noindex",
          "The page contains a 'noindex' directive and will not appear in search engine results.",
          "Remove the 'noindex' directive from the robots meta tag if this page should be indexed.",
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Structured data recommendations
     ═══════════════════════════════════════════════ */

  private recommendStructuredData(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    if (!page.structuredData || page.structuredData.length === 0) {
      if (this.dedup("structuredData", "missing", seen)) {
        out.push(this.makeRec(page.id, "structuredData", "structuredData", "important", CAT_STRUCTURED, 0,
          "Missing Structured Data",
          "The page does not contain any structured data (JSON-LD). Structured data enables rich search results and knowledge panels.",
          "Add JSON-LD structured data relevant to the page content (e.g., Article, Product, FAQ, Organization).",
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Internal linking recommendations
     ═══════════════════════════════════════════════ */

  private recommendInternalLinking(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    const links = page.links;
    if (!links || links.length === 0) {
      if (this.dedup("internalLinking", "no-links", seen)) {
        out.push(this.makeRec(page.id, "internalLinking", "links", "important", CAT_LINKING, 0,
          "No Links Found",
          "The page contains no links at all. Links help users and search engines navigate your site.",
          "Add relevant internal links to other pages on your site.",
        ));
      }
      return;
    }

    const internalLinks = links.filter((l) => l.type === "internal");
    if (internalLinks.length === 0) {
      if (this.dedup("internalLinking", "no-internal", seen)) {
        out.push(this.makeRec(page.id, "internalLinking", "links", "important", CAT_LINKING, 1,
          "No Internal Links",
          "The page contains only external links. Internal links are important for site navigation and SEO.",
          "Add internal links to other relevant pages on your site to improve navigation and link equity distribution.",
        ));
      }
    } else if (internalLinks.length < MIN_INTERNAL_LINKS) {
      if (this.dedup("internalLinking", "few-internal", seen)) {
        out.push(this.makeRec(page.id, "internalLinking", "links", "suggestion", CAT_LINKING, 2,
          "Few Internal Links",
          `Only ${internalLinks.length} internal link(s) found on the page. More internal links can improve site architecture and SEO.`,
          `Add more internal links (aim for at least ${MIN_INTERNAL_LINKS}) to connect related content and distribute link equity.`,
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Images recommendations
     ═══════════════════════════════════════════════ */

  private recommendImages(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    const images = page.images;
    if (!images || images.length === 0) {
      return; // No images is neutral — nothing to recommend
    }

    const missingAlt = images.filter(
      (img) => !img.alt || img.alt.trim().length === 0,
    );

    if (missingAlt.length > 0) {
      if (this.dedup("images", "missing-alt", seen)) {
        const severity: RecommendationSeverity =
          missingAlt.length === images.length ? "critical" : "important";

        out.push(this.makeRec(page.id, "images", "images", severity, CAT_IMAGES, 0,
          `${missingAlt.length} Image(s) Missing Alt Text`,
          `${missingAlt.length} of ${images.length} image(s) are missing alt text. Alt text improves accessibility and helps search engines understand images.`,
          "Add descriptive alt text to every image. Alt text should describe the image content for screen readers and SEO.",
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Open Graph recommendations
     ═══════════════════════════════════════════════ */

  private recommendOpenGraph(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    const og = page.openGraph;
    if (!og || Object.keys(og).length === 0) {
      if (this.dedup("openGraph", "missing", seen)) {
        out.push(this.makeRec(page.id, "openGraph", "openGraph", "important", CAT_OG, 0,
          "Missing Open Graph Tags",
          "The page does not have Open Graph tags. OG tags control how content appears when shared on social media platforms (Facebook, LinkedIn, etc.).",
          "Add at minimum og:title, og:description, and og:image meta tags to the page head.",
        ));
      }
      return;
    }

    if (!("og:title" in og) || !og["og:title"]!.length) {
      if (this.dedup("openGraph", "missing-og-title", seen)) {
        out.push(this.makeRec(page.id, "openGraph", "openGraph", "important", CAT_OG, 1,
          "Missing og:title",
          "The Open Graph title (og:title) is missing. This tag controls the title shown when the page is shared on social media.",
          "Add an og:title meta tag with a compelling title for social sharing.",
        ));
      }
    }

    if (!("og:description" in og) || !og["og:description"]!.length) {
      if (this.dedup("openGraph", "missing-og-description", seen)) {
        out.push(this.makeRec(page.id, "openGraph", "openGraph", "important", CAT_OG, 2,
          "Missing og:description",
          "The Open Graph description (og:description) is missing. This tag controls the description shown when the page is shared.",
          "Add an og:description meta tag summarizing the page for social media previews.",
        ));
      }
    }

    if (!("og:image" in og) || !og["og:image"]!.length) {
      if (this.dedup("openGraph", "missing-og-image", seen)) {
        out.push(this.makeRec(page.id, "openGraph", "openGraph", "important", CAT_OG, 3,
          "Missing og:image",
          "The Open Graph image (og:image) is missing. Without it, shared links may not display a preview image.",
          "Add an og:image meta tag with a URL to a high-quality preview image (ideally 1200×630px).",
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Twitter Card recommendations
     ═══════════════════════════════════════════════ */

  private recommendTwitterCards(page: ScorablePage, out: Recommendation[], seen: Set<string>): void {
    const tw = page.twitter;
    if (!tw || Object.keys(tw).length === 0) {
      if (this.dedup("twitterCards", "missing", seen)) {
        out.push(this.makeRec(page.id, "twitterCards", "twitter", "suggestion", CAT_TWITTER, 0,
          "Missing Twitter Card Tags",
          "The page does not have Twitter Card tags. Twitter Cards control how content appears when shared on X (formerly Twitter).",
          "Add at minimum twitter:card and twitter:title meta tags to control how your page appears in tweets.",
        ));
      }
      return;
    }

    if (!("twitter:card" in tw) || !tw["twitter:card"]!.length) {
      if (this.dedup("twitterCards", "missing-card", seen)) {
        out.push(this.makeRec(page.id, "twitterCards", "twitter", "suggestion", CAT_TWITTER, 1,
          "Missing twitter:card",
          "The Twitter Card type (twitter:card) is not set. This tag controls the card layout (summary, summary_large_image, etc.).",
          "Add a twitter:card meta tag with a value like 'summary_large_image' or 'summary'.",
        ));
      }
    }

    if (!("twitter:title" in tw) || !tw["twitter:title"]!.length) {
      if (this.dedup("twitterCards", "missing-title", seen)) {
        out.push(this.makeRec(page.id, "twitterCards", "twitter", "suggestion", CAT_TWITTER, 2,
          "Missing twitter:title",
          "The Twitter Card title (twitter:title) is missing. This tag controls the title shown when the page is shared on X.",
          "Add a twitter:title meta tag with a compelling title for Twitter sharing.",
        ));
      }
    }
  }

  /* ═══════════════════════════════════════════════
     Dedup & Helpers
     ═══════════════════════════════════════════════ */

  /**
   * Track a (category, rule) pair in the seen set for deduplication.
   * Returns true if this key hasn't been seen yet (proceed with generation);
   * false if it's a duplicate (skip).
   */
  private dedup(category: string, rule: string, seen: Set<string>): boolean {
    const key = `${category}::${rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  /**
   * Build a Recommendation object with all required fields.
   *
   * @param pageId — Used to generate a deterministic recommendation ID.
   * @param category — Recommendation category.
   * @param affectedField — Which SEO field is affected.
   * @param severity — Critical, Important, or Suggestion.
   * @param title — Human-readable title.
   * @param description — Detailed description of the issue.
   * @param fix — Actionable fix instruction.
   * @returns A frozen Recommendation object.
   */
  private makeRec(
    pageId: string,
    category: string,
    affectedField: string,
    severity: RecommendationSeverity,
    categoryOrder: number,
    ruleOrder: number,
    title: string,
    description: string,
    fix: string,
  ): Recommendation {
    return Object.freeze({
      id: recommendationId(pageId, category, `${categoryOrder}-${ruleOrder}`),
      category,
      severity,
      title,
      description,
      fix,
      recommendation: fix,
      affectedField,
      order: makeOrder(severity, categoryOrder, ruleOrder),
    });
  }
}
