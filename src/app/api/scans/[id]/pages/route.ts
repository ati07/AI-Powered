import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaScanRepository } from "@/infrastructure/db/repositories/prisma-scan.repository";
import { PrismaPageRepository } from "@/infrastructure/db/repositories/prisma-page.repository";
import { GetScanDashboardPagesUseCase } from "@/application/scan/use-cases/get-scan-dashboard-pages.use-case";
import { AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { PrismaWebsiteRepository } from "@/infrastructure/db/repositories/prisma-website.repository";
import { ForbiddenError } from "@/application/common/errors";

const scanRepo = new PrismaScanRepository();
const pageRepo = new PrismaPageRepository();
const orgRepo = new PrismaOrganizationRepository();
const websiteRepo = new PrismaWebsiteRepository();

/**
 * GET /api/scans/[id]/pages
 *
 * Returns paginated, filtered, and sorted pages with AI Visibility Scores
 * for the scan dashboard.
 *
 * Query parameters:
 *   page                    — Page number (default: 1)
 *   pageSize                — Results per page (default: 25, max: 100)
 *   sortBy                  — Field to sort by (url|score|title|createdAt)
 *   sortDir                 — Sort direction (asc|desc)
 *   minScore / maxScore     — Score range filter
 *   indexability            — indexable|noindex
 *   missingTitle            — true to filter pages without title
 *   missingDescription      — true to filter pages without meta description
 *   missingCanonical        — true to filter pages without canonical
 *   missingStructuredData   — true to filter pages without structured data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { id: scanId } = await params;

    // Verify scan exists and user has access to its organization
    const scan = await scanRepo.findById({ id: scanId });
    if (!scan) {
      return NextResponse.json(
        { error: "Scan not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const website = await websiteRepo.findById({ id: scan.websiteId });
    if (!website) {
      return NextResponse.json(
        { error: "Website not found", code: "NOT_FOUND" },
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

    // Parse query parameters — let Zod coerce string values from the URL
    const sp = request.nextUrl.searchParams;
    const query: Record<string, string> = {};

    for (const key of ["page", "pageSize", "sortBy", "sortDir", "minScore", "maxScore", "indexability", "missingTitle", "missingDescription", "missingCanonical", "missingStructuredData"] as const) {
      const val = sp.get(key);
      if (val !== null) query[key] = val;
    }

    const useCase = new GetScanDashboardPagesUseCase(pageRepo);
    const result = await useCase.execute({ scanId, ...query });

    return NextResponse.json({ data: result });
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
