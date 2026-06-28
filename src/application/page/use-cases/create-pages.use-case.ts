/**
 * Application — CreatePagesUseCase.
 *
 * Bulk-creates multiple immutable PageEntities for the same scan.
 * Validates every page before persisting any of them.
 */

import { PageEntity } from "@/domain/entities/page.entity";
import { type IPageRepository } from "@/domain/repositories/page.repository";
import {
  CreatePagesInputSchema,
  type CreatePagesInput,
} from "@/application/page/page.schema";
import { ValidationError } from "@/application/common/errors";
import { fromZodError } from "@/application/common/errors/zod";

export interface CreatePagesResult {
  pages: PageEntity[];
  count: number;
}

export class CreatePagesUseCase {
  constructor(private readonly pageRepo: IPageRepository) {}

  async execute(input: CreatePagesInput): Promise<CreatePagesResult> {
    // 1. Validate
    const parsed = CreatePagesInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(fromZodError(parsed.error));
    }

    // 2. Build domain entities
    const pages = parsed.data.pages.map((pageData) => {
      return new PageEntity({
        id: crypto.randomUUID(),
        scanId: parsed.data.scanId,
        url: pageData.url,
        finalUrl: pageData.finalUrl,
        statusCode: pageData.statusCode,
        contentType: pageData.contentType,
        title: pageData.title ?? null,
        metaDescription: pageData.metaDescription ?? null,
        canonical: pageData.canonical ?? null,
        robots: pageData.robots ?? null,
        openGraph: pageData.openGraph ?? null,
        twitter: pageData.twitter ?? null,
        language: pageData.language ?? null,
        charset: pageData.charset ?? null,
        viewport: pageData.viewport ?? null,
        headings: pageData.headings ?? null,
        images: pageData.images ?? null,
        links: pageData.links ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        structuredData: (pageData.structuredData ?? null) as any,
        crawlDepth: pageData.crawlDepth,
        parentUrl: pageData.parentUrl ?? null,
        source: pageData.source,
        warnings: pageData.warnings ?? null,
        downloadDurationMs: pageData.downloadDurationMs,
        extractionDurationMs: pageData.extractionDurationMs,
      });
    });

    // 3. Persist all
    const saved = await this.pageRepo.createMany({ pages });

    return {
      pages: saved,
      count: saved.length,
    };
  }
}
