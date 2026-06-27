import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { PrismaWebsiteRepository } from "@/infrastructure/db/repositories/prisma-website.repository";
import { PrismaScanRepository } from "@/infrastructure/db/repositories/prisma-scan.repository";
import { CreateScanUseCase } from "@/application/scan/use-cases/create-scan.use-case";
import { GetScansUseCase } from "@/application/scan/use-cases/get-scans.use-case";
import { AppError, ForbiddenError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const orgRepo = new PrismaOrganizationRepository();
const websiteRepo = new PrismaWebsiteRepository();
const scanRepo = new PrismaScanRepository();

/**
 * GET /api/websites/[id]/scans
 *
 * Returns all scans for a website, newest first.
 * Authenticated members can view scans.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { id: websiteId } = await params;

    // Verify website exists and user has membership
    const website = await websiteRepo.findById({ id: websiteId });
    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 },
      );
    }

    const role = await orgRepo.getMemberRole({
      organizationId: website.organizationId,
      userId: internalUserId,
    });

    if (!role) {
      throw new ForbiddenError(
        "You are not a member of this organization.",
      );
    }

    const useCase = new GetScansUseCase(scanRepo, websiteRepo);
    const result = await useCase.execute({ websiteId });

    const serialized = result.scans.map((scan) => ({
      id: scan.id,
      websiteId: scan.websiteId,
      status: scan.status,
      startedAt: scan.startedAt?.toISOString() ?? null,
      finishedAt: scan.finishedAt?.toISOString() ?? null,
      pagesFound: scan.pagesFound,
      pagesCrawled: scan.pagesCrawled,
      error: scan.error,
      createdAt: scan.createdAt.toISOString(),
      updatedAt: scan.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/websites/[id]/scans
 *
 * Starts a new scan for the website.
 * Requires ADMIN or OWNER role in the owning organization.
 * Only one RUNNING scan per website at a time.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { id: websiteId } = await params;

    const useCase = new CreateScanUseCase(scanRepo, websiteRepo, orgRepo);
    const result = await useCase.execute({
      websiteId,
      userId: internalUserId,
    });

    const scan = result.scan;

    return NextResponse.json(
      {
        data: {
          id: scan.id,
          websiteId: scan.websiteId,
          status: scan.status,
          startedAt: scan.startedAt?.toISOString() ?? null,
          finishedAt: scan.finishedAt?.toISOString() ?? null,
          pagesFound: scan.pagesFound,
          pagesCrawled: scan.pagesCrawled,
          error: scan.error,
          createdAt: scan.createdAt.toISOString(),
          updatedAt: scan.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}

/* ──────────────── Helpers ──────────────── */

function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.httpStatus },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  );
}
