/**
 * Application — CreatePageUseCase.
 *
 * Validates the input, builds an immutable PageEntity, and persists it
 * through the repository.  Returns the saved entity on success.
 */

import { PageEntity } from "@/domain/entities/page.entity";
import { type IPageRepository } from "@/domain/repositories/page.repository";
import {
  CreatePageInputSchema,
  type CreatePageInput,
} from "@/application/page/page.schema";
import { ValidationError } from "@/application/common/errors";
import { fromZodError } from "@/application/common/errors/zod";

export interface CreatePageResult {
  page: PageEntity;
}

export class CreatePageUseCase {
  constructor(private readonly pageRepo: IPageRepository) {}

  async execute(input: CreatePageInput): Promise<CreatePageResult> {
    // 1. Validate
    const parsed = CreatePageInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(fromZodError(parsed.error));
    }

    // 2. Build domain entity
    const page = new PageEntity({
      id: crypto.randomUUID(),
      scanId: parsed.data.scanId,
      url: parsed.data.url,
      finalUrl: parsed.data.finalUrl,
      statusCode: parsed.data.statusCode,
      contentType: parsed.data.contentType,
      title: parsed.data.title ?? null,
      metaDescription: parsed.data.metaDescription ?? null,
      canonical: parsed.data.canonical ?? null,
      robots: parsed.data.robots ?? null,
      openGraph: parsed.data.openGraph ?? null,
      twitter: parsed.data.twitter ?? null,
      language: parsed.data.language ?? null,
      charset: parsed.data.charset ?? null,
      viewport: parsed.data.viewport ?? null,
      headings: parsed.data.headings ?? null,
      images: parsed.data.images ?? null,
      links: parsed.data.links ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structuredData: (parsed.data.structuredData ?? null) as any,
      crawlDepth: parsed.data.crawlDepth,
      parentUrl: parsed.data.parentUrl ?? null,
      source: parsed.data.source,
      warnings: parsed.data.warnings ?? null,
      downloadDurationMs: parsed.data.downloadDurationMs,
      extractionDurationMs: parsed.data.extractionDurationMs,
    });

    // 3. Persist
    const saved = await this.pageRepo.create({ page });

    return { page: saved };
  }
}
