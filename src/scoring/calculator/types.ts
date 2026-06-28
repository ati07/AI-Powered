/**
 * Scoring — Domain types for AI Visibility Scoring.
 *
 * These types are shared between the calculator, recommendation engine,
 * and persistence layer.
 */

/* ──────────────── Category Score ──────────────── */

/**
 * A single category score with metadata.
 */
export interface CategoryScore {
  /** Category identifier (e.g. "title", "metaDescription", …). */
  readonly category: string;

  /** Human-readable label (e.g. "Title Tag", "Meta Description"). */
  readonly label: string;

  /** Score contributed (0–100). */
  readonly score: number;

  /** Weight applied to this category (0–1). */
  readonly weight: number;

  /** Weighted contribution to the overall score (score × weight). */
  readonly weightedScore: number;

  /** Maximum possible weighted score for this category (100 × weight). */
  readonly maxWeightedScore: number;
}

/* ──────────────── Deduction ──────────────── */

/**
 * A single deduction explaining why points were lost.
 */
export interface Deduction {
  /** Category this deduction belongs to. */
  readonly category: string;

  /** Human-readable reason for the deduction. */
  readonly reason: string;

  /** Points deducted (0–100 within this category). */
  readonly deduction: number;
}

/* ──────────────── Recommendation ──────────────── */

/**
 * Severity level for a recommendation.
 */
export type RecommendationSeverity = "critical" | "important" | "suggestion";

/**
 * A single deterministic recommendation.
 */
export interface Recommendation {
  /** Unique identifier (deterministic — derived from page ID, category, and rule). */
  readonly id: string;

  /** Category this recommendation belongs to. */
  readonly category: string;

  /** Severity level. */
  readonly severity: RecommendationSeverity;

  /** Short human-readable title (e.g. "Missing Title"). */
  readonly title: string;

  /** Detailed description of the issue. */
  readonly description: string;

  /** Actionable fix text. */
  readonly fix: string;

  /** Backward-compatible alias for {@link fix}. */
  readonly recommendation: string;

  /** Which specific field is affected (e.g. "title", "metaDescription", "h1"). */
  readonly affectedField: string;

  /** Deterministic sort order (lower = more important). */
  readonly order: number;
}

/* ──────────────── Scoring Result ──────────────── */

/**
 * Complete scoring result for a single page.
 */
export interface ScoreResult {
  /** Overall AI Visibility Score (0–100). */
  readonly overallScore: number;

  /** Per-category scoring details. */
  readonly categoryScores: readonly CategoryScore[];

  /** Deductions applied during scoring. */
  readonly deductions: readonly Deduction[];
}

/* ──────────────── Weight Configuration ──────────────── */

/**
 * Configurable weights for each scoring category.
 *
 * All weights are expressed as decimal fractions (0–1).
 * The sum of all weights must equal 1.0 (100%).
 */
export interface ScoringWeights {
  readonly title: number;
  readonly metaDescription: number;
  readonly headingStructure: number;
  readonly canonical: number;
  readonly indexability: number;
  readonly structuredData: number;
  readonly internalLinking: number;
  readonly images: number;
  readonly openGraph: number;
  readonly twitterCards: number;
}

/**
 * Default weight configuration.
 *
 * Derived from the AI Visibility Score formula with the scoring
 * categories flattened to match the extracted SEO metadata.
 *
 * | Category           | Weight | Rationale                    |
 * | ------------------ | -----: | ---------------------------- |
 * | Title              |    15% | Core SEO signal              |
 * | Meta Description   |    15% | CTR & snippet influence      |
 * | Heading Structure  |    10% | Content hierarchy clarity    |
 * | Canonical          |    10% | Duplicate content prevention |
 * | Indexability       |    10% | Robots / noindex check       |
 * | Structured Data    |    10% | Rich results / schema.org    |
 * | Internal Linking   |    10% | Site architecture            |
 * | Images             |    10% | Accessibility & context      |
 * | Open Graph         |     5% | Social sharing              |
 * | Twitter Cards      |     5% | Social sharing              |
 * | **Total**          | **100%** |                              |
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  title: 0.15,
  metaDescription: 0.15,
  headingStructure: 0.10,
  canonical: 0.10,
  indexability: 0.10,
  structuredData: 0.10,
  internalLinking: 0.10,
  images: 0.10,
  openGraph: 0.05,
  twitterCards: 0.05,
};

/* ──────────────── Calculator Interface ──────────────── */

/**
 * Interface for the visibility score calculator.
 * Implementations must be deterministic and side-effect free.
 */
export interface IScoringCalculator {
  /**
   * Calculate the AI Visibility Score for a page.
   *
   * @param page — SEO metadata extracted from a crawled page.
   * @param weights — Optional weight overrides (uses defaults when omitted).
   * @returns A ScoreResult with overall score, category scores, and deductions.
   */
  calculate(
    page: ScorablePage,
    weights?: ScoringWeights,
  ): ScoreResult;
}

/* ──────────────── Scorable Page ──────────────── */

/**
 * The subset of PageEntity fields needed by the scoring engine.
 *
 * This avoids coupling the scoring engine to the full PageEntity,
 * making it easier to test and reuse.
 */
export interface ScorablePage {
  readonly id: string;
  readonly scanId: string;
  /** The page URL, used for canonical self-reference checks. */
  readonly url: string;
  readonly title: string | null;
  readonly metaDescription: string | null;
  readonly canonical: string | null;
  readonly robots: string | null;
  readonly openGraph: Record<string, string> | null;
  readonly twitter: Record<string, string> | null;
  readonly headings: { readonly h1: readonly string[]; readonly h2: readonly string[]; readonly h3: readonly string[]; readonly h4: readonly string[]; readonly h5: readonly string[]; readonly h6: readonly string[] } | null;
  readonly images: ReadonlyArray<{ readonly src: string; readonly alt: string | null }> | null;
  readonly links: ReadonlyArray<{ readonly href: string; readonly text: string; readonly normalizedUrl: string | null; readonly type: "internal" | "external" }> | null;
  readonly structuredData: ReadonlyArray<{ readonly raw: string; readonly json: Record<string, unknown> | unknown[] | null }> | null;
}
