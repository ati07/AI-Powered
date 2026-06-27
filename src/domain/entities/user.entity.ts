import { Email } from "../value-objects/email";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface UserEntityProps {
  id: string;
  clerkId: string;
  email: Email;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  private readonly props: UserEntityProps;

  constructor(props: CreateUserEntityInput) {
    this.props = {
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get clerkId(): string {
    return this.props.clerkId;
  }

  get email(): Email {
    return this.props.email;
  }

  get firstName(): string | null {
    return this.props.firstName;
  }

  get lastName(): string | null {
    return this.props.lastName;
  }

  get fullName(): string | null {
    if (!this.props.firstName) return null;
    return [this.props.firstName, this.props.lastName].filter(Boolean).join(" ");
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /* ──────────────── Domain Behavior ──────────────── */

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  deactivate(): UserEntity {
    return new UserEntity({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  activate(): UserEntity {
    return new UserEntity({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  updateProfile(data: { firstName?: string | null; lastName?: string | null; imageUrl?: string | null }): UserEntity {
    return new UserEntity({
      ...this.props,
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      updatedAt: new Date(),
    });
  }
}

export type CreateUserEntityInput = Omit<UserEntityProps, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};
