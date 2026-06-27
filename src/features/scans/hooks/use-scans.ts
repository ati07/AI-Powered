"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ScanDTO } from "@/features/scans/schemas/scan-schema";
import {
  fetchScans,
  createScan,
} from "@/features/scans/api/scan-client";

interface UseScansReturn {
  /** List of scans for the website, newest first. */
  scans: ScanDTO[];
  /** Currently loading state. */
  isLoading: boolean;
  /** Error message if the last operation failed. */
  error: string | null;
  /** Refetch scans from the server. */
  refetch: () => Promise<void>;
  /** Create a new scan. */
  startScan: () => Promise<ScanDTO>;
  /** Clear the current error. */
  clearError: () => void;
}

/**
 * Hook for scan operations within a website.
 *
 * Automatically refreshes the scan list every 5 seconds
 * when there is a PENDING or RUNNING scan so the UI
 * stays in sync with the background worker.
 *
 * Provides loading, error, and empty states for the UI.
 */
export function useScans(websiteId: string): UseScansReturn {
  const [scans, setScans] = useState<ScanDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refetch = useCallback(async () => {
    setError(null);

    try {
      const data = await fetchScans(websiteId);
      setScans(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load scans",
      );
    }
  }, [websiteId]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    refetch().finally(() => setIsLoading(false));
  }, [refetch]);

  // Auto-refresh every 5 seconds when there are active scans
  useEffect(() => {
    const hasActive = scans.some(
      (s) => s.status === "PENDING" || s.status === "RUNNING",
    );

    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(() => {
        refetch();
      }, 5000);
    }

    if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [scans, refetch]);

  const startScan = useCallback(async (): Promise<ScanDTO> => {
    setError(null);
    try {
      const created = await createScan(websiteId);
      setScans((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start scan";
      setError(message);
      throw err;
    }
  }, [websiteId]);

  return {
    scans,
    isLoading,
    error,
    refetch,
    startScan,
    clearError,
  };
}
