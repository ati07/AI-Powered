import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { CreateScanUseCase } from "@/application/scan/use-cases/create-scan.use-case";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import { ScanEntity, ScanStatus } from "@/domain/entities/scan.entity";
import { WebsiteEntity } from "@/domain/entities/website.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { Domain } from "@/domain/value-objects/domain";
import { NotFoundError, ForbiddenError, ConflictError } from "@/application/common/errors";

function createMockScanRepo(): Mocked<IScanRepository> {
  return {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByWebsite: vi.fn(),
    findRunningScan: vi.fn(),
    findNextPending: vi.fn(),
    updateStatus: vi.fn(),
    updateProgress: vi.fn(),
  };
}

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

describe("CreateScanUseCase", () => {
  let scanRepo: Mocked<IScanRepository>;
  let websiteRepo: Mocked<IWebsiteRepository>;
  let orgRepo: Mocked<IOrganizationRepository>;
  let useCase: CreateScanUseCase;

  beforeEach(() => {
    scanRepo = createMockScanRepo();
    websiteRepo = createMockWebsiteRepo();
    orgRepo = createMockOrgRepo();
    useCase = new CreateScanUseCase(scanRepo, websiteRepo, orgRepo);
  });

  it("should create a PENDING scan", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    scanRepo.findRunningScan.mockResolvedValue(null);
    scanRepo.create.mockImplementation(async ({ scan }) => scan);

    const result = await useCase.execute({
      websiteId,
      userId,
    });

    expect(result.scan.status).toBe(ScanStatus.PENDING);
    expect(result.scan.websiteId).toBe(websiteId);
    expect(result.scan.pagesFound).toBe(0);
    expect(result.scan.pagesCrawled).toBe(0);
    expect(result.scan.startedAt).toBeNull();
    expect(result.scan.finishedAt).toBeNull();
    expect(result.scan.error).toBeNull();
    expect(scanRepo.create).toHaveBeenCalledOnce();
  });

  it("should throw NotFoundError if website does not exist", async () => {
    websiteRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ websiteId, userId }),
    ).rejects.toThrow(NotFoundError);

    expect(scanRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is not a member", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(null);

    await expect(
      useCase.execute({ websiteId, userId }),
    ).rejects.toThrow(ForbiddenError);

    expect(scanRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenError if user is MEMBER", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.MEMBER);

    await expect(
      useCase.execute({ websiteId, userId }),
    ).rejects.toThrow(ForbiddenError);

    expect(scanRepo.create).not.toHaveBeenCalled();
  });

  it("should allow ADMIN to create scans", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.ADMIN);
    scanRepo.findRunningScan.mockResolvedValue(null);
    scanRepo.create.mockImplementation(async ({ scan }) => scan);

    const result = await useCase.execute({
      websiteId,
      userId,
    });

    expect(result.scan.status).toBe(ScanStatus.PENDING);
    expect(scanRepo.create).toHaveBeenCalledOnce();
  });

  it("should throw ConflictError if a scan is already RUNNING", async () => {
    websiteRepo.findById.mockResolvedValue(makeWebsite());
    orgRepo.getMemberRole.mockResolvedValue(MembershipRole.OWNER);
    scanRepo.findRunningScan.mockResolvedValue(
      new ScanEntity({
        id: "running-scan",
        websiteId,
        status: ScanStatus.RUNNING,
        startedAt: new Date(),
        finishedAt: null,
        pagesFound: 5,
        pagesCrawled: 2,
        pagesFailed: 0,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ websiteId, userId }),
    ).rejects.toThrow(ConflictError);

    expect(scanRepo.create).not.toHaveBeenCalled();
  });

  it("should throw ValidationError for non-UUID websiteId", async () => {
    await expect(
      useCase.execute({ websiteId: "not-a-uuid", userId }),
    ).rejects.toThrow();

    expect(scanRepo.create).not.toHaveBeenCalled();
  });
});
