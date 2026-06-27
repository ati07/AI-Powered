import type { ScanEntity } from "@/domain/entities/scan.entity";
import type { IScanRepository } from "@/domain/repositories/scan.repository";
import type { IWebsiteRepository } from "@/domain/repositories/website.repository";
import {
  GetScansInputSchema,
  type GetScansInput,
} from "@/application/scan/scan.schema";
import { NotFoundError } from "@/application/common/errors";

export interface GetScansResult {
  scans: ScanEntity[];
}

/**
 * ── GetScansUseCase ─────────────────────────────────────
 *  Returns all scans for a website, newest first.
 *
 *  The API layer is responsible for verifying the user's
 *  membership in the website's organization.
 * ────────────────────────────────────────────────────────
 */
export class GetScansUseCase {
  constructor(
    private readonly scanRepo: IScanRepository,
    private readonly websiteRepo: IWebsiteRepository,
  ) {}

  async execute(input: GetScansInput): Promise<GetScansResult> {
    // 1. Validate input
    const parsed = GetScansInputSchema.parse(input);

    // 2. Verify website exists
    const website = await this.websiteRepo.findById({ id: parsed.websiteId });
    if (!website) {
      throw new NotFoundError("Website", parsed.websiteId);
    }

    // 3. Return scans
    const scans = await this.scanRepo.findByWebsite({
      websiteId: parsed.websiteId,
    });

    return { scans };
  }
}
