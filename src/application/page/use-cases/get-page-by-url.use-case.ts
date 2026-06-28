/**
 * Application — GetPageByUrlUseCase.
 *
 * Retrieves a specific page within a scan by its URL.
 * Returns null when the page is not found.
 */

import { type PageEntity } from "@/domain/entities/page.entity";
import { type IPageRepository } from "@/domain/repositories/page.repository";
import {
  GetPageByUrlInputSchema,
  type GetPageByUrlInput,
} from "@/application/page/page.schema";
import { ValidationError } from "@/application/common/errors";
import { fromZodError } from "@/application/common/errors/zod";

export interface GetPageByUrlResult {
  page: PageEntity | null;
}

export class GetPageByUrlUseCase {
  constructor(private readonly pageRepo: IPageRepository) {}

  async execute(input: GetPageByUrlInput): Promise<GetPageByUrlResult> {
    const parsed = GetPageByUrlInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(fromZodError(parsed.error));
    }

    const page = await this.pageRepo.findByUrl({
      scanId: parsed.data.scanId,
      url: parsed.data.url,
    });

    return { page };
  }
}
