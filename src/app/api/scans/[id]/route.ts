import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaScanRepository } from "@/infrastructure/db/repositories/prisma-scan.repository";
import { GetScanUseCase } from "@/application/scan/use-cases/get-scan.use-case";
import { AppError } from "@/application/common/errors";
import { resolveInternalUserId } from "@/infrastructure/auth/clerk/resolve-user";

const scanRepo = new PrismaScanRepository();

/**
 * GET /api/scans/[id]
 *
 * Returns a single scan by its ID.
 * Used for polling scan status and viewing scan details.
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

    await resolveInternalUserId(clerkUserId);
    const { id } = await params;

    const useCase = new GetScanUseCase(scanRepo);
    const result = await useCase.execute({ id });

    const scan = result.scan;

    return NextResponse.json({
      data: {
        id: scan.id,
        websiteId: scan.websiteId,
        status: scan.status,
        startedAt: scan.startedAt?.toISOString() ?? null,
        finishedAt: scan.finishedAt?.toISOString() ?? null,
        pagesFound: scan.pagesFound,
        pagesCrawled: scan.pagesCrawled,
        pagesFailed: scan.pagesFailed,
        error: scan.error,
        averageScore: scan.averageScore ?? null,
        highestScore: scan.highestScore ?? null,
        lowestScore: scan.lowestScore ?? null,
        pagesScored: scan.pagesScored ?? null,
        createdAt: scan.createdAt.toISOString(),
        updatedAt: scan.updatedAt.toISOString(),
      },
    });
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
