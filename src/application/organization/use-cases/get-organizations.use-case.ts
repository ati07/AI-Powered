import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { OrganizationEntity } from "@/domain/entities/organization.entity";
import { GetOrganizationsInputSchema, type GetOrganizationsInput } from "@/application/organization/organization.schema";

export interface GetOrganizationsResult {
  organizations: OrganizationEntity[];
}

/**
 * ── GetOrganizationsUseCase ─────────────────────────────────
 *  Returns all organizations the user belongs to, sorted
 *  alphabetically by name.
 * ────────────────────────────────────────────────────────────
 */
export class GetOrganizationsUseCase {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(input: GetOrganizationsInput): Promise<GetOrganizationsResult> {
    const parsed = GetOrganizationsInputSchema.parse(input);

    const organizations = await this.orgRepo.findByUserId({ userId: parsed.userId });

    // Sort alphabetically (case-insensitive)
    const sorted = [...organizations].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

    return { organizations: sorted };
  }
}
