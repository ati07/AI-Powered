import { z } from "zod";

/**
 * ── Shared Validation Schemas ────────────────
 * Used by both client-side forms and server-side validation.
 * Keep them here so the domain/application layer can reference them.
 */

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const SearchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
