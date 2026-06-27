import { OrganizationEntity, type CreateOrganizationEntityInput } from "@/domain/entities/organization.entity";
import { MembershipEntity, MembershipRole } from "@/domain/entities/membership.entity";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { Slug } from "@/domain/value-objects/slug";
import { ConflictError } from "@/application/common/errors";
import { CreateOrganizationInputSchema, type CreateOrganizationInput } from "@/application/organization/organization.schema";
import { ZodError } from "zod";

export interface CreateOrganizationResult {
  organization: OrganizationEntity;
}

/**
 * ── CreateOrganizationUseCase ───────────────────────────────
 *  Creates a new organization with the creator as OWNER.
 *
 *  Validates:
 *  - Name is 3–100 characters
 *  - No duplicate organization name for the same owner
 *
 *  Slug is auto-generated from the name + random suffix.
 * ────────────────────────────────────────────────────────────
 */
export class CreateOrganizationUseCase {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(input: CreateOrganizationInput): Promise<CreateOrganizationResult> {
    // 1. Validate input
    const parsed = CreateOrganizationInputSchema.parse(input);

    // 2. Check for duplicate name by same owner
    const existing = await this.orgRepo.findByNameAndOwner({
      name: parsed.name.trim(),
      ownerUserId: parsed.ownerId,
    });

    if (existing) {
      throw new ConflictError(
        `You already have an organization named "${parsed.name}". ` +
          "Please choose a different name.",
      );
    }

    // 3. Generate slug from name
    const slug = Slug.generate(parsed.name);

    // 4. Ensure slug uniqueness at the domain level
    //    (the DB unique constraint is the final guard)
    let finalSlug = slug;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      const existingBySlug = await this.orgRepo.findBySlug({ slug: finalSlug.getValue() });
      if (!existingBySlug) break;
      finalSlug = Slug.generate(parsed.name + " " + randomSuffix());
      attempts++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      // Fallback: use a UUID-based slug
      finalSlug = Slug.create(`org-${crypto.randomUUID().slice(0, 8)}`);
    }

    // 5. Create organization entity
    const now = new Date();
    const orgInput: CreateOrganizationEntityInput = {
      id: crypto.randomUUID(),
      name: parsed.name.trim(),
      slug: finalSlug.getValue(),
      logoUrl: null,
      description: null,
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    };

    const organization = new OrganizationEntity(orgInput);

    // 6. Create OWNER membership
    const membership = new MembershipEntity({
      id: crypto.randomUUID(),
      userId: parsed.ownerId,
      organizationId: organization.id,
      role: MembershipRole.OWNER,
      createdAt: now,
    });

    // 7. Persist (transaction handled by repository)
    const saved = await this.orgRepo.save({ organization });
    await this.orgRepo.createMembership({ membership });

    return { organization: saved };
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}
