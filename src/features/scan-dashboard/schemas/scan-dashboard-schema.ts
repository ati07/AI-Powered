/**
 * Scan Dashboard — API response types.
 */

import type { ApiResponse } from "@/features/scans/schemas/scan-schema";

/* ──────────────── Dashboard Page Item ──────────────── */

/**
 * Score data for a single page in the dashboard.
 */
export interface PageScoreDTO {
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
}

/**
 * A single page result in the scan dashboard.
 */
export interface ScanDashboardPageDTO {
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
  score: PageScoreDTO | null;
}

/* ──────────────── Paginated Response ──────────────── */

/**
 * Paginated response for the scan dashboard pages endpoint.
 */
export interface ScanDashboardPagesResponse {
  items: ScanDashboardPageDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ──────────────── Query Parameters ──────────────── */

/**
 * Query parameters for fetching dashboard pages.
 */
export interface ScanDashboardQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: "url" | "score" | "title" | "createdAt";
  sortDir?: "asc" | "desc";
  minScore?: number;
  maxScore?: number;
  indexability?: "indexable" | "noindex";
  missingTitle?: boolean;
  missingDescription?: boolean;
  missingCanonical?: boolean;
  missingStructuredData?: boolean;
}

/* ──────────────── Derived types ──────────────── */

export type DashboardApiResponse = ApiResponse<ScanDashboardPagesResponse>;
