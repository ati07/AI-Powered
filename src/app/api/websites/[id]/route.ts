import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { PrismaWebsiteRepository } from "@/infrastructure/db/repositories/prisma-website.repository";
import { UpdateWebsiteUseCase } from "@/application/website/use-cases/update-website.use-case";
import { DeleteWebsiteUseCase } from "@/application/website/use-cases/delete-website.use-case";
import { AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const orgRepo = new PrismaOrganizationRepository();
const websiteRepo = new PrismaWebsiteRepository();

/**
 * PATCH /api/websites/[id]
 *
 * Updates a website's name and/or domain.
 * Requires ADMIN or OWNER role in the owning organization.
 *
 * Body: { name?: string, domain?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { id } = await params;
    const body = (await request.json()) as { name?: string; domain?: string };

    const useCase = new UpdateWebsiteUseCase(websiteRepo, orgRepo);
    const result = await useCase.execute({
      id,
      name: body.name,
      domain: body.domain,
      userId: internalUserId,
    });

    const website = result.website;

    return NextResponse.json({
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
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/websites/[id]
 *
 * Deletes a website from its organization.
 * Requires ADMIN or OWNER role in the owning organization.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);
    const { id } = await params;

    const useCase = new DeleteWebsiteUseCase(websiteRepo, orgRepo);
    await useCase.execute({ id, userId: internalUserId });

    return NextResponse.json({ data: { success: true } });
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
