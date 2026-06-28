/**
 * Client-side API helpers for the Scan Dashboard.
 *
 * All requests include Clerk auth cookies automatically.
 */

import type {
  ScanDashboardPagesResponse,
  ScanDashboardQueryParams,
} from "@/features/scan-dashboard/schemas/scan-dashboard-schema";
import type {
  ApiResponse,
  ApiError,
} from "@/features/scans/schemas/scan-schema";

/**
 * Build a query string from the given params, omitting undefined values.
 */
function toQueryString(params: ScanDashboardQueryParams): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

/**
 * Fetch paginated pages with scores for the scan dashboard.
 */
export async function fetchDashboardPages(
  scanId: string,
  params: ScanDashboardQueryParams = {},
): Promise<ScanDashboardPagesResponse> {
  const qs = toQueryString(params);
  const response = await fetch(`/api/scans/${scanId}/pages${qs}`);

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to fetch dashboard pages");
  }

  const body = (await response.json()) as ApiResponse<ScanDashboardPagesResponse>;
  return body.data;
}
