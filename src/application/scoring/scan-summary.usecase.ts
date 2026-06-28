/**
 * Application — ScanSummaryUseCase.
 *
 * Computes the AI Visibility Score summary for a completed scan:
 * average, highest, lowest scores, and total pages scored.
 *
 * Updates the scan entity with the computed summary values.
 */

import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type IPageScoreRepository } from "@/domain/repositories/page-score.repository";
import {
  ComputeScanSummaryInputSchema,
  type ComputeScanSummaryInput,
} from "@/application/scoring/scoring.schema";
import { NotFoundError, ValidationError } from "@/application/common/errors";
import { fromZodError } from "@/application/common/errors/zod";

export interface ComputeScanSummaryResult {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  pagesScored: number;
}

export class ScanSummaryUseCase {
  constructor(
    private readonly scanRepo: IScanRepository,
    private readonly pageScoreRepo: IPageScoreRepository,
  ) {}

  /**
   * Compute the visibility score summary for a scan and persist it.
   *
   * @param input — The scan ID to compute the summary for.
   * @returns The computed summary statistics.
   */
  async execute(
    input: ComputeScanSummaryInput,
  ): Promise<ComputeScanSummaryResult> {
    // 1. Validate input
    const parsed = ComputeScanSummaryInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(fromZodError(parsed.error));
    }

    // 2. Verify the scan exists
    const scan = await this.scanRepo.findById({ id: parsed.data.scanId });
    if (!scan) {
      throw new NotFoundError("Scan", parsed.data.scanId);
    }

    // 3. Fetch all page scores for this scan
    const pageScores = await this.pageScoreRepo.findByScan({
      scanId: parsed.data.scanId,
    });

    if (pageScores.length === 0) {
      // No scores — this can happen if no pages were crawled
      const result: ComputeScanSummaryResult = {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        pagesScored: 0,
      };

      // Persist summary
      await this.scanRepo.update({
        id: parsed.data.scanId,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        pagesScored: 0,
        updatedAt: new Date(),
      });

      return result;
    }

    // 4. Compute statistics
    const scores = pageScores.map((ps) => ps.overallScore);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = Math.round(
      scores.reduce((sum, s) => sum + s, 0) / scores.length,
    );
    const pagesScored = scores.length;

    // 5. Persist summary to the scan
    await this.scanRepo.update({
      id: parsed.data.scanId,
      averageScore,
      highestScore,
      lowestScore,
      pagesScored,
      updatedAt: new Date(),
    });

    return { averageScore, highestScore, lowestScore, pagesScored };
  }
}
