/**
 * Application — Scan Dashboard validation schemas.
 *
 * Uses Zod to validate dashboard query inputs at the application boundary.
 */

import { z } from "zod";

/**
 * Schema for paginated scan pages query.
 */
export const GetScanDashboardPagesInputSchema = z.object({
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["url", "score", "title", "createdAt"]).default("url"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  indexability: z.enum(["indexable", "noindex"]).optional(),
  missingTitle: z.coerce.boolean().optional(),
  missingDescription: z.coerce.boolean().optional(),
  missingCanonical: z.coerce.boolean().optional(),
  missingStructuredData: z.coerce.boolean().optional(),
});

/**
 * Input type — accepts raw string values that Zod will coerce.
 * This allows both HTTP query params (strings) and programmatic calls (numbers)
 * to use the same type safely.
 */
export type GetScanDashboardPagesInput = z.input<
  typeof GetScanDashboardPagesInputSchema
>;
