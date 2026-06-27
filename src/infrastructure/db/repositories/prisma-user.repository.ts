import { type IUserRepository, type FindByIdInput, type FindByClerkIdInput, type FindByEmailInput, type SaveUserInput, type DeleteUserInput } from "@/domain/repositories/user.repository";
import { UserEntity, UserRole } from "@/domain/entities/user.entity";
import { Email } from "@/domain/value-objects/email";
import { prisma } from "@/infrastructure/db/prisma";
import { NotFoundError } from "@/application/common/errors";

/**
 * Maps between the Prisma User model and the domain UserEntity.
 */
const roleMap: Record<string, UserRole> = {
  USER: UserRole.USER,
  ADMIN: UserRole.ADMIN,
};

const roleReverseMap: Record<UserRole, "USER" | "ADMIN"> = {
  [UserRole.USER]: "USER",
  [UserRole.ADMIN]: "ADMIN",
};

function toDomain(dbUser: {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserEntity {
  return new UserEntity({
    id: dbUser.id,
    clerkId: dbUser.clerkId,
    email: Email.unsafeCreate(dbUser.email),
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    imageUrl: dbUser.imageUrl,
    role: roleMap[dbUser.role] ?? UserRole.USER,
    isActive: dbUser.isActive,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  });
}

export class PrismaUserRepository implements IUserRepository {
  async findById(input: FindByIdInput): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id: input.id } });
    return user ? toDomain(user) : null;
  }

  async findByClerkId(input: FindByClerkIdInput): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { clerkId: input.clerkId } });
    return user ? toDomain(user) : null;
  }

  async findByEmail(input: FindByEmailInput): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    return user ? toDomain(user) : null;
  }

  async save(input: SaveUserInput): Promise<UserEntity> {
    const data = {
      clerkId: input.user.clerkId,
      email: input.user.email.toString(),
      firstName: input.user.firstName,
      lastName: input.user.lastName,
      imageUrl: input.user.imageUrl,
      role: roleReverseMap[input.user.role],
      isActive: input.user.isActive,
    };

    const saved = await prisma.user.upsert({
      where: { id: input.user.id },
      create: {
        id: input.user.id,
        ...data,
        createdAt: input.user.createdAt,
        updatedAt: input.user.updatedAt,
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return toDomain(saved);
  }

  async delete(input: DeleteUserInput): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id: input.id } });
      return true;
    } catch {
      throw new NotFoundError("User", input.id);
    }
  }

  async listAll(): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map(toDomain);
  }
}
