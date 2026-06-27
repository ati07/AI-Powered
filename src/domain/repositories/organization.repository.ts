import { OrganizationEntity } from "../entities/organization.entity";
import { MembershipEntity, MembershipRole } from "../entities/membership.entity";

export interface FindOrganizationByIdInput {
  id: string;
}

export interface FindOrganizationBySlugInput {
  slug: string;
}

export interface FindOrganizationsByUserIdInput {
  userId: string;
}

export interface FindByNameAndOwnerInput {
  name: string;
  ownerUserId: string;
}

export interface SaveOrganizationInput {
  organization: OrganizationEntity;
}

export interface DeleteOrganizationInput {
  id: string;
}

export interface CreateMembershipInput {
  membership: MembershipEntity;
}

export interface GetMemberRoleInput {
  organizationId: string;
  userId: string;
}

export interface IOrganizationRepository {
  /** Find an organization by its internal UUID. */
  findById(input: FindOrganizationByIdInput): Promise<OrganizationEntity | null>;

  /** Find an organization by its unique slug. */
  findBySlug(input: FindOrganizationBySlugInput): Promise<OrganizationEntity | null>;

  /** Find all organizations a user belongs to. */
  findByUserId(input: FindOrganizationsByUserIdInput): Promise<OrganizationEntity[]>;

  /** Check if a user already has an organization with the same name. */
  findByNameAndOwner(input: FindByNameAndOwnerInput): Promise<OrganizationEntity | null>;

  /** Create or update an organization. */
  save(input: SaveOrganizationInput): Promise<OrganizationEntity>;

  /** Delete an organization (cascades to memberships). */
  delete(input: DeleteOrganizationInput): Promise<void>;

  /** Create a membership linking a user to an organization. */
  createMembership(input: CreateMembershipInput): Promise<MembershipEntity>;

  /** Get a user's role within an organization. */
  getMemberRole(input: GetMemberRoleInput): Promise<MembershipRole | null>;

  /** Delete all memberships for an organization (used during delete cascade). */
  deleteMembershipsByOrganization(organizationId: string): Promise<void>;

  /** Count memberships for an organization. */
  countMemberships(organizationId: string): Promise<number>;
}
