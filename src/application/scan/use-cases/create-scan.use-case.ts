import { ScanEntity, ScanStatus } from "@/domain/entities/scan.entity";
import { MembershipRole } from "@/domain/entities/membership.entity";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import { type IOrganizationRepository } from "@/domain/repositories/organization.repository";
import {
  CreateScanInputSchema,
  type CreateScanInput,
} from "@/application/scan/scan.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/application/common/errors";

export interface CreateScanResult {
  scan: ScanEntity;
}

/**
 * ── CreateScanUseCase ──────────────────────────────────
 *  Creates a new PENDING scan for a website.
 *
 *  Permissions:
 *  - User must be a member of the website's organization.
 *  - Only OWNER and ADMIN roles can create scans.
 *  - A website can have at most one RUNNING scan at a time.
 *
 *  Initial status is PENDING.
 * ──────────────────────────────────────────────────────
 */
export class CreateScanUseCase {
  constructor(
    private readonly scanRepo: IScanRepository,
    private readonly websiteRepo: IWebsiteRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(input: CreateScanInput): Promise<CreateScanResult> {
    // 1. Validate input
    const parsed = CreateScanInputSchema.parse(input);

    // 2. Verify website exists
    const website = await this.websiteRepo.findById({ id: parsed.websiteId });
    if (!website) {
      throw new NotFoundError("Website", parsed.websiteId);
    }

    // 3. Check membership & permissions (OWNER or ADMIN)
    const role = await this.orgRepo.getMemberRole({
      organizationId: website.organizationId,
      userId: parsed.userId,
    });

    if (
      !role ||
      (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN)
    ) {
      throw new ForbiddenError(
        "You do not have permission to start a scan. " +
          "Only ADMIN and OWNER roles can start scans.",
      );
    }

    // 4. Ensure no RUNNING scan already exists for this website
    const running = await this.scanRepo.findRunningScan({
      websiteId: parsed.websiteId,
    });

    if (running) {
      throw new ConflictError(
        "A scan is already running for this website. " +
          "Please wait for the current scan to complete before starting a new one.",
      );
    }

    // 5. Create scan entity (status = PENDING)
    const now = new Date();
    const scan = new ScanEntity({
      id: crypto.randomUUID(),
      websiteId: parsed.websiteId,
      status: ScanStatus.PENDING,
      startedAt: null,
      finishedAt: null,
      pagesFound: 0,
      pagesCrawled: 0,
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Persist
    const saved = await this.scanRepo.create({ scan });

    return { scan: saved };
  }
}
