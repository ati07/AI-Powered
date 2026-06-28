/**
 * Scoring — VisibilityScoreCalculator.
 *
 * Computes a deterministic AI Visibility Score (0–100) for a single page
 * using only the extracted SEO metadata.
 *
 * The score is the weighted sum of 10 category scores, each scored 0–100.
 * Weights are configurable via {@link ScoringWeights}.
 *
 * Rules:
 * - No randomness
 * - No external API calls
 * - No LLM usage
 * - Pure deterministic computation
 */

import {
  type ScoreResult,
  type CategoryScore,
  type Deduction,
  type ScorablePage,
  type ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  type IScoringCalculator,
} from "@/scoring/calculator/types";

/* ──────────────── Constants ──────────────── */

/** Maximum title length before deductions apply. */
const MAX_TITLE_LENGTH = 60;

/** Maximum meta description length before deductions apply. */
const MAX_META_DESCRIPTION_LENGTH = 160;

/** Perfect score for a fully optimized category. */
const PERFECT_CATEGORY_SCORE = 100;

/* ──────────────── Calculator ──────────────── */

export class VisibilityScoreCalculator implements IScoringCalculator {
  /**
   * Calculate the AI Visibility Score for a page.
   */
  calculate(
    page: ScorablePage,
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  ): ScoreResult {
    const deductions: Deduction[] = [];

    // Calculate each category score (0–100)
    const titleScore = this.scoreTitle(page, deductions);
    const metaDescriptionScore = this.scoreMetaDescription(page, deductions);
    const headingStructureScore = this.scoreHeadingStructure(page, deductions);
    const canonicalScore = this.scoreCanonical(page, deductions);
    const indexabilityScore = this.scoreIndexability(page, deductions);
    const structuredDataScore = this.scoreStructuredData(page, deductions);
    const internalLinkingScore = this.scoreInternalLinking(page, deductions);
    const imagesScore = this.scoreImages(page, deductions);
    const openGraphScore = this.scoreOpenGraph(page, deductions);
    const twitterCardsScore = this.scoreTwitterCards(page, deductions);

    // Build category scores
    const categoryScores: CategoryScore[] = [
      this.makeCategoryScore("title", "Title Tag", titleScore, weights.title),
      this.makeCategoryScore("metaDescription", "Meta Description", metaDescriptionScore, weights.metaDescription),
      this.makeCategoryScore("headingStructure", "Heading Structure", headingStructureScore, weights.headingStructure),
      this.makeCategoryScore("canonical", "Canonical URL", canonicalScore, weights.canonical),
      this.makeCategoryScore("indexability", "Indexability", indexabilityScore, weights.indexability),
      this.makeCategoryScore("structuredData", "Structured Data", structuredDataScore, weights.structuredData),
      this.makeCategoryScore("internalLinking", "Internal Linking", internalLinkingScore, weights.internalLinking),
      this.makeCategoryScore("images", "Images", imagesScore, weights.images),
      this.makeCategoryScore("openGraph", "Open Graph", openGraphScore, weights.openGraph),
      this.makeCategoryScore("twitterCards", "Twitter Cards", twitterCardsScore, weights.twitterCards),
    ];

    // Calculate overall score as weighted sum
    const overallWeighted = categoryScores.reduce(
      (sum, cs) => sum + cs.weightedScore,
      0,
    );
    const totalWeight = categoryScores.reduce(
      (sum, cs) => sum + cs.weight,
      0,
    );
    // Normalise — handle the case where totalWeight !== 1.0 (custom config)
    const overallScore = totalWeight > 0
      ? Math.round(overallWeighted / totalWeight)
      : 0;

    // Clamp to 0–100
    const clampedScore = Math.min(100, Math.max(0, overallScore));

    return Object.freeze({
      overallScore: clampedScore,
      categoryScores: Object.freeze(categoryScores),
      deductions: Object.freeze(deductions),
    }) as ScoreResult;
  }

  /* ═══════════════════════════════════════════════
     Category scoring methods
     ═══════════════════════════════════════════════ */

  /**
   * Score the title tag (max 100).
   *
   * - Present and non-empty: 70 points base
   * - Within length limit (≤ 60 chars): +30 bonus
   * - Over length limit: -10 deduction
   * - Missing entirely: 0 points
   */
  private scoreTitle(page: ScorablePage, deductions: Deduction[]): number {
    if (!page.title || page.title.trim().length === 0) {
      deductions.push({
        category: "title",
        reason: "Title tag is missing or empty",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    const length = page.title.trim().length;
    let score = 70; // present

    if (length <= MAX_TITLE_LENGTH) {
      score += 30; // optimal length bonus
    } else {
      deductions.push({
        category: "title",
        reason: `Title tag is ${length} characters long (max ${MAX_TITLE_LENGTH} recommended)`,
        deduction: 10,
      });
      score -= 10; // too long penalty
    }

    return Math.max(0, score);
  }

  /**
   * Score the meta description (max 100).
   *
   * - Present and non-empty: 70 points base
   * - Within length limit (≤ 160 chars): +30 bonus
   * - Over length limit: -10 deduction
   * - Missing entirely: 0 points
   */
  private scoreMetaDescription(page: ScorablePage, deductions: Deduction[]): number {
    if (!page.metaDescription || page.metaDescription.trim().length === 0) {
      deductions.push({
        category: "metaDescription",
        reason: "Meta description is missing or empty",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    const length = page.metaDescription.trim().length;
    let score = 70;

    if (length <= MAX_META_DESCRIPTION_LENGTH) {
      score += 30;
    } else {
      deductions.push({
        category: "metaDescription",
        reason: `Meta description is ${length} characters long (max ${MAX_META_DESCRIPTION_LENGTH} recommended)`,
        deduction: 10,
      });
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Score the heading structure (max 100).
   *
   * - H1 present: 50 points
   * - Single H1 (not multiple): +30 bonus
   * - H2 present: +20 bonus
   * - Multiple H1s: -30 deduction
   * - Missing H1: 0 points base
   */
  private scoreHeadingStructure(page: ScorablePage, deductions: Deduction[]): number {
    const headings = page.headings;
    if (!headings) {
      deductions.push({
        category: "headingStructure",
        reason: "No heading data available",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    const h1Count = headings.h1.length;
    const h2Count = headings.h2.length;

    if (h1Count === 0) {
      deductions.push({
        category: "headingStructure",
        reason: "No H1 tag found on the page",
        deduction: 50,
      });
      // Can still get points for H2 structure
      return Math.min(50, h2Count > 0 ? 20 : 0);
    }

    let score = 50; // H1 present

    if (h1Count === 1) {
      score += 30; // exactly one H1
    } else {
      deductions.push({
        category: "headingStructure",
        reason: `Found ${h1Count} H1 tags (only one is recommended)`,
        deduction: 30,
      });
      score -= 30;
    }

    if (h2Count > 0) {
      score += 20; // H2 present
    }

    return Math.max(0, score);
  }

  /**
   * Score the canonical URL (max 100).
   *
   * - Present: 100 points
   * - Missing: 0 points
   */
  private scoreCanonical(page: ScorablePage, deductions: Deduction[]): number {
    if (!page.canonical || page.canonical.trim().length === 0) {
      deductions.push({
        category: "canonical",
        reason: "Canonical URL is missing",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    return PERFECT_CATEGORY_SCORE;
  }

  /**
   * Score indexability (max 100).
   *
   * - No robots meta or robots allows indexing: 100 points
   * - robots contains "noindex": 0 points
   */
  private scoreIndexability(page: ScorablePage, deductions: Deduction[]): number {
    if (!page.robots) {
      return PERFECT_CATEGORY_SCORE; // default: indexable
    }

    const robotsLower = page.robots.toLowerCase();
    if (robotsLower.includes("noindex")) {
      deductions.push({
        category: "indexability",
        reason: "Page is set to 'noindex' and will not be indexed",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    return PERFECT_CATEGORY_SCORE;
  }

  /**
   * Score structured data (max 100).
   *
   * - One or more valid JSON-LD blocks: 100 points
   * - No structured data: 0 points
   */
  private scoreStructuredData(page: ScorablePage, deductions: Deduction[]): number {
    if (!page.structuredData || page.structuredData.length === 0) {
      deductions.push({
        category: "structuredData",
        reason: "No structured data (JSON-LD) found",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    return PERFECT_CATEGORY_SCORE;
  }

  /**
   * Score internal linking (max 100).
   *
   * - 5+ internal links: 100 points (excellent)
   * - 1–4 internal links: 50 points
   * - No internal links: 0 points
   */
  private scoreInternalLinking(page: ScorablePage, deductions: Deduction[]): number {
    const links = page.links;
    if (!links || links.length === 0) {
      deductions.push({
        category: "internalLinking",
        reason: "No internal links found on the page",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    const internalCount = links.filter((l) => l.type === "internal").length;

    if (internalCount === 0) {
      deductions.push({
        category: "internalLinking",
        reason: "No internal links found on the page",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    if (internalCount >= 5) {
      return PERFECT_CATEGORY_SCORE;
    }

    deductions.push({
      category: "internalLinking",
      reason: `Only ${internalCount} internal link(s) found (recommend at least 5)`,
      deduction: 50,
    });
    return 50;
  }

  /**
   * Score images (max 100).
   *
   * - No images: neutral (100) — no deduction for having no images
   * - Images present AND all have alt text: 100 points
   * - Some images missing alt text: proportional deduction
   * - All images missing alt text: 0 points
   */
  private scoreImages(page: ScorablePage, deductions: Deduction[]): number {
    const images = page.images;
    if (!images || images.length === 0) {
      return PERFECT_CATEGORY_SCORE; // neutral — page may not need images
    }

    const totalImages = images.length;
    const withAlt = images.filter((img) => img.alt && img.alt.trim().length > 0).length;

    if (withAlt === totalImages) {
      return PERFECT_CATEGORY_SCORE;
    }

    const withoutAlt = totalImages - withAlt;
    const score = Math.round((withAlt / totalImages) * PERFECT_CATEGORY_SCORE);

    deductions.push({
      category: "images",
      reason: `${withoutAlt} of ${totalImages} image(s) are missing alt text`,
      deduction: PERFECT_CATEGORY_SCORE - score,
    });

    return score;
  }

  /**
   * Score Open Graph tags (max 100).
   *
   * - Has og:title, og:description, og:image: 100 points
   * - Has some OG tags: proportional score (60 per essential tag)
   * - No OG tags: 0 points
   */
  private scoreOpenGraph(page: ScorablePage, deductions: Deduction[]): number {
    const og = page.openGraph;
    if (!og || Object.keys(og).length === 0) {
      deductions.push({
        category: "openGraph",
        reason: "No Open Graph tags found",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    // Check for essential OG properties
    const hasTitle = "og:title" in og && og["og:title"]!.length > 0;
    const hasDescription = "og:description" in og && og["og:description"]!.length > 0;
    const hasImage = "og:image" in og && og["og:image"]!.length > 0;

    let score = 0;
    if (hasTitle) score += 40;
    if (hasDescription) score += 30;
    if (hasImage) score += 30;

    if (score < PERFECT_CATEGORY_SCORE) {
      const missing: string[] = [];
      if (!hasTitle) missing.push("og:title");
      if (!hasDescription) missing.push("og:description");
      if (!hasImage) missing.push("og:image");
      deductions.push({
        category: "openGraph",
        reason: `Missing Open Graph properties: ${missing.join(", ")}`,
        deduction: PERFECT_CATEGORY_SCORE - score,
      });
    }

    return score;
  }

  /**
   * Score Twitter Cards (max 100).
   *
   * - Has twitter:card and twitter:title: 100 points
   * - Some TC tags: proportional score
   * - No TC tags: 0 points
   */
  private scoreTwitterCards(page: ScorablePage, deductions: Deduction[]): number {
    const tw = page.twitter;
    if (!tw || Object.keys(tw).length === 0) {
      deductions.push({
        category: "twitterCards",
        reason: "No Twitter Card tags found",
        deduction: PERFECT_CATEGORY_SCORE,
      });
      return 0;
    }

    const hasCard = "twitter:card" in tw && tw["twitter:card"]!.length > 0;
    const hasTitle = "twitter:title" in tw && tw["twitter:title"]!.length > 0;

    let score = 0;
    if (hasCard) score += 50;
    if (hasTitle) score += 50;

    if (score < PERFECT_CATEGORY_SCORE) {
      const missing: string[] = [];
      if (!hasCard) missing.push("twitter:card");
      if (!hasTitle) missing.push("twitter:title");
      deductions.push({
        category: "twitterCards",
        reason: `Missing Twitter Card properties: ${missing.join(", ")}`,
        deduction: PERFECT_CATEGORY_SCORE - score,
      });
    }

    return score;
  }

  /* ═══════════════════════════════════════════════
     Helpers
     ═══════════════════════════════════════════════ */

  /**
   * Build a CategoryScore object for a single category.
   */
  private makeCategoryScore(
    category: string,
    label: string,
    score: number,
    weight: number,
  ): CategoryScore {
    const clampedScore = Math.min(100, Math.max(0, score));
    return Object.freeze({
      category,
      label,
      score: clampedScore,
      weight,
      weightedScore: Math.round(clampedScore * weight * 100) / 100,
      maxWeightedScore: Math.round(100 * weight * 100) / 100,
    });
  }
}
