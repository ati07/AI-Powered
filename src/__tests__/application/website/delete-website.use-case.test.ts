import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { DeleteWebsiteUseCase } from "@/application/website/use-cases/delete-website.use-case";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { WebsiteEntity } from "@/domain/entities/website.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { Domain } from "@/domain/value-objects/domain";
import { NotFoundError, ForbiddenError } from "@/application/common/errors";

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

describe("DeleteWebsiteUseCase", () => {
  let websiteRepo: Mocked<IWebsiteRepository>;
  let orgRepo: Mocked<IOrganizationRepository>;
  let useCase: DeleteWebsiteUseCase;

  beforeEach(() => {
    websiteRepo = createMockWebsiteRepo();
    orgRepo = createMockOrgRepo();
    useCase = new DeleteWebsiteUseCase(websiteRepo, orgRepo);
  });

  it("should delete a website when user is OWNER", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    websiteRepo.delete.mockResolvedValue();

    await useCase.execute({ id: websiteId, userId });

    expect(websiteRepo.delete).toHaveBeenCalledWith({ id: websiteId });
  });

  it("should delete a website when user is ADMIN", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.ADMIN);
    websiteRepo.delete.mockResolvedValue();

    await useCase.execute({ id: websiteId, userId });

    expect(websiteRepo.delete).toHaveBeenCalledWith({ id: websiteId });
  });

  it("should throw NotFoundError if website does not exist", async () => {
    websiteRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: websiteId, userId }),
    ).rejects.toThrow(NotFoundError);

    expect(websiteRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is MEMBER", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.MEMBER);

    await expect(
      useCase.execute({ id: websiteId, userId }),
    ).rejects.toThrow(ForbiddenError);

    expect(websiteRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is not a member", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: websiteId, userId }),
    ).rejects.toThrow(ForbiddenError);

    expect(websiteRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for non-UUID id", async () => {
    await expect(
      useCase.execute({ id: "not-a-uuid", userId }),
    ).rejects.toThrow();
    expect(websiteRepo.delete).not.toHaveBeenCalled();
  });
});
