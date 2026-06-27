import { WebsiteEntity } from "@/domain/entities/website.entity";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { GetWebsitesInputSchema, type GetWebsitesInput } from "@/application/website/website.schema";
import { NotFoundError } from "@/application/common/errors";

export interface GetWebsitesResult {
  websites: WebsiteEntity[];
}

/**
 * ── GetWebsitesUseCase ────────────────────────────────────
 *  Returns all websites for an organization, sorted
 *  alphabetically by name.
 *
 *  The caller is responsible for verifying the user is a
 *  member of the organization (done at the API layer).
 * ──────────────────────────────────────────────────────────
 */
export class GetWebsitesUseCase {
  constructor(
    private readonly websiteRepo: IWebsiteRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(input: GetWebsitesInput): Promise<GetWebsitesResult> {
    // 1. Validate input
    const parsed = GetWebsitesInputSchema.parse(input);

    // 2. Verify organization exists
    const organization = await this.orgRepo.findById({
      id: parsed.organizationId,
    });

    if (!organization) {
      throw new NotFoundError("Organization", parsed.organizationId);
    }

    // 3. Fetch websites
    const websites = await this.websiteRepo.findByOrganization({
      organizationId: parsed.organizationId,
    });

    // 4. Sort alphabetically (case-insensitive)
    const sorted = [...websites].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

    return { websites: sorted };
  }
}
