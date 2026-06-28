/**
 * Application — Page validation schemas.
 *
 * Uses Zod to validate all page-related inputs at the application boundary.
 */

import { z } from "zod";

/* ──────────────── Sub-schemas ──────────────── */

const PageHeadingSchema = z.object({
  h1: z.array(z.string()),
  h2: z.array(z.string()),
  h3: z.array(z.string()),
  h4: z.array(z.string()),
  h5: z.array(z.string()),
  h6: z.array(z.string()),
});

const PageImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().nullable(),
  title: z.string().nullable(),
  loading: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
});

const PageLinkSchema = z.object({
  href: z.string().min(1),
  text: z.string(),
  normalizedUrl: z.string().nullable(),
  type: z.enum(["internal", "external"]),
});

const PageStructuredDataSchema = z.object({
  raw: z.string(),
  json: z.any().nullable(),
});

const PageWarningSchema = z.object({
  source: z.string(),
  message: z.string(),
});

const OpenGraphSchema = z.record(z.string());
const TwitterSchema = z.record(z.string());

/* ──────────────── Main schemas ──────────────── */

/**
 * Schema for creating a single page record.
 */
export const CreatePageInputSchema = z.object({
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
  url: z.string().url("URL must be a valid URL"),
  finalUrl: z.string().url("Final URL must be a valid URL"),
  statusCode: z.number().int().positive("Status code must be a positive integer"),
  contentType: z.string().min(1, "Content type is required"),

  // SEO — all optional / nullable
  title: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  canonical: z.string().nullable().optional(),
  robots: z.string().nullable().optional(),

  // Social
  openGraph: OpenGraphSchema.nullable().optional(),
  twitter: TwitterSchema.nullable().optional(),

  // Structure
  language: z.string().nullable().optional(),
  charset: z.string().nullable().optional(),
  viewport: z.string().nullable().optional(),

  // Collections
  headings: PageHeadingSchema.nullable().optional(),
  images: z.array(PageImageSchema).nullable().optional(),
  links: z.array(PageLinkSchema).nullable().optional(),
  structuredData: z.array(PageStructuredDataSchema).nullable().optional(),

  // Metadata
  crawlDepth: z.number().int().min(0, "Crawl depth must be non-negative"),
  parentUrl: z.string().nullable().optional(),
  source: z.string().min(1, "Source is required"),
  warnings: z.array(PageWarningSchema).nullable().optional(),
  downloadDurationMs: z.number().int().min(0, "Download duration must be non-negative"),
  extractionDurationMs: z.number().int().min(0, "Extraction duration must be non-negative"),
});

/**
 * Schema for bulk-creating multiple pages.
 */
export const CreatePagesInputSchema = z.object({
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
  pages: z.array(
    CreatePageInputSchema.omit({ scanId: true }),
  ).min(1, "At least one page is required"),
});

/**
 * Schema for querying pages by scan.
 */
export const GetPagesByScanInputSchema = z.object({
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
});

/**
 * Schema for querying a single page by scan + URL.
 */
export const GetPageByUrlInputSchema = z.object({
  scanId: z.string().uuid("Scan ID must be a valid UUID"),
  url: z.string().url("URL must be a valid URL"),
});

/* ──────────────── Inferred types ──────────────── */

export type CreatePageInput = z.infer<typeof CreatePageInputSchema>;
export type CreatePagesInput = z.infer<typeof CreatePagesInputSchema>;
export type GetPagesByScanInput = z.infer<typeof GetPagesByScanInputSchema>;
export type GetPageByUrlInput = z.infer<typeof GetPageByUrlInputSchema>;
