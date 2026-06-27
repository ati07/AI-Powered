import { type IUserRepository } from "@/domain/repositories/user.repository";
import { UserEntity, type CreateUserEntityInput, UserRole } from "@/domain/entities/user.entity";
import { Email } from "@/domain/value-objects/email";

/**
 * Input from Clerk webhook or server-side auth callback.
 */
export interface AuthenticateUserInput {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Result returned after authenticating / syncing a user.
 */
export interface AuthenticateUserResult {
  user: UserEntity;
  isNew: boolean;
}

/**
 * ── AuthenticateUserUseCase ───────────────────────────────────
 *  Ensures a user exists in the local DB matching the Clerk identity.
 *  If the user already exists (by clerkId), their profile is updated.
 *  If not, a new user record is created.
 *
 *  Dependencies: IUserRepository
 *  Framework-agnostic — pure application logic.
 * ───────────────────────────────────────────────────────────────
 */
export class AuthenticateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserResult> {
    const email = Email.create(input.email);

    // Try to find existing user by Clerk ID
    const existing = await this.userRepo.findByClerkId({ clerkId: input.clerkId });

    if (existing) {
      // Update profile fields on every login to stay in sync with Clerk
      const updated = existing.updateProfile({
        firstName: input.firstName,
        lastName: input.lastName,
        imageUrl: input.imageUrl,
      });

      const saved = await this.userRepo.save({ user: updated });
      return { user: saved, isNew: false };
    }

    // Create new user
    const userInput: CreateUserEntityInput = {
      id: crypto.randomUUID(),
      clerkId: input.clerkId,
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      imageUrl: input.imageUrl,
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUser = new UserEntity(userInput);
    const saved = await this.userRepo.save({ user: newUser });
    return { user: saved, isNew: true };
  }
}
