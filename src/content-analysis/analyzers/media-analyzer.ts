/**
 * Content Analysis — Media Analyzer.
 *
 * Evaluates the media content on a page:
 *   - Image count
 *   - Missing alt text detection
 *   - Image-to-text ratio
 *
 * Pure analysis — never throws, never modifies state.
 */

import type { ContentAnalysisContext, MediaResult } from "@/content-analysis/types";

/* ──────────────── Analyzer ──────────────── */

export class MediaAnalyzer {
  /**
   * Analyze the media content of a page.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen MediaResult.
   */
  analyze(context: ContentAnalysisContext): MediaResult {
    try {
      const images = context.seoResult.images;
      const imageCount = images.length;

      if (imageCount === 0) {
        return Object.freeze({
          imageCount: 0,
          imagesWithAlt: 0,
          imagesWithoutAlt: 0,
          imageToTextRatio: 0,
        });
      }

      let imagesWithAlt = 0;
      let imagesWithoutAlt = 0;

      for (const img of images) {
        if (img.alt && img.alt.trim().length > 0) {
          imagesWithAlt++;
        } else {
          imagesWithoutAlt++;
        }
      }

      // Image-to-text ratio: images per 1000 words
      const wordCount = this.countWords(context.text);
      const imageToTextRatio =
        wordCount > 0
          ? Math.round((imageCount / wordCount) * 1000) / 10
          : imageCount > 0
            ? 100
            : 0;

      return Object.freeze({
        imageCount,
        imagesWithAlt,
        imagesWithoutAlt,
        imageToTextRatio,
      });
    } catch {
      return Object.freeze({
        imageCount: 0,
        imagesWithAlt: 0,
        imagesWithoutAlt: 0,
        imageToTextRatio: 0,
      });
    }
  }

  /* ──────────────── Private ──────────────── */

  /**
   * Simple word counter from text.
   */
  private countWords(text: string): number {
    const words = text
      .split(/[^a-zA-Z0-9']+/)
      .filter((w) => w.length > 0 && /[a-zA-Z]/.test(w));
    return words.length;
  }
}
