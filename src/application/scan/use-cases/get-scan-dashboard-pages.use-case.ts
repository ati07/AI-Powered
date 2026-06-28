/**
 * Application — GetScanDashboardPagesUseCase.
 *
 * Retrieves paginated, filtered, and sorted pages with their AI Visibility
 * scores for the scan dashboard.
 */

import { type IPageRepository } from "@/domain/repositories/page.repository";
import {
  GetScanDashboardPagesInputSchema,
  type GetScanDashboardPagesInput,
} from "@/application/scan/dashboard.schema";
import { ValidationError } from "@/application/common/errors";
import { fromZodError } from "@/application/common/errors/zod";
import type { ILogger } from "@/shared/logger";

export interface GetScanDashboardPagesResult {
  items: Array<{
    id: string;
    url: string;
    statusCode: number;
    title: string | null;
    metaDescription: string | null;
    canonical: string | null;
    robots: string | null;
    hasOpenGraph: boolean;
    hasStructuredData: boolean;
    createdAt: string;
    score: {
      overallScore: number;
      categoryScores: Array<{
        category: string;
        label: string;
        score: number;
        weight: number;
        weightedScore: number;
        maxWeightedScore: number;
      }>;
      deductions: Array<{
        category: string;
        reason: string;
        deduction: number;
      }>;
      recommendations: Array<{
        id: string;
        category: string;
        severity: "critical" | "important" | "suggestion";
        title: string;
        description: string;
        fix: string;
        recommendation: string;
        affectedField: string;
        order: number;
      }>;
    } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * ── GetScanDashboardPagesUseCase ──────────────────────────
 *  Returns paginated pages with scores for the scan dashboard.
 *  Handles filtering, sorting, and pagination server-side.
 * ────────────────────────────────────────────────────────
 */
export class GetScanDashboardPagesUseCase {
  constructor(
    private readonly pageRepo: IPageRepository,
    private readonly logger?: ILogger,
  ) {}

  async execute(
    input: GetScanDashboardPagesInput,
  ): Promise<GetScanDashboardPagesResult> {
    // 1. Validate input
    const parsed = GetScanDashboardPagesInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(fromZodError(parsed.error));
    }

    const { scanId, page, pageSize, sortBy, sortDir, ...filters } =
      parsed.data;

    // 2. Fetch paginated pages
    const result = await this.pageRepo.findByScanPaginated({
      scanId,
      page,
      pageSize,
      sortBy,
      sortDir,
      minScore: filters.minScore,
      maxScore: filters.maxScore,
      indexability: filters.indexability,
      missingTitle: filters.missingTitle,
      missingDescription: filters.missingDescription,
      missingCanonical: filters.missingCanonical,
      missingStructuredData: filters.missingStructuredData,
    });

    // 3. Map to serializable result
    const items = result.items.map((item) => ({
      id: item.page.id,
      url: item.page.url,
      statusCode: item.page.statusCode,
      title: item.page.title,
      metaDescription: item.page.metaDescription,
      canonical: item.page.canonical,
      robots: item.page.robots,
      hasOpenGraph: item.page.openGraph !== null,
      hasStructuredData: item.page.structuredData !== null,
      createdAt: item.page.createdAt.toISOString(),
      score: item.score
        ? {
            overallScore: item.score.overallScore,
            categoryScores: [...item.score.categoryScores],
            deductions: [...item.score.deductions],
            recommendations: [...item.score.recommendations].map((r) => ({
              id: r.id,
              category: r.category,
              severity: r.severity,
              title: r.title,
              description: r.description,
              fix: r.fix,
              recommendation: r.recommendation,
              affectedField: r.affectedField,
              order: r.order,
            })),
          }
        : null,
    }));

    this.logger?.info(
      `Dashboard pages: scan=${scanId} page=${page} size=${pageSize} total=${result.total}`,
    );

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }
}
