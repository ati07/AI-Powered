/**
 * Application — Scoring validation schemas.
 *
 * Uses Zod to validate all scoring-related inputs at the application boundary.
 */

import { z } from "zod";

/* ──────────────── Score Page Input ──────────────── */

export const ScorePageInputSchema = z.object({
  pageId: z.string().uuid("Page ID must be a valid UUID"),
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
});

export type ScorePageInput = z.infer<typeof ScorePageInputSchema>;

/* ──────────────── Scan Summary Input ──────────────── */

export const ComputeScanSummaryInputSchema = z.object({
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
});

export type ComputeScanSummaryInput = z.infer<typeof ComputeScanSummaryInputSchema>;
