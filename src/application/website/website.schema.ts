import { z } from "zod";

/**
 * A domain name that has already been normalized.
 * Used when the domain was normalized upstream (e.g., by the Domain value object).
 */
export const NormalizedDomainSchema = z
  .string()
  .min(1, "Domain is required")
  .max(253, "Domain must be at most 253 characters")
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/,
    "Invalid domain format",
  );

export const WebsiteNameSchema = z
  .string()
  .min(3, "Website name must be at least 3 characters")
  .max(100, "Website name must be at most 100 characters")
  .trim();

export const CreateWebsiteInputSchema = z.object({
  organizationId: z.string().uuid("Organization ID must be a valid UUID"),
  name: WebsiteNameSchema,
  domain: z.string().min(1, "Domain is required"),
  userId: z.string().uuid("User ID must be a valid UUID"),
});

export const UpdateWebsiteInputSchema = z.object({
  id: z.string().uuid("Website ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
  name: WebsiteNameSchema.optional(),
  domain: z.string().min(1, "Domain is required").optional(),
});

export const DeleteWebsiteInputSchema = z.object({
  id: z.string().uuid("Website ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
});

export const GetWebsitesInputSchema = z.object({
  organizationId: z.string().uuid("Organization ID must be a valid UUID"),
});

export type CreateWebsiteInput = z.infer<typeof CreateWebsiteInputSchema>;
export type UpdateWebsiteInput = z.infer<typeof UpdateWebsiteInputSchema>;
export type DeleteWebsiteInput = z.infer<typeof DeleteWebsiteInputSchema>;
export type GetWebsitesInput = z.infer<typeof GetWebsitesInputSchema>;
