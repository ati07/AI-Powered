import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Simple health check for monitoring and load balancers.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 },
  );
}
