/**
 * Application — ScorePageUseCase.
 *
 * Scores a single page using the VisibilityScoreCalculator,
 * generates deterministic recommendations, persists the result,
 * and returns the PageScoreEntity.
 *
 * The use case runs two separate steps:
 *   1. Calculate the AI Visibility Score (deterministic, no side effects)
 *   2. Generate actionable recommendations from page metadata
 *
 * Both are persisted together in a single PageScoreEntity.
 */

import { type PageEntity } from "@/domain/entities/page.entity";
import { PageScoreEntity } from "@/domain/entities/page-score.entity";
import { type IPageScoreRepository } from "@/domain/repositories/page-score.repository";
import { type IScoringCalculator, type ScorablePage } from "@/scoring/calculator/types";
import { VisibilityScoreCalculator } from "@/scoring/calculator/visibility-score-calculator";
import { RecommendationEngine } from "@/scoring/recommendations/recommendation-engine";

export interface ScorePageInput {
  page: PageEntity;
}

export interface ScorePageResult {
  pageScore: PageScoreEntity;
}

export class ScorePageUseCase {
  private readonly calculator: IScoringCalculator;
  private readonly recommendationEngine: RecommendationEngine;

  constructor(
    private readonly pageScoreRepo: IPageScoreRepository,
    calculator?: IScoringCalculator,
    recommendationEngine?: RecommendationEngine,
  ) {
    this.calculator = calculator ?? new VisibilityScoreCalculator();
    this.recommendationEngine = recommendationEngine ?? new RecommendationEngine();
  }

  /**
   * Score a page, generate recommendations, and persist the result.
   *
   * @param input — Contains the persisted PageEntity to score.
   * @returns The saved PageScoreEntity.
   */
  async execute(input: ScorePageInput): Promise<ScorePageResult> {
    const { page } = input;

    // 1. Build a ScorablePage from the entity
    const scorablePage = this.toScorablePage(page);

    // 2. Calculate the score (deterministic, no side effects, no recommendations)
    const scoreResult = this.calculator.calculate(scorablePage);

    // 3. Generate recommendations as a separate step
    const recommendations = this.recommendationEngine.generate(scorablePage);

    // 4. Build and persist the PageScoreEntity
    const pageScore = new PageScoreEntity({
      id: crypto.randomUUID(),
      pageId: page.id,
      scanId: page.scanId,
      overallScore: scoreResult.overallScore,
      categoryScores: [...scoreResult.categoryScores],
      deductions: [...scoreResult.deductions],
      recommendations: [...recommendations],
      scoredAt: new Date(),
    });

    const saved = await this.pageScoreRepo.save({ pageScore });

    return { pageScore: saved };
  }

  /**
   * Convert a PageEntity to a ScorablePage for the scoring engine.
   */
  private toScorablePage(page: PageEntity): ScorablePage {
    return {
      id: page.id,
      scanId: page.scanId,
      url: page.url,
      title: page.title,
      metaDescription: page.metaDescription,
      canonical: page.canonical,
      robots: page.robots,
      openGraph: page.openGraph,
      twitter: page.twitter,
      headings: page.headings,
      images: page.images,
      links: page.links,
      structuredData: page.structuredData,
    };
  }
}
