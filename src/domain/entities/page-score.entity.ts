/**
 * Domain — Page Score Entity.
 *
 * An immutable snapshot of the AI Visibility Score for a single page.
 *
 * Created after a page has been persisted.  Contains the overall score,
 * per-category breakdown, deductions, and deterministic recommendations.
 */

import type {
  CategoryScore,
  Deduction,
  Recommendation,
} from "@/scoring/calculator/types";

/* ──────────────── Entity Props ──────────────── */

export interface PageScoreEntityProps {
  readonly id: string;
  readonly pageId: string;
  readonly scanId: string;

  /** Overall AI Visibility Score (0–100). */
  readonly overallScore: number;

  /** Per-category scoring breakdown. */
  readonly categoryScores: CategoryScore[];

  /** Deductions applied during scoring. */
  readonly deductions: Deduction[];

  /** Generated recommendations. */
  readonly recommendations: Recommendation[];

  /** When the score was computed. */
  readonly scoredAt: Date;
}

/* ──────────────── Entity ──────────────── */

export class PageScoreEntity {
  private readonly props: PageScoreEntityProps;

  constructor(props: PageScoreEntityProps) {
    this.props = { ...props };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get pageId(): string {
    return this.props.pageId;
  }

  get scanId(): string {
    return this.props.scanId;
  }

  get overallScore(): number {
    return this.props.overallScore;
  }

  get categoryScores(): readonly CategoryScore[] {
    return this.props.categoryScores;
  }

  get deductions(): readonly Deduction[] {
    return this.props.deductions;
  }

  get recommendations(): readonly Recommendation[] {
    return this.props.recommendations;
  }

  get scoredAt(): Date {
    return this.props.scoredAt;
  }
}

/* ──────────────── Input type ──────────────── */

export type CreatePageScoreEntityInput = PageScoreEntityProps;
