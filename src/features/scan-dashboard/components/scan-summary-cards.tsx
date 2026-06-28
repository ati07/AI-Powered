"use client";

import type { ScanDTO } from "@/features/scans/schemas/scan-schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreBadge } from "@/features/scan-dashboard/components/score-badge";
import {
  Globe,
  RefreshCw,
  XCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";

interface ScanSummaryCardsProps {
  scan: ScanDTO;
}

/**
 * Displays scan summary statistics in a grid of cards.
 *
 * Split into two groups:
 * 1. Scan stats — status, timing, page counts
 * 2. AI Visibility stats — average, highest, lowest, pages scored
 */
export function ScanSummaryCards({ scan }: ScanSummaryCardsProps) {
  const duration = getDuration(scan.startedAt, scan.finishedAt);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* ── Scan Stats ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pages Found
          </CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scan.pagesFound}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pages Crawled
          </CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scan.pagesCrawled}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pages Failed
          </CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scan.pagesFailed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Duration
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{duration}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {scan.startedAt && formatDate(scan.startedAt)}
          </p>
        </CardContent>
      </Card>

      {/* ── AI Visibility Stats ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Score
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {scan.averageScore !== null ? (
            <div className="flex items-center gap-2">
              <ScoreBadge score={Math.round(scan.averageScore)} size="lg" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Highest Score
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {scan.highestScore !== null ? (
            <div className="flex items-center gap-2">
              <ScoreBadge score={Math.round(scan.highestScore)} size="lg" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lowest Score
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {scan.lowestScore !== null ? (
            <div className="flex items-center gap-2">
              <ScoreBadge score={Math.round(scan.lowestScore)} size="lg" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pages Scored
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {scan.pagesScored ?? "—"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────── Helpers ──────────────── */

function getDuration(
  startedAt: string | null,
  finishedAt: string | null,
): string {
  if (!startedAt) return "—";
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
    return new Date(isoString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
