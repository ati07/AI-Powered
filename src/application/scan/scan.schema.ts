import { z } from "zod";

/**
 * Schema for creating a new scan.
 */
export const CreateScanInputSchema = z.object({
  websiteId: z.string().uuid("Website ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
});

/**
 * Schema for fetching scans by website.
 */
export const GetScansInputSchema = z.object({
  websiteId: z.string().uuid("Website ID must be a valid UUID"),
});

/**
 * Schema for fetching a single scan by ID.
 */
export const GetScanInputSchema = z.object({
  id: z.string().uuid("Scan ID must be a valid UUID"),
});

export type CreateScanInput = z.infer<typeof CreateScanInputSchema>;
export type GetScansInput = z.infer<typeof GetScansInputSchema>;
export type GetScanInput = z.infer<typeof GetScanInputSchema>;
