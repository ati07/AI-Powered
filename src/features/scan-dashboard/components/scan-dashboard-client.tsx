"use client";

import { useState, useCallback } from "react";
import { useScanDashboard } from "@/features/scan-dashboard/hooks/use-scan-dashboard";
import { ScanSummaryCards } from "@/features/scan-dashboard/components/scan-summary-cards";
import { ScanFilterBar } from "@/features/scan-dashboard/components/scan-filter-bar";
import { ScanPageTable } from "@/features/scan-dashboard/components/scan-page-table";
import { ScanPageDetails } from "@/features/scan-dashboard/components/scan-page-details";
import { TablePagination } from "@/features/scan-dashboard/components/table-pagination";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { PageContainer } from "@/components/shared/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ScanDashboardPageDTO, ScanDashboardQueryParams } from "@/features/scan-dashboard/schemas/scan-dashboard-schema";

interface ScanDashboardClientProps {
  organizationId: string;
  websiteId: string;
  scanId: string;
}

/**
 * Main Scan Dashboard client component.
 *
 * Orchestrates:
 * - Scan summary cards
 * - Filter bar
 * - Page results table
 * - Page detail panel
 * - Pagination
 *
 * Handles loading, error, and empty states.
 */
export function ScanDashboardClient({
  organizationId,
  websiteId,
  scanId,
}: ScanDashboardClientProps) {
  const {
    scan,
    pagesData,
    isLoading,
    isPageLoading,
    error,
    queryParams,
    setQueryParams,
    setPage,
    refetch,
  } = useScanDashboard(scanId);

  const [selectedPage, setSelectedPage] = useState<ScanDashboardPageDTO | null>(null);

  const handleSortChange = useCallback(
    (sortBy: "url" | "score" | "title" | "createdAt") => {
      const current = queryParams.sortBy ?? "url";
      const currentDir = queryParams.sortDir ?? "asc";
      const newDir =
        current === sortBy && currentDir === "asc" ? "desc" : "asc";
      setQueryParams({ sortBy, sortDir: newDir, page: 1 });
    },
    [queryParams, setQueryParams],
  );

  const handlePageSelect = useCallback(
    (pageId: string) => {
      const page = pagesData?.items.find((p) => p.id === pageId) ?? null;
      setSelectedPage((prev) =>
        prev?.id === pageId ? null : page,
      );
    },
    [pagesData],
  );

  const handleFilterApply = useCallback(
    (params: ScanDashboardQueryParams) => {
      setQueryParams(params);
    },
    [setQueryParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      setSelectedPage(null);
    },
    [setPage],
  );

  /* ──────────────── Loading State ──────────────── */

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer title="Scan Dashboard" description="Loading…">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading scan dashboard…</span>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  /* ──────────────── Error State ──────────────── */

  if (error && !scan) {
    return (
      <DashboardLayout>
        <PageContainer title="Scan Dashboard">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  /* ──────────────── Scan Not Found ──────────────── */

  if (!scan) {
    return (
      <DashboardLayout>
        <PageContainer title="Scan Dashboard">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Scan not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The scan you are looking for does not exist or has been removed.
            </p>
            <Link
              href={`/dashboard/organizations/${organizationId}/websites/${websiteId}`}
              className="mt-4"
            >
              <Button variant="outline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Website
              </Button>
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const pages = pagesData?.items ?? [];
  const selectedPageData = selectedPage ?? null;

  return (
    <DashboardLayout>
      <PageContainer title="Scan Dashboard">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Back button */}
        <div>
          <Link
            href={`/dashboard/organizations/${organizationId}/websites/${websiteId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to Website
          </Link>
        </div>

        {/* Summary cards */}
        <ScanSummaryCards scan={scan} />

        {/* Filters */}
        <ScanFilterBar
          queryParams={queryParams}
          onApply={handleFilterApply}
        />

        {/* Main content area: table + detail panel */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Table */}
          <div className="lg:col-span-2 space-y-4">
            <ScanPageTable
              pages={pages}
              isLoading={isPageLoading}
              queryParams={queryParams}
              selectedPageId={selectedPage?.id ?? null}
              onPageSelect={handlePageSelect}
              onSortChange={handleSortChange}
            />

            {pagesData && pagesData.totalPages > 0 && (
              <TablePagination
                page={pagesData.page}
                totalPages={pagesData.totalPages}
                total={pagesData.total}
                pageSize={pagesData.pageSize}
                onPageChange={handlePageChange}
                isLoading={isPageLoading}
              />
            )}
          </div>

          {/* Sidebar: Page Details */}
          <div className="lg:col-span-1">
            {selectedPageData ? (
              <ScanPageDetails
                page={selectedPageData}
                onClose={() => setSelectedPage(null)}
              />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <p>Select a page to view details</p>
                <p className="mt-1 text-xs">
                  Click on any row in the table to see its score breakdown and
                  recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
