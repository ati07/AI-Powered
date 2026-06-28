"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScanDTO } from "@/features/scans/schemas/scan-schema";
import type {
  ScanDashboardPagesResponse,
  ScanDashboardQueryParams,
} from "@/features/scan-dashboard/schemas/scan-dashboard-schema";
import {
  fetchScan,
} from "@/features/scans/api/scan-client";
import {
  fetchDashboardPages,
} from "@/features/scan-dashboard/api/scan-dashboard-client";

interface UseScanDashboardReturn {
  /** Scan metadata. */
  scan: ScanDTO | null;
  /** Paginated pages with scores. */
  pagesData: ScanDashboardPagesResponse | null;
  /** Currently loading the initial data. */
  isLoading: boolean;
  /** Loading more pages (pagination). */
  isPageLoading: boolean;
  /** Error message if the last operation failed. */
  error: string | null;
  /** Current query parameters. */
  queryParams: ScanDashboardQueryParams;
  /** Update query parameters (resets to page 1). */
  setQueryParams: (params: ScanDashboardQueryParams) => void;
  /** Change page (preserves other filters/sort). */
  setPage: (page: number) => void;
  /** Refetch all data. */
  refetch: () => Promise<void>;
}

/**
 * Hook for the Scan Dashboard.
 *
 * Fetches scan metadata and paginated page results with filtering/sorting.
 * Follows the useState / useEffect pattern used throughout the codebase.
 */
export function useScanDashboard(scanId: string): UseScanDashboardReturn {
  const [scan, setScan] = useState<ScanDTO | null>(null);
  const [pagesData, setPagesData] = useState<ScanDashboardPagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParamsInternal] = useState<ScanDashboardQueryParams>({});

  /**
   * Update query parameters — resets to page 1 when a filter/sort changes.
   */
  const setQueryParams = useCallback((params: ScanDashboardQueryParams) => {
    setQueryParamsInternal((_prev) => ({
      ...params,
      // Reset to page 1 when filters or sort change (unless only page changed)
      page: params.page ?? 1,
    }));
  }, []);

  /**
   * Change page while preserving existing filters/sort.
   */
  const setPage = useCallback((page: number) => {
    setQueryParamsInternal((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Fetch scan metadata.
   */
  const loadScan = useCallback(async () => {
    try {
      const data = await fetchScan(scanId);
      setScan(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load scan",
      );
    }
  }, [scanId]);

  /**
   * Fetch paginated pages.
   */
  const loadPages = useCallback(async (params: ScanDashboardQueryParams) => {
    setIsPageLoading(true);
    setError(null);

    try {
      const data = await fetchDashboardPages(scanId, params);
      setPagesData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load pages",
      );
    } finally {
      setIsPageLoading(false);
    }
  }, [scanId]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [scanData] = await Promise.all([
          fetchScan(scanId),
        ]);
        if (!cancelled) {
          setScan(scanData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load scan data",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  // Fetch pages when query params change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsPageLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardPages(scanId, queryParams);
        if (!cancelled) {
          setPagesData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load pages",
          );
        }
      } finally {
        if (!cancelled) {
          setIsPageLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [scanId, queryParams]);

  const refetch = useCallback(async () => {
    await Promise.all([loadScan(), loadPages(queryParams)]);
  }, [loadScan, loadPages, queryParams]);

  return {
    scan,
    pagesData,
    isLoading,
    isPageLoading,
    error,
    queryParams,
    setQueryParams,
    setPage,
    refetch,
  };
}
