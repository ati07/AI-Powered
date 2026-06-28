/**
 * Crawler — robots.txt parser.
 *
 * Supports the five standard directives:
 *   User-agent  → records user-agent names
 *   Allow       → records allow path patterns
 *   Disallow    → records disallow path patterns
 *   Sitemap     → records sitemap URLs (global)
 *   Crawl-delay → records per-group crawl delay
 *
 * Unrecognised directives are silently ignored.
 * Never throws — all parse errors produce an empty result.
 */

import { type RobotsResult, type RobotsGroup } from "./types";

/* ──────────────── Types ──────────────── */

/**
 * Internal line classification.
 * Matches real-world robots.txt variants — see isDirective() for match rules.
 */
interface ParsedLine {
  readonly directive: string;
  readonly value: string;
}

/* ──────────────── Helpers ──────────────── */

/**
 * Attempt to extract a (directive, value) pair from a trimmed line.
 * Returns `null` for blank lines, comments, or lines without a colon.
 */
function parseLine(trimmed: string): ParsedLine | null {
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return null;

  const directive = trimmed.slice(0, colonIndex).trim().toLowerCase();
  const value = trimmed.slice(colonIndex + 1).trim();

  if (directive.length === 0) return null;

  return { directive, value };
}

/* ──────────────── Parser ──────────────── */

export class RobotsParser {
  /**
   * Parse a raw robots.txt string into structured results.
   *
   * @param raw — the complete robots.txt file contents.
   * @returns   A `RobotsResult` — always a valid object, never throws.
   */
  parse(raw: string): RobotsResult {
    const groups: RobotsGroup[] = [];
    const sitemapUrls: string[] = [];

    /* Normalise line endings so that Windows (CRLF) and old-Mac (CR) both
       behave identically to Unix (LF). */
    const normalised = raw.replace(/\r\n?/g, "\n");
    const lines = normalised.split("\n");

    let currentGroup: RobotsGroup | null = null;
    let previousWasUserAgent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();

      /* ── Empty line → end the current group ── */
      if (trimmed === "") {
        currentGroup = null;
        previousWasUserAgent = false;
        continue;
      }

      /* ── Comment → skip entirely ── */
      if (trimmed.startsWith("#")) continue;

      /* ── Extract directive + value ── */
      const parsed = parseLine(trimmed);
      if (parsed === null) continue; // malformed line

      const { directive, value } = parsed;

      switch (directive) {
        /* ── User-agent ── */
        case "user-agent": {
          if (currentGroup && previousWasUserAgent) {
            /* Another UA line for the current group (no blank line between). */
            currentGroup.userAgents.push(value);
          } else {
            /* Start a brand-new group. */
            currentGroup = {
              userAgents: [value],
              allowRules: [],
              disallowRules: [],
              crawlDelay: null,
            };
            groups.push(currentGroup);
          }
          previousWasUserAgent = true;
          break;
        }

        /* ── Allow / Disallow ── */
        case "allow": {
          if (currentGroup) {
            currentGroup.allowRules.push(value);
          }
          previousWasUserAgent = false;
          break;
        }

        case "disallow": {
          if (currentGroup) {
            currentGroup.disallowRules.push(value);
          }
          previousWasUserAgent = false;
          break;
        }

        /* ── Crawl-delay (per-group) ── */
        case "crawl-delay": {
          if (currentGroup) {
            const delay = parseFloat(value);
            if (!isNaN(delay) && delay >= 0) {
              currentGroup.crawlDelay = delay;
            }
          }
          previousWasUserAgent = false;
          break;
        }

        /* ── Sitemap (global — not bound to any user-agent group) ── */
        case "sitemap": {
          if (value) {
            sitemapUrls.push(value);
          }
          previousWasUserAgent = false;
          break;
        }

        /* ── Unknown directive → silently ignore ── */
        default: {
          previousWasUserAgent = false;
          break;
        }
      }
    }

    return { groups, sitemapUrls };
  }
}
