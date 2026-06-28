"use client";

import type { ScanDashboardPageDTO } from "@/features/scan-dashboard/schemas/scan-dashboard-schema";
import { ScoreBadge } from "@/features/scan-dashboard/components/score-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, ExternalLink, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScanPageDetailsProps {
  page: ScanDashboardPageDTO;
  onClose: () => void;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800",
    label: "Critical",
  },
  important: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    label: "Important",
  },
  suggestion: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
    label: "Suggestion",
  },
};

/**
 * Page detail panel showing score breakdown, deductions, and recommendations.
 *
 * Displayed when a page row is selected in the results table.
 */
export function ScanPageDetails({ page, onClose }: ScanPageDetailsProps) {
  if (!page.score) {
    return (
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Page Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>This page has not been scored yet.</p>
          <p className="mt-1 text-xs">
            Scores are computed after crawling completes.
          </p>
        </div>
      </div>
    );
  }

  const score = page.score;

  return (
    <div className="rounded-lg border">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <ScoreBadge score={score.overallScore} size="lg" />
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{page.title ?? "Untitled"}</h3>
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{page.url}</span>
            </a>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* ── Score Breakdown ── */}
        <section>
          <h4 className="text-sm font-semibold mb-3">Score Breakdown</h4>
          <div className="space-y-2">
            {score.categoryScores.map((cs) => (
              <div key={cs.category} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{cs.label}</span>
                    <span className="text-muted-foreground ml-2 shrink-0">
                      {Math.round(cs.score)} / 100
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        cs.score >= 90
                          ? "bg-emerald-500"
                          : cs.score >= 70
                            ? "bg-amber-500"
                            : cs.score >= 50
                              ? "bg-orange-500"
                              : "bg-red-500",
                      )}
                      style={{ width: `${cs.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Deductions ── */}
        {score.deductions.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-3">Deductions</h4>
            <div className="space-y-1.5">
              {score.deductions.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-medium capitalize">{d.category}:</span>{" "}
                    {d.reason}
                    <span className="text-destructive ml-1">
                      (-{d.deduction})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Separator />

        {/* ── Recommendations ── */}
        <section>
          <h4 className="text-sm font-semibold mb-3">
            Recommendations
            {score.recommendations.length > 0 && (
              <span className="ml-1 text-muted-foreground font-normal">
                ({score.recommendations.length})
              </span>
            )}
          </h4>

          {score.recommendations.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3">
              <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                No issues found — this page is well optimised.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {score.recommendations.map((rec, idx) => {
                const config = severityConfig[rec.severity];
                const Icon = config.icon;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-3",
                      config.bg,
                      config.border,
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          config.color,
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {rec.title}
                          </span>
                          <Badge
                            variant={
                              rec.severity === "critical"
                                ? "destructive"
                                : rec.severity === "important"
                                  ? "warning"
                                  : "outline"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {config.label}
                          </Badge>
                          {"affectedField" in rec && rec.affectedField && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground"
                            >
                              {rec.affectedField}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                        <p className="text-xs mt-1.5 font-medium">
                          {rec.fix ?? rec.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
