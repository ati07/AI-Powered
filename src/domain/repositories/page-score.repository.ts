/**
 * Domain — Page Score Repository interface.
 */

import { PageScoreEntity } from "@/domain/entities/page-score.entity";

/* ──────────────── Input types ──────────────── */

export interface CreatePageScoreInput {
  pageScore: PageScoreEntity;
}

export interface FindPageScoresByScanInput {
  scanId: string;
}

export interface FindPageScoreByPageInput {
  pageId: string;
}

/* ──────────────── Repository interface ──────────────── */

export interface IPageScoreRepository {
  /** Persist a page score. */
  save(input: CreatePageScoreInput): Promise<PageScoreEntity>;

  /** Retrieve all scores for a scan. */
  findByScan(input: FindPageScoresByScanInput): Promise<PageScoreEntity[]>;

  /** Find the score for a specific page (null if not scored yet). */
  findByPage(input: FindPageScoreByPageInput): Promise<PageScoreEntity | null>;
}
