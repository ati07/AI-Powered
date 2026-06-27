import { UserEntity } from "../entities/user.entity";

export interface FindByIdInput {
  id: string;
}

export interface FindByClerkIdInput {
  clerkId: string;
}

export interface FindByEmailInput {
  email: string;
}

export interface SaveUserInput {
  user: UserEntity;
}

export interface DeleteUserInput {
  id: string;
}

export interface IUserRepository {
  /** Find a user by the internal UUID. */
  findById(input: FindByIdInput): Promise<UserEntity | null>;

  /** Find a user by their Clerk external ID. */
  findByClerkId(input: FindByClerkIdInput): Promise<UserEntity | null>;

  /** Find a user by email address. */
  findByEmail(input: FindByEmailInput): Promise<UserEntity | null>;

  /** Persist a new or existing user (upsert). */
  save(input: SaveUserInput): Promise<UserEntity>;

  /** Soft-or-hard delete a user. Returns true if a row was removed. */
  delete(input: DeleteUserInput): Promise<boolean>;

  /** List all users (for admin views). */
  listAll(): Promise<UserEntity[]>;
}
