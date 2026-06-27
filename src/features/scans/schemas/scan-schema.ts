import { z } from "zod";

/**
 * Form validation schema for creating a scan.
 */
export const CreateScanFormSchema = z.object({
  websiteId: z.string().uuid("Website ID must be a valid UUID"),
});

export type CreateScanFormValues = z.infer<typeof CreateScanFormSchema>;

/**
 * Scan status values returned by the API.
 */
export type ScanStatusDTO = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

/**
 * API response shape for a single scan.
 */
export interface ScanDTO {
  id: string;
  websiteId: string;
  status: ScanStatusDTO;
  startedAt: string | null;
  finishedAt: string | null;
  pagesFound: number;
  pagesCrawled: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response wrapper.
 */
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code: string;
}
