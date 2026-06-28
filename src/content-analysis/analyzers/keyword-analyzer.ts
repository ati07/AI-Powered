/**
 * Content Analysis — Keyword Analyzer.
 *
 * Analyzes keyword frequency and density in page content:
 *   - Keyword density (top keywords as % of total words)
 *   - Keyword repetition (overused keywords flagged)
 *
 * Pure analysis — never throws, never modifies state.
 */

import type { ContentAnalysisContext, KeywordResult, KeywordInfo } from "@/content-analysis/types";

/* ──────────────── Stop words ──────────────── */

/** Common English stop words filtered out from keyword analysis. */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "because", "as", "until",
  "while", "of", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to",
  "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "because", "also", "any", "are", "can", "could", "did",
  "do", "does", "done", "get", "got", "has", "have", "had", "may", "might",
  "must", "shall", "should", "will", "would", "is", "am", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "having", "do",
  "does", "did", "doing", "would", "could", "should", "might", "must",
  "shall", "can", "will", "need", "dare", "ought", "used", "it", "its",
  "this", "that", "these", "those", "i", "me", "my", "myself", "we",
  "our", "ours", "ourselves", "you", "your", "yours", "yourself",
  "yourselves", "he", "him", "his", "himself", "she", "her", "hers",
  "herself", "it", "its", "itself", "they", "them", "their", "theirs",
  "themselves", "what", "which", "who", "whom", "whose", "whichever",
  "whoever", "whomever", "whatever",
]);

/** Maximum number of top keywords to return. */
const MAX_KEYWORDS = 30;

/** Density threshold (%) above which a keyword is considered overused. */
const OVERUSE_DENSITY_THRESHOLD = 5;

/** Minimum word length to be considered a meaningful keyword. */
const MIN_KEYWORD_LENGTH = 3;

/* ──────────────── Analyzer ──────────────── */

export class KeywordAnalyzer {
  /**
   * Analyze keyword frequency and density in the page text.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen KeywordResult.
   */
  analyze(context: ContentAnalysisContext): KeywordResult {
    try {
      const text = context.text;
      if (text.length === 0) {
        return this.emptyResult();
      }

      const words = this.tokenize(text);
      const totalWords = words.length;

      if (totalWords === 0) {
        return this.emptyResult();
      }

      // Count word frequencies (excluding stop words)
      const wordCounts = new Map<string, number>();
      let stopWordCount = 0;

      for (const word of words) {
        if (STOP_WORDS.has(word)) {
          stopWordCount++;
          continue;
        }
        wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
      }

      const uniqueWords = wordCounts.size;
      const meaningfulWords = totalWords - stopWordCount;

      // Sort by frequency descending, take top N
      const sorted = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_KEYWORDS)
        .map(
          ([word, count]): KeywordInfo => ({
            word,
            count,
            density:
              meaningfulWords > 0
                ? Math.round((count / meaningfulWords) * 1000) / 10
                : 0,
          }),
        );

      // Detect overused keywords (density > threshold)
      const overusedKeywords = sorted
        .filter((k) => k.density >= OVERUSE_DENSITY_THRESHOLD)
        .map((k) => k.word);

      return Object.freeze({
        keywords: Object.freeze(sorted),
        totalWords,
        uniqueWords,
        stopWordRatio:
          totalWords > 0
            ? Math.round((stopWordCount / totalWords) * 1000) / 10
            : 0,
        overusedKeywords: Object.freeze(overusedKeywords),
      });
    } catch {
      return this.emptyResult();
    }
  }

  /* ──────────────── Private ──────────────── */

  private emptyResult(): KeywordResult {
    return Object.freeze({
      keywords: [],
      totalWords: 0,
      uniqueWords: 0,
      stopWordRatio: 0,
      overusedKeywords: [],
    });
  }

  /**
   * Tokenize text into lowercase words (alphanumeric only).
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-zA-Z0-9']+/)
      .filter((w) => w.length >= MIN_KEYWORD_LENGTH && /[a-zA-Z]/.test(w));
  }
}
