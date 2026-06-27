import type { ScanDTO, ApiResponse, ApiError } from "@/features/scans/schemas/scan-schema";

/**
 * Client-side API helpers for scan operations.
 *
 * All requests include Clerk auth cookies automatically.
 */

export async function fetchScans(websiteId: string): Promise<ScanDTO[]> {
  const response = await fetch(`/api/websites/${websiteId}/scans`);

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to fetch scans");
  }

  const body = (await response.json()) as ApiResponse<ScanDTO[]>;
  return body.data;
}

export async function createScan(websiteId: string): Promise<ScanDTO> {
  const response = await fetch(`/api/websites/${websiteId}/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to create scan");
  }

  const body = (await response.json()) as ApiResponse<ScanDTO>;
  return body.data;
}

export async function fetchScan(scanId: string): Promise<ScanDTO> {
  const response = await fetch(`/api/scans/${scanId}`);

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to fetch scan");
  }

  const body = (await response.json()) as ApiResponse<ScanDTO>;
  return body.data;
}
