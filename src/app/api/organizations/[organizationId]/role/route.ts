import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const orgRepo = new PrismaOrganizationRepository();

/**
 * GET /api/organizations/[organizationId]/role
 *
 * Returns the organization name and the authenticated user's role.
 * Used by the UI to determine permissions (show/hide edit/delete buttons).
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

    // Get organization
    const org = await orgRepo.findById({ id: organizationId });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get user's role
    const role = await orgRepo.getMemberRole({
      organizationId,
      userId: internalUserId,
    });

    if (!role) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      name: org.name,
      role,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus },
      );
    }

    console.error("Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
