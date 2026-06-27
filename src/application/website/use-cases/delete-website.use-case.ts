import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { MembershipRole } from "@/domain/entities/membership.entity";
import {
  DeleteWebsiteInputSchema,
  type DeleteWebsiteInput,
} from "@/application/website/website.schema";
import { NotFoundError, ForbiddenError } from "@/application/common/errors";

/**
 * ── DeleteWebsiteUseCase ──────────────────────────────────
 *  Deletes a website from an organization.
 *
 *  Permissions:
 *  - User must be a member of the owning organization.
 *  - Only OWNER and ADMIN roles can delete websites.
 *
 *  Cascading:
 *  - (Future) Scans, pages, issues, and recommendations will
 *    be cascade-deleted by the database.
 * ──────────────────────────────────────────────────────────
 */
export class DeleteWebsiteUseCase {
  constructor(
    private readonly websiteRepo: IWebsiteRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(input: DeleteWebsiteInput): Promise<void> {
    // 1. Validate input
    const parsed = DeleteWebsiteInputSchema.parse(input);

    // 2. Find website
    const website = await this.websiteRepo.findById({ id: parsed.id });

    if (!website) {
      throw new NotFoundError("Website", parsed.id);
    }

    // 3. Check membership & permissions (OWNER or ADMIN)
    const role = await this.orgRepo.getMemberRole({
      organizationId: website.organizationId,
      userId: parsed.userId,
    });

    if (
      !role ||
      (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN)
    ) {
      throw new ForbiddenError(
        "You do not have permission to delete this website. " +
          "Only ADMIN and OWNER roles can delete websites.",
      );
    }

    // 4. Delete (cascade handled by DB foreign keys)
    await this.websiteRepo.delete({ id: parsed.id });
  }
}
