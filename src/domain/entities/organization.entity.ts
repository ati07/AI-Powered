export interface OrganizationEntityProps {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizationEntity {
  private readonly props: OrganizationEntityProps;

  constructor(props: CreateOrganizationEntityInput) {
    this.props = {
      ...props,
      logoUrl: props.logoUrl ?? null,
      description: props.description ?? null,
      timezone: props.timezone ?? "UTC",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get logoUrl(): string | null {
    return this.props.logoUrl;
  }

  get description(): string | null {
    return this.props.description;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /* ──────────────── Domain Behavior ──────────────── */

  /**
   * Rename the organization. Slug stays unchanged after creation.
   */
  rename(newName: string): OrganizationEntity {
    return new OrganizationEntity({
      ...this.props,
      name: newName,
      updatedAt: new Date(),
    });
  }

  /**
   * Update mutable profile fields.
   */
  updateProfile(data: {
    description?: string | null;
    logoUrl?: string | null;
    timezone?: string;
  }): OrganizationEntity {
    return new OrganizationEntity({
      ...this.props,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      updatedAt: new Date(),
    });
  }
}

export type CreateOrganizationEntityInput = Omit<
  OrganizationEntityProps,
  "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};
