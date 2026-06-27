import { WebsiteEntity, type CreateWebsiteEntityInput } from "@/domain/entities/website.entity";
import { Domain } from "@/domain/value-objects/domain";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { MembershipRole } from "@/domain/entities/membership.entity";
import {
  CreateWebsiteInputSchema,
  type CreateWebsiteInput,
} from "@/application/website/website.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/application/common/errors";

export interface CreateWebsiteResult {
  website: WebsiteEntity;
}

/**
 * ── CreateWebsiteUseCase ──────────────────────────────────
 *  Creates a new website in an organization.
 *
 *  Permissions:
 *  - User must be a member of the organization.
 *  - Only OWNER and ADMIN roles can create websites.
 *
 *  Validation:
 *  - Name is 3–100 characters.
 *  - Domain is valid and normalized.
 *  - No duplicate normalized domain within the same organization.
 * ──────────────────────────────────────────────────────────
 */
export class CreateWebsiteUseCase {
  constructor(
    private readonly websiteRepo: IWebsiteRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(input: CreateWebsiteInput): Promise<CreateWebsiteResult> {
    // 1. Validate input
    const parsed = CreateWebsiteInputSchema.parse(input);

    // 2. Check organization exists
    const organization = await this.orgRepo.findById({
      id: parsed.organizationId,
    });

    if (!organization) {
      throw new NotFoundError("Organization", parsed.organizationId);
    }

    // 3. Check membership & permissions (OWNER or ADMIN)
    const role = await this.orgRepo.getMemberRole({
      organizationId: parsed.organizationId,
      userId: parsed.userId,
    });

    if (
      !role ||
      (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN)
    ) {
      throw new ForbiddenError(
        "You do not have permission to create a website in this organization. " +
          "Only ADMIN and OWNER roles can add websites.",
      );
    }

    // 4. Normalize domain
    const domain = Domain.create(parsed.domain);

    // 5. Check for duplicate normalized domain
    const existing = await this.websiteRepo.findByNormalizedDomain({
      organizationId: parsed.organizationId,
      normalizedDomain: domain.getValue(),
    });

    if (existing) {
      throw new ConflictError(
        `A website with domain "${domain.getValue()}" already exists in this organization.`,
      );
    }

    // 6. Create website entity
    const now = new Date();
    const entityInput: CreateWebsiteEntityInput = {
      id: crypto.randomUUID(),
      organizationId: parsed.organizationId,
      name: parsed.name.trim(),
      domain,
      normalizedDomain: domain.getValue(),
      faviconUrl: null,
      verified: false,
      lastScanAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const website = new WebsiteEntity(entityInput);

    // 7. Persist
    const saved = await this.websiteRepo.create({ website, domain });

    return { website: saved };
  }
}
