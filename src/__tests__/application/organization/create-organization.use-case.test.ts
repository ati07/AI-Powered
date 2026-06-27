import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { CreateOrganizationUseCase } from "@/application/organization/use-cases/create-organization.use-case";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { OrganizationEntity } from "@/domain/entities/organization.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { ConflictError } from "@/application/common/errors";

/**
 * Factory for a mock repository with all methods stubbed.
 */
function createMockRepo(): Mocked<IOrganizationRepository> {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByUserId: vi.fn(),
    findByNameAndOwner: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    createMembership: vi.fn(),
    getMemberRole: vi.fn(),
    deleteMembershipsByOrganization: vi.fn(),
    countMemberships: vi.fn(),
  };
}

const ownerId = "00000000-0000-0000-0000-000000000001";

describe("CreateOrganizationUseCase", () => {
  let repo: Mocked<IOrganizationRepository>;
  let useCase: CreateOrganizationUseCase;

  beforeEach(() => {
    repo = createMockRepo();
    useCase = new CreateOrganizationUseCase(repo);
  });

  it("should create an organization with a generated slug", async () => {
    repo.findByNameAndOwner.mockResolvedValue(null);
    repo.findBySlug.mockResolvedValue(null);
    repo.save.mockImplementation(async ({ organization }) => organization);
    repo.createMembership.mockImplementation(async ({ membership }) => membership);

    const result = await useCase.execute({ name: "My Agency", ownerId });

    expect(result.organization.name).toBe("My Agency");
    expect(result.organization.slug).toMatch(/^my-agency-[a-f0-9]+$/);
    expect(result.organization.timezone).toBe("UTC");
    expect(repo.save).toHaveBeenCalledOnce();
    expect(repo.createMembership).toHaveBeenCalledOnce();
  });

  it("should create the creator as OWNER", async () => {
    repo.findByNameAndOwner.mockResolvedValue(null);
    repo.findBySlug.mockResolvedValue(null);
    repo.save.mockImplementation(async ({ organization }) => organization);
    repo.createMembership.mockImplementation(async ({ membership }) => membership);

    await useCase.execute({ name: "Test Org", ownerId });

    const createMembershipCall = repo.createMembership.mock.calls[0];
    expect(createMembershipCall?.[0]?.membership?.role).toBe(MembershipRole.OWNER);
    expect(createMembershipCall?.[0]?.membership?.userId).toBe(ownerId);
  });

  it("should throw ConflictError if the owner already has an org with the same name", async () => {
    repo.findByNameAndOwner.mockResolvedValue(
      new OrganizationEntity({
        id: "existing-org",
        name: "My Agency",
        slug: "my-agency-abc1",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(useCase.execute({ name: "My Agency", ownerId })).rejects.toThrow(ConflictError);
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.createMembership).not.toHaveBeenCalled();
  });

  it("should retry slug generation if the slug already exists", async () => {
    repo.findByNameAndOwner.mockResolvedValue(null);

    // First slug query returns existing (collision), second returns null (ok)
    repo.findBySlug
      .mockResolvedValueOnce(
        new OrganizationEntity({
          id: "other-org",
          name: "Other",
          slug: "my-agency-abc1",
          logoUrl: null,
          description: null,
          timezone: "UTC",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )
      .mockResolvedValueOnce(null);

    repo.save.mockImplementation(async ({ organization }) => organization);
    repo.createMembership.mockImplementation(async ({ membership }) => membership);

    const result = await useCase.execute({ name: "My Agency", ownerId });

    expect(result.organization.name).toBe("My Agency");
    expect(repo.findBySlug).toHaveBeenCalledTimes(2);
  });

  it("should trim whitespace from the name", async () => {
    repo.findByNameAndOwner.mockResolvedValue(null);
    repo.findBySlug.mockResolvedValue(null);
    repo.save.mockImplementation(async ({ organization }) => organization);
    repo.createMembership.mockImplementation(async ({ membership }) => membership);

    const result = await useCase.execute({ name: "  My Agency  ", ownerId });

    expect(result.organization.name).toBe("My Agency");
  });

  it("should throw ValidationError for empty name", async () => {
    await expect(useCase.execute({ name: "", ownerId })).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for names under 3 characters", async () => {
    await expect(useCase.execute({ name: "AB", ownerId })).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for names over 100 characters", async () => {
    const longName = "A".repeat(101);
    await expect(useCase.execute({ name: longName, ownerId })).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for non-UUID ownerId", async () => {
    await expect(
      useCase.execute({ name: "Valid Org", ownerId: "not-a-uuid" }),
    ).rejects.toThrow();
  });
});
