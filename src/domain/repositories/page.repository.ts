/**
 * Domain — Page Repository interface.
 *
 * Pages are immutable snapshots. No update or delete methods.
 */

import { PageEntity } from "../entities/page.entity";
import { PageScoreEntity } from "../entities/page-score.entity";

/* ──────────────── Input types ──────────────── */

export interface CreatePageInput {
  page: PageEntity;
}

export interface CreatePagesInput {
  pages: PageEntity[];
}

export interface FindPagesByScanInput {
  scanId: string;
}

export interface FindPageByUrlInput {
  scanId: string;
  url: string;
}

/* ──────────────── Paginated query types ──────────────── */

export type ScanPagesSortBy = "url" | "score" | "title" | "createdAt";
export type SortDirection = "asc" | "desc";
export type IndexabilityFilter = "indexable" | "noindex";

export interface FindScanPagesPaginatedInput {
  scanId: string;
  page?: number;
  pageSize?: number;
  sortBy?: ScanPagesSortBy;
  sortDir?: SortDirection;
  minScore?: number;
  maxScore?: number;
  indexability?: IndexabilityFilter;
  missingTitle?: boolean;
  missingDescription?: boolean;
  missingCanonical?: boolean;
  missingStructuredData?: boolean;
}

export interface PageWithScoreItem {
  page: PageEntity;
  score: PageScoreEntity | null;
}

export interface FindScanPagesPaginatedResult {
  items: PageWithScoreItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ──────────────── Repository interface ──────────────── */

export interface IPageRepository {
  /** Persist a single page. */
  create(input: CreatePageInput): Promise<PageEntity>;

  /** Bulk-persist multiple pages in a single transaction. */
  createMany(input: CreatePagesInput): Promise<PageEntity[]>;

  /** Retrieve all pages belonging to a scan, ordered by URL. */
  findByScan(input: FindPagesByScanInput): Promise<PageEntity[]>;

  /** Find a specific page by scan and URL (returns null when not found). */
  findByUrl(input: FindPageByUrlInput): Promise<PageEntity | null>;

  /**
   * Retrieve pages for a scan with optional filtering, sorting, and pagination.
   * Includes the PageScore relation when available.
   */
  findByScanPaginated(
    input: FindScanPagesPaginatedInput,
  ): Promise<FindScanPagesPaginatedResult>;
}
