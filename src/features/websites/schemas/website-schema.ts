import { z } from "zod";

/**
 * Form validation schema for creating a website.
 */
export const CreateWebsiteFormSchema = z.object({
  name: z
    .string()
    .min(3, "Website name must be at least 3 characters")
    .max(100, "Website name must be at most 100 characters")
    .trim(),
  domain: z.string().min(1, "Domain is required").trim(),
});

/**
 * Form validation schema for editing a website.
 */
export const EditWebsiteFormSchema = z.object({
  name: z
    .string()
    .min(3, "Website name must be at least 3 characters")
    .max(100, "Website name must be at most 100 characters")
    .trim()
    .optional(),
  domain: z.string().min(1, "Domain is required").trim().optional(),
});

export type CreateWebsiteFormValues = z.infer<typeof CreateWebsiteFormSchema>;
export type EditWebsiteFormValues = z.infer<typeof EditWebsiteFormSchema>;

/**
 * API response shape for a single website.
 */
export interface WebsiteDTO {
  id: string;
  organizationId: string;
  name: string;
  domain: string;
  normalizedDomain: string;
  faviconUrl: string | null;
  verified: boolean;
  lastScanAt: string | null;
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
