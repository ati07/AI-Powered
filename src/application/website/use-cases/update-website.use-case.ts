import { WebsiteEntity } from "@/domain/entities/website.entity";
import { Domain } from "@/domain/value-objects/domain";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { MembershipRole } from "@/domain/entities/membership.entity";
import {
  UpdateWebsiteInputSchema,
  type UpdateWebsiteInput,
} from "@/application/website/website.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/application/common/errors";

export interface UpdateWebsiteResult {
  website: WebsiteEntity;
}

/**
 * ── UpdateWebsiteUseCase ──────────────────────────────────
 *  Updates a website's name and/or domain.
 *
 *  Permissions:
 *  - User must be a member of the owning organization.
 *  - Only OWNER and ADMIN roles can update websites.
 *
 *  Validation:
 *  - Name is 3–100 characters (when provided).
 *  - Domain is valid and normalized (when provided).
 *  - No duplicate normalized domain within the same organization.
 * ──────────────────────────────────────────────────────────
 */
export class UpdateWebsiteUseCase {
  constructor(
    private readonly websiteRepo: IWebsiteRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(input: UpdateWebsiteInput): Promise<UpdateWebsiteResult> {
    // 1. Validate input
    const parsed = UpdateWebsiteInputSchema.parse(input);

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
        "You do not have permission to update this website. " +
          "Only ADMIN and OWNER roles can edit websites.",
      );
    }

    // 4. Apply updates
    let updated = website;

    if (parsed.name !== undefined) {
      updated = updated.updateProfile({ name: parsed.name.trim() });
    }

    if (parsed.domain !== undefined) {
      const domain = Domain.create(parsed.domain);

      // Check for duplicate normalized domain (excluding this website)
      const existing = await this.websiteRepo.findByNormalizedDomain({
        organizationId: website.organizationId,
        normalizedDomain: domain.getValue(),
      });

      if (existing && existing.id !== parsed.id) {
        throw new ConflictError(
          `A website with domain "${domain.getValue()}" already exists in this organization.`,
        );
      }

      updated = updated.changeDomain(domain);
    }

    // 5. Persist
    const saved = await this.websiteRepo.update({
      id: updated.id,
      name: updated.name,
      normalizedDomain: updated.normalizedDomain,
      faviconUrl: updated.faviconUrl,
      verified: updated.verified,
      lastScanAt: updated.lastScanAt,
      updatedAt: updated.updatedAt,
    });

    return { website: saved };
  }
}
