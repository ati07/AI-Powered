"use client";

import { useScans } from "@/features/scans/hooks/use-scans";
import { RunScanButton } from "@/features/scans/components/run-scan-button";
import { ScanHistory } from "@/features/scans/components/scan-history";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScansSectionProps {
  websiteId: string;
  /** Whether the user can start scans (OWNER or ADMIN). */
  canManage: boolean;
}

/**
 * Combined scans section for the website detail page.
 *
 * Includes:
 * - Run Scan button (permission-aware)
 * - Error banner
 * - Scan history list
 */
export function ScansSection({ websiteId, canManage }: ScansSectionProps) {
  const {
    scans,
    isLoading,
    error,
    refetch,
    startScan,
    clearError,
  } = useScans(websiteId);

  const isRunning = scans.some((s) => s.status === "RUNNING");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scans</h3>
        <div className="flex items-center gap-2">
          <RunScanButton
            isRunning={isRunning}
            onStartScan={startScan}
            canManage={canManage}
          />
          <Button variant="outline" size="sm" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Scan history */}
      <ScanHistory scans={scans} isLoading={isLoading} />
    </div>
  );
}
