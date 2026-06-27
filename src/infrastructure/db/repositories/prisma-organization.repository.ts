import { prisma } from "@/infrastructure/db/prisma";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { OrganizationEntity, type CreateOrganizationEntityInput } from "@/domain/entities/organization.entity";
import { MembershipEntity, MembershipRole, type CreateMembershipEntityInput } from "@/domain/entities/membership.entity";
import { NotFoundError } from "@/application/common/errors";

/* ──────────────── Mappers ──────────────── */

const membershipRoleMap: Record<string, MembershipRole> = {
  OWNER: MembershipRole.OWNER,
  ADMIN: MembershipRole.ADMIN,
  MEMBER: MembershipRole.MEMBER,
};

const membershipRoleReverseMap: Record<MembershipRole, "OWNER" | "ADMIN" | "MEMBER"> = {
  [MembershipRole.OWNER]: "OWNER",
  [MembershipRole.ADMIN]: "ADMIN",
  [MembershipRole.MEMBER]: "MEMBER",
};

function toDomainOrganization(dbOrg: {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationEntity {
  const input: CreateOrganizationEntityInput = {
    id: dbOrg.id,
    name: dbOrg.name,
    slug: dbOrg.slug,
    logoUrl: dbOrg.logoUrl,
    description: dbOrg.description,
    timezone: dbOrg.timezone,
    createdAt: dbOrg.createdAt,
    updatedAt: dbOrg.updatedAt,
  };
  return new OrganizationEntity(input);
}

function toDomainMembership(dbMembership: {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
}): MembershipEntity {
  const input: CreateMembershipEntityInput = {
    id: dbMembership.id,
    userId: dbMembership.userId,
    organizationId: dbMembership.organizationId,
    role: membershipRoleMap[dbMembership.role] ?? MembershipRole.MEMBER,
    createdAt: dbMembership.createdAt,
  };
  return new MembershipEntity(input);
}

/* ──────────────── Repository ──────────────── */

export class PrismaOrganizationRepository implements IOrganizationRepository {
  async findById(input: { id: string }): Promise<OrganizationEntity | null> {
    const org = await prisma.organization.findUnique({ where: { id: input.id } });
    return org ? toDomainOrganization(org) : null;
  }

  async findBySlug(input: { slug: string }): Promise<OrganizationEntity | null> {
    const org = await prisma.organization.findUnique({ where: { slug: input.slug } });
    return org ? toDomainOrganization(org) : null;
  }

  async findByUserId(input: { userId: string }): Promise<OrganizationEntity[]> {
    const memberships = await prisma.membership.findMany({
      where: { userId: input.userId },
      include: { organization: true },
    });

    return memberships.map((m) => toDomainOrganization(m.organization));
  }

  async findByNameAndOwner(input: {
    name: string;
    ownerUserId: string;
  }): Promise<OrganizationEntity | null> {
    // Find the user's OWNER memberships first
    const ownerMemberships = await prisma.membership.findMany({
      where: {
        userId: input.ownerUserId,
        role: "OWNER",
      },
      include: { organization: true },
    });

    const match = ownerMemberships.find(
      (m) => m.organization.name.toLowerCase() === input.name.toLowerCase(),
    );

    return match ? toDomainOrganization(match.organization) : null;
  }

  async save(input: { organization: OrganizationEntity }): Promise<OrganizationEntity> {
    const data = {
      name: input.organization.name,
      slug: input.organization.slug,
      logoUrl: input.organization.logoUrl,
      description: input.organization.description,
      timezone: input.organization.timezone,
    };

    const saved = await prisma.organization.upsert({
      where: { id: input.organization.id },
      create: {
        id: input.organization.id,
        ...data,
        createdAt: input.organization.createdAt,
        updatedAt: input.organization.updatedAt,
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return toDomainOrganization(saved);
  }

  async delete(input: { id: string }): Promise<void> {
    try {
      // Cascade delete: DB handles memberships via onDelete: Cascade
      await prisma.organization.delete({ where: { id: input.id } });
    } catch {
      throw new NotFoundError("Organization", input.id);
    }
  }

  async createMembership(input: {
    membership: MembershipEntity;
  }): Promise<MembershipEntity> {
    const saved = await prisma.membership.create({
      data: {
        id: input.membership.id,
        userId: input.membership.userId,
        organizationId: input.membership.organizationId,
        role: membershipRoleReverseMap[input.membership.role],
        createdAt: input.membership.createdAt,
      },
    });

    return toDomainMembership(saved);
  }

  async getMemberRole(input: {
    organizationId: string;
    userId: string;
  }): Promise<MembershipRole | null> {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
      },
    });

    return membership ? (membershipRoleMap[membership.role] ?? null) : null;
  }

  async deleteMembershipsByOrganization(organizationId: string): Promise<void> {
    await prisma.membership.deleteMany({ where: { organizationId } });
  }

  async countMemberships(organizationId: string): Promise<number> {
    return prisma.membership.count({ where: { organizationId } });
  }
}
