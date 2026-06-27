import { type IUserRepository } from "@/domain/repositories/user.repository";
import { NotFoundError } from "@/application/common/errors";

export interface GetUserProfileInput {
  userId: string;
}

export interface GetUserProfileResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export class GetUserProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: GetUserProfileInput): Promise<GetUserProfileResult> {
    const user = await this.userRepo.findById({ id: input.userId });

    if (!user) {
      throw new NotFoundError("User", input.userId);
    }

    return {
      id: user.id,
      email: user.email.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      imageUrl: user.imageUrl,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
