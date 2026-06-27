import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { UpdateWebsiteUseCase } from "@/application/website/use-cases/update-website.use-case";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { WebsiteEntity } from "@/domain/entities/website.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { Domain } from "@/domain/value-objects/domain";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/application/common/errors";

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

const websiteId = "00000000-0000-0000-0000-000000000001";
const userId = "00000000-0000-0000-0000-000000000002";
const organizationId = "00000000-0000-0000-0000-000000000003";

function makeWebsite(): WebsiteEntity {
  return new WebsiteEntity({
    id: websiteId,
    organizationId,
    name: "My Website",
    normalizedDomain: "example.com",
    domain: Domain.create("https://example.com"),
    faviconUrl: null,
    verified: false,
    lastScanAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("UpdateWebsiteUseCase", () => {
  let websiteRepo: Mocked<IWebsiteRepository>;
  let orgRepo: Mocked<IOrganizationRepository>;
  let useCase: UpdateWebsiteUseCase;

  beforeEach(() => {
    websiteRepo = createMockWebsiteRepo();
    orgRepo = createMockOrgRepo();
    useCase = new UpdateWebsiteUseCase(websiteRepo, orgRepo);
  });

  it("should update the website name", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.ADMIN);
    websiteRepo.update.mockImplementation(async (input) =>
      makeWebsite().rename(input.name ?? "Original"),
    );

    const result = await useCase.execute({
      id: websiteId,
      name: "Renamed Website",
      userId,
    });

    expect(result.website.name).toBe("Renamed Website");
    expect(websiteRepo.update).toHaveBeenCalledOnce();
  });

  it("should update the website domain", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    websiteRepo.findByNormalizedDomain.mockResolvedValue(null);
    websiteRepo.update.mockImplementation(
      async (input) =>
        new WebsiteEntity({
          id: websiteId,
          organizationId,
          name: "My Website",
          normalizedDomain: input.normalizedDomain ?? "other.com",
          domain: Domain.unsafeCreate(input.normalizedDomain ?? "other.com"),
          faviconUrl: null,
          verified: false,
          lastScanAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    );

    const result = await useCase.execute({
      id: websiteId,
      domain: "https://other.com",
      userId,
    });

    expect(result.website.normalizedDomain).toBe("other.com");
  });

  it("should throw NotFoundError if website does not exist", async () => {
    websiteRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: websiteId,
        name: "Renamed",
        userId,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(websiteRepo.update).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is MEMBER", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.MEMBER);

    await expect(
      useCase.execute({
        id: websiteId,
        name: "Renamed",
        userId,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(websiteRepo.update).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is not a member", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: websiteId,
        name: "Renamed",
        userId,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ConflictError if new domain already exists", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.ADMIN);
    websiteRepo.findByNormalizedDomain.mockResolvedValue(
      new WebsiteEntity({
        id: "other-website",
        organizationId,
        name: "Other",
        normalizedDomain: "other.com",
        domain: Domain.create("https://other.com"),
        faviconUrl: null,
        verified: false,
        lastScanAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({
        id: websiteId,
        domain: "https://other.com",
        userId,
      }),
    ).rejects.toThrow(ConflictError);

    expect(websiteRepo.update).not.toHaveBeenCalled();
  });

  it("should accept unchanged name without updating", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    websiteRepo.update.mockImplementation(async (input) =>
      makeWebsite().rename(input.name ?? "My Website"),
    );

    // Passing same name should still work (no-op update)
    const result = await useCase.execute({
      id: websiteId,
      name: "My Website",
      userId,
    });

    expect(result.website.name).toBe("My Website");
  });
});
