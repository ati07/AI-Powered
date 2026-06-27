import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { UpdateOrganizationUseCase } from "@/application/organization/use-cases/update-organization.use-case";
import { DeleteOrganizationUseCase } from "@/application/organization/use-cases/delete-organization.use-case";
import { AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const orgRepo = new PrismaOrganizationRepository();

/**
 * PATCH /api/organizations/[id]
 *
 * Renames an organization. Requires ADMIN or OWNER role.
 *
 * Body: { name: string }
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
    const body = (await request.json()) as { name?: string };

    const useCase = new UpdateOrganizationUseCase(orgRepo);
    const result = await useCase.execute({
      id,
      name: body.name ?? "",
      userId: internalUserId,
    });

    const org = result.organization;

    return NextResponse.json({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        description: org.description,
        timezone: org.timezone,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/organizations/[id]
 *
 * Deletes an organization. Requires OWNER role.
 * Cascade-deletes all associated memberships.
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

    const useCase = new DeleteOrganizationUseCase(orgRepo);
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
