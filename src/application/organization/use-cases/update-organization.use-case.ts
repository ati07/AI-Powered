import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { OrganizationEntity } from "@/domain/entities/organization.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { UpdateOrganizationInputSchema, type UpdateOrganizationInput } from "@/application/organization/organization.schema";
import { NotFoundError, ForbiddenError, ConflictError } from "@/application/common/errors";

export interface UpdateOrganizationResult {
  organization: OrganizationEntity;
}

/**
 * ── UpdateOrganizationUseCase ───────────────────────────────
 *  Renames an organization.
 *
 *  Permissions:
 *  - User must have ADMIN or OWNER role.
 *  - Slug remains unchanged after creation.
 *
 *  Validation:
 *  - Name is 3–100 characters.
 *  - No duplicate name for the same owner (excluding current org).
 * ────────────────────────────────────────────────────────────
 */
export class UpdateOrganizationUseCase {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(input: UpdateOrganizationInput): Promise<UpdateOrganizationResult> {
    // 1. Validate input
    const parsed = UpdateOrganizationInputSchema.parse(input);

    // 2. Find organization
    const organization = await this.orgRepo.findById({ id: parsed.id });

    if (!organization) {
      throw new NotFoundError("Organization", parsed.id);
    }

    // 3. Check permissions (ADMIN or OWNER)
    const memberRole = await this.orgRepo.getMemberRole({
      organizationId: parsed.id,
      userId: parsed.userId,
    });

    if (!memberRole || (memberRole !== MembershipRole.OWNER && memberRole !== MembershipRole.ADMIN)) {
      throw new ForbiddenError(
        "You do not have permission to update this organization. " +
          "Only ADMIN and OWNER roles can rename it.",
      );
    }

    const trimmedName = parsed.name.trim();

    // 4. Check for duplicate name (excluding this org)
    const existing = await this.orgRepo.findByNameAndOwner({
      name: trimmedName,
      ownerUserId: parsed.userId,
    });

    if (existing && existing.id !== parsed.id) {
      throw new ConflictError(
        `You already have an organization named "${trimmedName}". ` +
          "Please choose a different name.",
      );
    }

    // 5. Rename (slug stays unchanged)
    const updated = organization.rename(trimmedName);
    const saved = await this.orgRepo.save({ organization: updated });

    return { organization: saved };
  }
}
