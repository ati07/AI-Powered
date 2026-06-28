/**
 * Application — GetPagesByScanUseCase.
 *
 * Retrieves all pages belonging to a scan, ordered by URL.
 */

import { type PageEntity } from "@/domain/entities/page.entity";
import { type IPageRepository } from "@/domain/repositories/page.repository";
import {
  GetPagesByScanInputSchema,
  type GetPagesByScanInput,
} from "@/application/page/page.schema";
import { ValidationError } from "@/application/common/errors";
import { fromZodError } from "@/application/common/errors/zod";

export interface GetPagesByScanResult {
  pages: PageEntity[];
  count: number;
}

export class GetPagesByScanUseCase {
  constructor(private readonly pageRepo: IPageRepository) {}

  async execute(input: GetPagesByScanInput): Promise<GetPagesByScanResult> {
    const parsed = GetPagesByScanInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(fromZodError(parsed.error));
    }

    const pages = await this.pageRepo.findByScan({
      scanId: parsed.data.scanId,
    });

    return {
      pages,
      count: pages.length,
    };
  }
}
