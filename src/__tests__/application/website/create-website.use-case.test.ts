import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { CreateWebsiteUseCase } from "@/application/website/use-cases/create-website.use-case";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { WebsiteEntity } from "@/domain/entities/website.entity";
import { OrganizationEntity } from "@/domain/entities/organization.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { Domain } from "@/domain/value-objects/domain";
import { ConflictError, ForbiddenError, NotFoundError } from "@/application/common/errors";

/**
 * Factory for a mock website repository with all methods stubbed.
 */
function createMockWebsiteRepo(): Mocked<IWebsiteRepository> {
  return {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByNormalizedDomain: vi.fn(),
    findByOrganization: vi.fn(),
    exists: vi.fn(),
    count: vi.fn(),
  };
}

/**
 * Factory for a mock organization repository with relevant methods.
 */
function createMockOrgRepo(): Mocked<IOrganizationRepository> {
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

const organizationId = "00000000-0000-0000-0000-000000000001";
const userId = "00000000-0000-0000-0000-000000000002";

describe("CreateWebsiteUseCase", () => {
  let websiteRepo: Mocked<IWebsiteRepository>;
  let orgRepo: Mocked<IOrganizationRepository>;
  let useCase: CreateWebsiteUseCase;

  beforeEach(() => {
    websiteRepo = createMockWebsiteRepo();
    orgRepo = createMockOrgRepo();
    useCase = new CreateWebsiteUseCase(websiteRepo, orgRepo);
  });

  it("should create a website with normalized domain", async () => {
    orgRepo.findById.mockResolvedValue(
      new OrganizationEntity({
        id: organizationId,
        name: "My Agency",
        slug: "my-agency",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    websiteRepo.findByNormalizedDomain.mockResolvedValue(null);
    websiteRepo.create.mockImplementation(async ({ website }) => website);

    const result = await useCase.execute({
      organizationId,
      name: "My Website",
      domain: "https://WWW.Example.com/",
      userId,
    });

    expect(result.website.name).toBe("My Website");
    expect(result.website.normalizedDomain).toBe("example.com");
    expect(websiteRepo.create).toHaveBeenCalledOnce();
  });

  it("should throw NotFoundError if organization does not exist", async () => {
    orgRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        organizationId,
        name: "My Website",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(websiteRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is not a member", async () => {
    orgRepo.findById.mockResolvedValue(
      new OrganizationEntity({
        id: organizationId,
        name: "My Agency",
        slug: "my-agency",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    orgRepo.getMemberRole.mockResolvedValue(null);

    await expect(
      useCase.execute({
        organizationId,
        name: "My Website",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(websiteRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is a MEMBER (read-only)", async () => {
    orgRepo.findById.mockResolvedValue(
      new OrganizationEntity({
        id: organizationId,
        name: "My Agency",
        slug: "my-agency",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.MEMBER);

    await expect(
      useCase.execute({
        organizationId,
        name: "My Website",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ConflictError if normalized domain already exists", async () => {
    orgRepo.findById.mockResolvedValue(
      new OrganizationEntity({
        id: organizationId,
        name: "My Agency",
        slug: "my-agency",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.ADMIN);
    websiteRepo.findByNormalizedDomain.mockResolvedValue(
      new WebsiteEntity({
        id: "existing-website",
        organizationId,
        name: "Existing",
        normalizedDomain: "example.com",
        domain: Domain.create("https://example.com"),
        faviconUrl: null,
        verified: false,
        lastScanAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({
        organizationId,
        name: "My Website",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow(ConflictError);

    expect(websiteRepo.create).not.toHaveBeenCalled();
  });

  it("should allow ADMIN to create websites", async () => {
    orgRepo.findById.mockResolvedValue(
      new OrganizationEntity({
        id: organizationId,
        name: "My Agency",
        slug: "my-agency",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.ADMIN);
    websiteRepo.findByNormalizedDomain.mockResolvedValue(null);
    websiteRepo.create.mockImplementation(async ({ website }) => website);

    const result = await useCase.execute({
      organizationId,
      name: "My Website",
      domain: "https://example.com",
      userId,
    });

    expect(result.website.name).toBe("My Website");
  });

  it("should trim whitespace from the name", async () => {
    orgRepo.findById.mockResolvedValue(
      new OrganizationEntity({
        id: organizationId,
        name: "My Agency",
        slug: "my-agency",
        logoUrl: null,
        description: null,
        timezone: "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    websiteRepo.findByNormalizedDomain.mockResolvedValue(null);
    websiteRepo.create.mockImplementation(async ({ website }) => website);

    const result = await useCase.execute({
      organizationId,
      name: "  My Website  ",
      domain: "https://example.com",
      userId,
    });

    expect(result.website.name).toBe("My Website");
  });

  it("should throw ValidationError for empty name", async () => {
    await expect(
      useCase.execute({
        organizationId,
        name: "",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow();
    expect(websiteRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for names under 3 characters", async () => {
    await expect(
      useCase.execute({
        organizationId,
        name: "AB",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow();
    expect(websiteRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for non-UUID organizationId", async () => {
    await expect(
      useCase.execute({
        organizationId: "not-a-uuid",
        name: "My Website",
        domain: "https://example.com",
        userId,
      }),
    ).rejects.toThrow();
  });
});
