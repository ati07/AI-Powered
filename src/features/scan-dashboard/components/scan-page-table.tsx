"use client";

import { useCallback } from "react";
import type { ScanDashboardPageDTO } from "@/features/scan-dashboard/schemas/scan-dashboard-schema";
import type { ScanDashboardQueryParams } from "@/features/scan-dashboard/schemas/scan-dashboard-schema";
import { ScoreBadge } from "@/features/scan-dashboard/components/score-badge";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink } from "lucide-react";

interface ScanPageTableProps {
  pages: ScanDashboardPageDTO[];
  isLoading: boolean;
  queryParams: ScanDashboardQueryParams;
  selectedPageId: string | null;
  onPageSelect: (pageId: string) => void;
  onSortChange: (sortBy: "url" | "score" | "title" | "createdAt") => void;
}

/**
 * Sort indicator component.
 */
function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) return null;
  return (
    <span className="ml-1 text-xs">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

/**
 * Displays page results in a sortable table.
 *
 * Columns:
 * - URL (clickable to select)
 * - Status code
 * - AI Visibility Score (color-coded)
 * - Title
 * - Meta Description
 * - Canonical
 * - Indexability
 * - Structured Data indicator
 * - Open Graph indicator
 * - Last Crawled
 */
export function ScanPageTable({
  pages,
  isLoading,
  queryParams,
  selectedPageId,
  onPageSelect,
  onSortChange,
}: ScanPageTableProps) {
  const currentSortBy = queryParams.sortBy ?? "url";
  const currentSortDir = queryParams.sortDir ?? "asc";

  const handleHeaderClick = useCallback(
    (field: "url" | "score" | "title" | "createdAt") => {
      onSortChange(field);
    },
    [onSortChange],
  );

  if (isLoading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border p-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading pages…</span>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <ExternalLink className="mb-4 h-10 w-10 text-muted-foreground/50" />
        <h3 className="text-base font-semibold">No pages found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No pages match the current filter criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <SortableHeader
              field="url"
              label="URL"
              currentSortBy={currentSortBy}
              currentSortDir={currentSortDir}
              onClick={handleHeaderClick}
            />
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              Status
            </th>
            <SortableHeader
              field="score"
              label="Score"
              currentSortBy={currentSortBy}
              currentSortDir={currentSortDir}
              onClick={handleHeaderClick}
            />
            <SortableHeader
              field="title"
              label="Title"
              currentSortBy={currentSortBy}
              currentSortDir={currentSortDir}
              onClick={handleHeaderClick}
            />
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground max-w-[200px]">
              Meta Description
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground max-w-[150px]">
              Canonical
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              Index
            </th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
              Struct
            </th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
              OG
            </th>
            <SortableHeader
              field="createdAt"
              label="Crawled"
              currentSortBy={currentSortBy}
              currentSortDir={currentSortDir}
              onClick={handleHeaderClick}
            />
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr
              key={page.id}
              className={`
                border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors
                ${selectedPageId === page.id ? "bg-muted/50" : ""}
              `}
              onClick={() => onPageSelect(page.id)}
            >
              <td className="px-3 py-2.5 max-w-[250px] truncate font-medium">
                {page.url}
              </td>
              <td className="px-3 py-2.5">
                <Badge
                  variant={page.statusCode >= 400 ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {page.statusCode}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                {page.score ? (
                  <ScoreBadge score={page.score.overallScore} size="sm" />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 max-w-[200px] truncate">
                {page.title ?? (
                  <span className="text-xs italic text-muted-foreground">
                    missing
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 max-w-[200px] truncate text-muted-foreground">
                {page.metaDescription ?? (
                  <span className="text-xs italic">missing</span>
                )}
              </td>
              <td className="px-3 py-2.5 max-w-[150px] truncate text-muted-foreground">
                {page.canonical ?? (
                  <span className="text-xs italic text-muted-foreground">
                    missing
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5">
                {page.robots?.includes("noindex") ? (
                  <Badge variant="destructive" className="text-xs">
                    Noindex
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs">
                    Indexable
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {page.hasStructuredData ? (
                  <Badge variant="success" className="text-xs">
                    Yes
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {page.hasOpenGraph ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Yes
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(page.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────── Sub-components ──────────────── */

function SortableHeader({
  field,
  label,
  currentSortBy,
  currentSortDir,
  onClick,
}: {
  field: "url" | "score" | "title" | "createdAt";
  label: string;
  currentSortBy: string;
  currentSortDir: "asc" | "desc";
  onClick: (field: "url" | "score" | "title" | "createdAt") => void;
}) {
  const isActive = currentSortBy === field;
  return (
    <th
      className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
      onClick={() => onClick(field)}
    >
      {label}
      <SortIndicator active={isActive} direction={currentSortDir} />
    </th>
  );
}

/* ──────────────── Helpers ──────────────── */

function formatDateTime(isoString: string): string {
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
