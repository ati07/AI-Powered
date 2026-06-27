import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { DeleteOrganizationInputSchema, type DeleteOrganizationInput } from "@/application/organization/organization.schema";
import { NotFoundError, ForbiddenError } from "@/application/common/errors";

/**
 * ── DeleteOrganizationUseCase ───────────────────────────────
 *  Deletes an organization and all its associated memberships.
 *
 *  Permissions:
 *  - Only OWNER can delete an organization.
 *
 *  Cascading:
 *  - Memberships are cascade-deleted by the database.
 *  - (Future) Websites and scans will also be cascade-deleted.
 * ────────────────────────────────────────────────────────────
 */
export class DeleteOrganizationUseCase {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(input: DeleteOrganizationInput): Promise<void> {
    // 1. Validate input
    const parsed = DeleteOrganizationInputSchema.parse(input);

    // 2. Find organization
    const organization = await this.orgRepo.findById({ id: parsed.id });

    if (!organization) {
      throw new NotFoundError("Organization", parsed.id);
    }

    // 3. Check permissions (only OWNER)
    const memberRole = await this.orgRepo.getMemberRole({
      organizationId: parsed.id,
      userId: parsed.userId,
    });

    if (memberRole !== MembershipRole.OWNER) {
      throw new ForbiddenError(
        "Only the OWNER can delete an organization. " +
          "Contact the organization owner to request deletion.",
      );
    }

    // 4. Delete (cascade handled by DB foreign keys and repository)
    await this.orgRepo.delete({ id: parsed.id });
  }
}
