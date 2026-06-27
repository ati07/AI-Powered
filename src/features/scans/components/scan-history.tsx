"use client";

import type { ScanDTO } from "@/features/scans/schemas/scan-schema";
import { ScanBadge } from "@/features/scans/components/scan-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, RefreshCw, FileSearch } from "lucide-react";

interface ScanHistoryProps {
  scans: ScanDTO[];
  /** Whether the scan list is currently loading. */
  isLoading: boolean;
}

/**
 * Displays the scan history for a website.
 *
 * Shows:
 * - Status badge
 * - Pages found / pages crawled
 * - Started at / finished at
 * - Duration
 * - Error message (if failed)
 *
 * States:
 * - Loading: spinner
 * - Empty: centered empty-state message
 * - Loaded: scrollable list
 */
export function ScanHistory({ scans, isLoading }: ScanHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading scan history…</span>
        </div>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileSearch className="mb-4 h-10 w-10 text-muted-foreground/50" />
        <h3 className="text-base font-semibold">No scans yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Run your first scan to start analyzing the website.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">
        History ({scans.length} {scans.length === 1 ? "scan" : "scans"})
      </h4>
      <div className="space-y-2">
        {scans.map((scan) => (
          <ScanHistoryItem key={scan.id} scan={scan} />
        ))}
      </div>
    </div>
  );
}

function ScanHistoryItem({ scan }: { scan: ScanDTO }) {
  const duration = getDuration(scan.startedAt, scan.finishedAt);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <ScanBadge status={scan.status} />
        </div>
        <CardTitle className="text-xs font-normal text-muted-foreground">
          {formatDate(scan.createdAt)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {scan.pagesFound} found
          </Badge>
          <Badge variant="outline" className="text-xs">
            {scan.pagesCrawled} crawled
          </Badge>
          {scan.startedAt && (
            <span>
              Started {formatDateTime(scan.startedAt)}
            </span>
          )}
          {duration && (
            <span>
              · {duration}
            </span>
          )}
          {scan.finishedAt && (
            <span>
              · Finished {formatDateTime(scan.finishedAt)}
            </span>
          )}
        </div>
        {scan.status === "FAILED" && scan.error && (
          <p className="mt-2 text-xs text-destructive">
            Error: {scan.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getDuration(
  startedAt: string | null,
  finishedAt: string | null,
): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = finishedAt
    ? new Date(finishedAt).getTime()
    : Date.now();
  const ms = end - start;

  if (ms < 1000) return "< 1s";
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
