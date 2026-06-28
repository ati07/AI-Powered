"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ScanDashboardQueryParams } from "@/features/scan-dashboard/schemas/scan-dashboard-schema";
import { Filter, X } from "lucide-react";

interface ScanFilterBarProps {
  queryParams: ScanDashboardQueryParams;
  onApply: (params: ScanDashboardQueryParams) => void;
}

/**
 * Filter bar for the scan dashboard.
 *
 * Supports filtering by:
 * - Score range (min / max)
 * - Indexability (indexable / noindex)
 * - Missing fields (title, description, canonical, structured data)
 */
export function ScanFilterBar({ queryParams, onApply }: ScanFilterBarProps) {
  const [minScore, setMinScore] = useState(
    queryParams.minScore?.toString() ?? "",
  );
  const [maxScore, setMaxScore] = useState(
    queryParams.maxScore?.toString() ?? "",
  );
  const [indexability, setIndexability] = useState(
    queryParams.indexability ?? "",
  );
  const [missingTitle, setMissingTitle] = useState(
    queryParams.missingTitle ?? false,
  );
  const [missingDescription, setMissingDescription] = useState(
    queryParams.missingDescription ?? false,
  );
  const [missingCanonical, setMissingCanonical] = useState(
    queryParams.missingCanonical ?? false,
  );
  const [missingStructuredData, setMissingStructuredData] = useState(
    queryParams.missingStructuredData ?? false,
  );

  const hasActiveFilters =
    minScore !== "" ||
    maxScore !== "" ||
    indexability !== "" ||
    missingTitle ||
    missingDescription ||
    missingCanonical ||
    missingStructuredData;

  const handleApply = useCallback(() => {
    onApply({
      page: 1,
      minScore: minScore ? Number(minScore) : undefined,
      maxScore: maxScore ? Number(maxScore) : undefined,
      indexability: (indexability as "indexable" | "noindex" | undefined) ||
        undefined,
      missingTitle: missingTitle || undefined,
      missingDescription: missingDescription || undefined,
      missingCanonical: missingCanonical || undefined,
      missingStructuredData: missingStructuredData || undefined,
    });
  }, [
    minScore,
    maxScore,
    indexability,
    missingTitle,
    missingDescription,
    missingCanonical,
    missingStructuredData,
    onApply,
  ]);

  const handleClear = useCallback(() => {
    setMinScore("");
    setMaxScore("");
    setIndexability("");
    setMissingTitle(false);
    setMissingDescription(false);
    setMissingCanonical(false);
    setMissingStructuredData(false);
    onApply({ page: 1 });
  }, [onApply]);

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto h-7 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Score range */}
        <div className="space-y-1.5">
          <Label htmlFor="min-score" className="text-xs">Min Score</Label>
          <Input
            id="min-score"
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max-score" className="text-xs">Max Score</Label>
          <Input
            id="max-score"
            type="number"
            min={0}
            max={100}
            placeholder="100"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* Indexability */}
        <div className="space-y-1.5">
          <Label htmlFor="indexability" className="text-xs">Indexability</Label>
          <select
            id="indexability"
            value={indexability}
            onChange={(e) => setIndexability(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All</option>
            <option value="indexable">Indexable</option>
            <option value="noindex">Noindex</option>
          </select>
        </div>

        {/* Missing fields */}
        <div className="space-y-1.5">
          <Label className="text-xs">Missing Fields</Label>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={missingTitle}
                onChange={(e) => setMissingTitle(e.target.checked)}
                className="rounded border-input"
              />
              Missing Title
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={missingDescription}
                onChange={(e) => setMissingDescription(e.target.checked)}
                className="rounded border-input"
              />
              Missing Description
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={missingCanonical}
                onChange={(e) => setMissingCanonical(e.target.checked)}
                className="rounded border-input"
              />
              Missing Canonical
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={missingStructuredData}
                onChange={(e) => setMissingStructuredData(e.target.checked)}
                className="rounded border-input"
              />
              Missing Structured Data
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
