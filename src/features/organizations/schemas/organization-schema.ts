import { z } from "zod";

/**
 * Form validation schema for creating an organization.
 */
export const CreateOrganizationFormSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(100, "Organization name must be at most 100 characters")
    .trim(),
});

/**
 * Form validation schema for editing an organization name.
 */
export const EditOrganizationFormSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(100, "Organization name must be at most 100 characters")
    .trim(),
});

export type CreateOrganizationFormValues = z.infer<typeof CreateOrganizationFormSchema>;
export type EditOrganizationFormValues = z.infer<typeof EditOrganizationFormSchema>;

/**
 * API response shape for a single organization.
 */
export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  timezone: string;
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
