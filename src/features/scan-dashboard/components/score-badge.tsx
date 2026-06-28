"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Colour-coded AI Visibility Score badge.
 *
 * - 90–100: green (excellent)
 * - 70–89:  amber (good)
 * - 50–69:  orange (needs work)
 * - 0–49:   red (poor)
 */
function getScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100";
  if (score >= 70) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
  if (score >= 50) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
}

function getSizeClasses(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm": return "px-1.5 py-0.5 text-xs";
    case "md": return "px-2.5 py-1 text-sm";
    case "lg": return "px-3 py-1.5 text-base";
  }
}

/**
 * Displays a colour-coded score badge.
 */
export function ScoreBadge({ score, size = "sm", className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border",
        getScoreColor(score),
        getSizeClasses(size),
        className,
      )}
    >
      {score}
    </span>
  );
}
