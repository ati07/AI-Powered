import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaOrganizationRepository } from "@/infrastructure/db/repositories/prisma-organization.repository";
import { CreateOrganizationUseCase } from "@/application/organization/use-cases/create-organization.use-case";
import { GetOrganizationsUseCase } from "@/application/organization/use-cases/get-organizations.use-case";
import { AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const orgRepo = new PrismaOrganizationRepository();

/**
 * GET /api/organizations
 *
 * Returns all organizations the authenticated user belongs to,
 * sorted alphabetically.
 */
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);

    const useCase = new GetOrganizationsUseCase(orgRepo);
    const result = await useCase.execute({ userId: internalUserId });

    const serialized = result.organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      description: org.description,
      timezone: org.timezone,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data: serialized });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/organizations
 *
 * Creates a new organization with the authenticated user as OWNER.
 *
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = await resolveInternalUserId(clerkUserId);

    const body = (await request.json()) as { name?: string };

    const useCase = new CreateOrganizationUseCase(orgRepo);
    const result = await useCase.execute({
      name: body.name ?? "",
      ownerId: internalUserId,
    });

    const org = result.organization;

    return NextResponse.json(
      {
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
