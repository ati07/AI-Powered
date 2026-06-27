export enum MembershipRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface MembershipEntityProps {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  createdAt: Date;
}

export class MembershipEntity {
  private readonly props: MembershipEntityProps;

  constructor(props: CreateMembershipEntityInput) {
    this.props = {
      ...props,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get role(): MembershipRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /* ──────────────── Domain Behavior ──────────────── */

  isOwner(): boolean {
    return this.props.role === MembershipRole.OWNER;
  }

  isAdmin(): boolean {
    return this.props.role === MembershipRole.ADMIN;
  }

  isAdminOrOwner(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  changeRole(newRole: MembershipRole): MembershipEntity {
    return new MembershipEntity({
      ...this.props,
      role: newRole,
    });
  }
}

export type CreateMembershipEntityInput = Omit<MembershipEntityProps, "createdAt"> & {
  createdAt?: Date;
};
