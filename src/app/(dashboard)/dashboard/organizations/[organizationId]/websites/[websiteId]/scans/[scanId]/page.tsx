export const dynamic = "force-dynamic";

import { ScanDashboardClient } from "@/features/scan-dashboard/components/scan-dashboard-client";

/**
 * Server component for the Scan Dashboard page.
 *
 * Renders the scan results with summary statistics, page results table,
 * and page detail panel.
 *
 * Uses `force-dynamic` to ensure fresh data on every navigation
 * (scans are interactive, real-time data).
 */
export default async function ScanDashboardPage({
  params,
}: {
  params: Promise<{
    organizationId: string;
    websiteId: string;
    scanId: string;
  }>;
}) {
  const { organizationId, websiteId, scanId } = await params;

  return (
    <ScanDashboardClient
      organizationId={organizationId}
      websiteId={websiteId}
      scanId={scanId}
    />
  );
}
