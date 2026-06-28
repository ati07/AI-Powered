/**
 * Content Analysis — Heading Analyzer.
 *
 * Evaluates the heading structure of a page:
 *   - Heading hierarchy (h1 → h2 → h3 → … order)
 *   - Heading coverage (which levels are present)
 *   - Missing H1 detection
 *   - Duplicate heading detection
 *
 * Pure analysis — never throws, never modifies state.
 */

import type {
  ContentAnalysisContext,
  HeadingResult,
  HeadingCoverage,
  HierarchyIssue,
  DuplicateHeading,
} from "@/content-analysis/types";
import type { HeadingInfo } from "@/crawler/parser/types";

/* ──────────────── Constants ──────────────── */

const HEADING_ORDER: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

/* ──────────────── Analyzer ──────────────── */

export class HeadingAnalyzer {
  /**
   * Analyze the heading structure from the analysis context.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen HeadingResult.
   */
  analyze(context: ContentAnalysisContext): HeadingResult {
    try {
      const headings: HeadingInfo = context.seoResult.headings;

      // Build a flat ordered list of all headings (tag + text)
      const allHeadings = this.flattenHeadings(headings);

      const hierarchy = allHeadings.map((h) => h.tag);
      const hierarchyIssues = this.detectHierarchyIssues(allHeadings);
      const coverage = this.buildCoverage(headings);
      const missingH1 = coverage.h1Count === 0;
      const duplicateHeadings = this.detectDuplicates(allHeadings);

      return Object.freeze({
        hierarchy,
        hierarchyIssues,
        coverage,
        missingH1,
        duplicateHeadings,
        totalHeadings: allHeadings.length,
      });
    } catch {
      return Object.freeze({
        hierarchy: [],
        hierarchyIssues: [],
        coverage: { h1Count: 0, h2Count: 0, h3Count: 0, h4Count: 0, h5Count: 0, h6Count: 0 },
        missingH1: true,
        duplicateHeadings: [],
        totalHeadings: 0,
      });
    }
  }

  /* ──────────────── Private ──────────────── */

  private flattenHeadings(
    headings: HeadingInfo,
  ): Array<{ tag: string; text: string }> {
    const result: Array<{ tag: string; text: string }> = [];

    // Since SeoResult stores headings as arrays per level, we don't have
    // the original document order. We approximate: all h1s first, then h2s, etc.
    const ordered: Array<keyof HeadingInfo> = ["h1", "h2", "h3", "h4", "h5", "h6"];

    for (const level of ordered) {
      const items = headings[level];
      if (!items) continue;
      for (const text of items as readonly string[]) {
        result.push({ tag: level, text });
      }
    }

    return result;
  }

  /**
   * Detect hierarchy issues (skipped levels).
   *
   * Since the SeoResult groups headings by level (all h1s first, then h2s, etc.),
   * the detection checks which heading levels are present.
   * A level skip occurs when a heading level is used without a lower-numbered
   * level appearing anywhere on the page (e.g. h3 present but h2 absent).
   */
  private detectHierarchyIssues(
    headings: Array<{ tag: string; text: string }>,
  ): HierarchyIssue[] {
    const issues: HierarchyIssue[] = [];

    if (headings.length === 0) return issues;

    // Find which heading levels have content
    const levelsWithContent = new Set(headings.map((h) => h.tag));
    const checked = new Set<string>();

    for (const tag of levelsWithContent) {
      const level = HEADING_ORDER[tag] ?? 0;
      for (let expected = 1; expected < level; expected++) {
        const expectedTag = `h${expected}`;
        if (checked.has(expectedTag)) continue;
        checked.add(expectedTag);

        if (!levelsWithContent.has(expectedTag)) {
          const heading = headings.find((h) => h.tag === tag);
          issues.push({
            expectedLevel: expectedTag,
            actualLevel: tag,
            text: heading?.text ?? "",
            index: headings.indexOf(heading!),
          });
        }
      }
    }

    return issues;
  }

  private buildCoverage(
    headings: HeadingInfo,
  ): HeadingCoverage {
    return {
      h1Count: headings.h1.length,
      h2Count: headings.h2.length,
      h3Count: headings.h3.length,
      h4Count: headings.h4.length,
      h5Count: headings.h5.length,
      h6Count: headings.h6.length,
    };
  }

  /**
   * Find headings with duplicated text across the page.
   */
  private detectDuplicates(
    headings: Array<{ tag: string; text: string }>,
  ): DuplicateHeading[] {
    const textCount = new Map<string, { level: string; count: number }>();

    for (const h of headings) {
      const key = h.text.toLowerCase().trim();
      if (key.length === 0) continue;

      const existing = textCount.get(key);
      if (existing) {
        existing.count++;
      } else {
        textCount.set(key, { level: h.tag, count: 1 });
      }
    }

    return Array.from(textCount.entries())
      .filter(([, info]) => info.count > 1)
      .map(([text, info]) => ({
        level: info.level,
        text,
        count: info.count,
      }));
  }
}
