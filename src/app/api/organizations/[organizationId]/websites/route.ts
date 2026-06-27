import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { PrismaWebsiteRepository } from "@/infrastructure/db/repositories/prisma-website.repository";
import { CreateWebsiteUseCase } from "@/application/website/use-cases/create-website.use-case";
import { GetWebsitesUseCase } from "@/application/website/use-cases/get-websites.use-case";
import { ForbiddenError, AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const orgRepo = new PrismaOrganizationRepository();
const websiteRepo = new PrismaWebsiteRepository();

/**
 * GET /api/organizations/[organizationId]/websites
 *
 * Returns all websites for an organization.
 * Authenticated members can view websites.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { organizationId } = await params;

    // Verify membership (MEMBER has read-only access)
    const role = await orgRepo.getMemberRole({
      organizationId,
      userId: internalUserId,
    });

    if (!role) {
      throw new ForbiddenError(
        "You are not a member of this organization.",
      );
    }

    const useCase = new GetWebsitesUseCase(websiteRepo, orgRepo);
    const result = await useCase.execute({ organizationId });

    const serialized = result.websites.map((website) => ({
      id: website.id,
      organizationId: website.organizationId,
      name: website.name,
      domain: website.domain.toString(),
      normalizedDomain: website.normalizedDomain,
      faviconUrl: website.faviconUrl,
      verified: website.verified,
      lastScanAt: website.lastScanAt?.toISOString() ?? null,
      createdAt: website.createdAt.toISOString(),
      updatedAt: website.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/organizations/[organizationId]/websites
 *
 * Creates a new website in the organization.
 * Requires ADMIN or OWNER role.
 *
 * Body: { name: string, domain: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { organizationId } = await params;

    const body = (await request.json()) as { name?: string; domain?: string };

    const useCase = new CreateWebsiteUseCase(websiteRepo, orgRepo);
    const result = await useCase.execute({
      organizationId,
      name: body.name ?? "",
      domain: body.domain ?? "",
      userId: internalUserId,
    });

    const website = result.website;

    return NextResponse.json(
      {
        data: {
          id: website.id,
          organizationId: website.organizationId,
          name: website.name,
          domain: website.domain.toString(),
          normalizedDomain: website.normalizedDomain,
          faviconUrl: website.faviconUrl,
          verified: website.verified,
          lastScanAt: website.lastScanAt?.toISOString() ?? null,
          createdAt: website.createdAt.toISOString(),
          updatedAt: website.updatedAt.toISOString(),
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
