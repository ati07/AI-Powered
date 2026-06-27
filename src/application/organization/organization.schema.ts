import { z } from "zod";

/**
 * Validation schema for organization names.
 */
export const OrganizationNameSchema = z
  .string()
  .min(3, "Organization name must be at least 3 characters")
  .max(100, "Organization name must be at most 100 characters")
  .trim();

/**
 * Input for creating a new organization.
 */
export const CreateOrganizationInputSchema = z.object({
  name: OrganizationNameSchema,
  ownerId: z.string().uuid("ownerId must be a valid UUID"),
});

/**
 * Input for listing organizations.
 */
export const GetOrganizationsInputSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});

/**
 * Input for updating an organization.
 */
export const UpdateOrganizationInputSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
  name: OrganizationNameSchema,
  userId: z.string().uuid("userId must be a valid UUID"),
});

/**
 * Input for deleting an organization.
 */
export const DeleteOrganizationInputSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
  userId: z.string().uuid("userId must be a valid UUID"),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;
export type GetOrganizationsInput = z.infer<typeof GetOrganizationsInputSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;
export type DeleteOrganizationInput = z.infer<typeof DeleteOrganizationInputSchema>;
