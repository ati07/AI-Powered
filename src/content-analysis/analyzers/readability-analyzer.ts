/**
 * Content Analysis — Readability Analyzer.
 *
 * Evaluates the readability of page content by measuring:
 *   - Word count
 *   - Sentence count
 *   - Paragraph count
 *   - Reading time (at ~200 wpm)
 *   - Average sentence length
 *   - Average word length
 *   - Flesch Reading Ease (approximate)
 *   - Reading level (very-easy / easy / moderate / difficult / very-difficult)
 *
 * Pure analysis — never throws, never modifies state.
 */

import * as cheerio from "cheerio";
import type { ContentAnalysisContext, ReadabilityResult, ReadingLevel } from "@/content-analysis/types";

/* ──────────────── Constants ──────────────── */

/** Average adult reading speed: 200 words per minute. */
const WORDS_PER_MINUTE = 200;

/** Vowel chars used for syllable estimation. */
const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

/* ──────────────── Analyzer ──────────────── */

export class ReadabilityAnalyzer {
  /**
   * Analyze the readability of page content from the context.
   *
   * @param context — Pre-computed analysis context (html, text, seoResult, url).
   * @returns A frozen ReadabilityResult.
   */
  analyze(context: ContentAnalysisContext): ReadabilityResult {
    try {
      const text = context.text;
      if (text.length === 0) {
        return this.emptyResult();
      }

      const words = this.extractWords(text);
      const wordCount = words.length;

      if (wordCount === 0) {
        return this.emptyResult();
      }

      const sentenceCount = this.countSentences(text);
      const paragraphCount = this.countParagraphs(context.html);
      const totalSyllables = words.reduce((sum, w) => sum + this.estimateSyllables(w), 0);

      const readingTimeMinutes = wordCount / WORDS_PER_MINUTE;
      const readingTimeSeconds = Math.round(readingTimeMinutes * 60);
      const averageSentenceLength = sentenceCount > 0
        ? Math.round((wordCount / sentenceCount) * 10) / 10
        : 0;
      const averageWordLength = Math.round(
        (words.reduce((sum, w) => sum + w.length, 0) / wordCount) * 10,
      ) / 10;

      // Approximate Flesch Reading Ease
      const fleschReadingEase = this.calculateFlesch(
        wordCount,
        sentenceCount,
        totalSyllables,
      );

      const readingLevel = this.determineReadingLevel(averageSentenceLength);

      return Object.freeze({
        wordCount,
        sentenceCount,
        paragraphCount,
        readingTimeMinutes: Math.round(readingTimeMinutes * 10) / 10,
        readingTimeSeconds,
        averageSentenceLength,
        averageWordLength,
        readingLevel,
        fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
      });
    } catch {
      return this.emptyResult();
    }
  }

  /* ──────────────── Private ──────────────── */

  private emptyResult(): ReadabilityResult {
    return Object.freeze({
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      readingTimeSeconds: 0,
      averageSentenceLength: 0,
      averageWordLength: 0,
      readingLevel: "moderate" as ReadingLevel,
      fleschReadingEase: 0,
    });
  }

  /**
   * Split text into words (alphanumeric sequences, ignoring punctuation).
   */
  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-zA-Z0-9']+/)
      .filter((w) => w.length > 0 && /[a-zA-Z]/.test(w));
  }

  /**
   * Count sentences by splitting on sentence-ending punctuation.
   */
  private countSentences(text: string): number {
    // Split on . ! ? followed by whitespace or end-of-string
    const matches = text.match(/[.!?]+(?:\s|$)/g);
    if (!matches) {
      // Single sentence if there's any text
      return text.trim().length > 0 ? 1 : 0;
    }
    let count = matches.length;
    // If text doesn't end with punctuation, the last segment is also a sentence
    const trimmed = text.trim();
    if (trimmed.length > 0 && !/[.!?]/.test(trimmed[trimmed.length - 1] ?? "")) {
      count++;
    }
    return count;
  }

  /**
   * Count non-empty <p> elements in the HTML.
   */
  private countParagraphs(html: string): number {
    try {
      const $ = cheerio.load(html);
      let count = 0;
      $("p").each((_i: number, el: unknown) => {
        const text = $(el as any).text().trim();
        if (text.length > 0) count++;
      });
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Estimate syllable count for a single word.
   *
   * Counts vowel groups and applies a simple silent-e adjustment.
   */
  private estimateSyllables(word: string): number {
    if (word.length === 0) return 1;

    const lower = word.toLowerCase().replace(/[^a-z]/g, "");
    if (lower.length === 0) return 1;

    let count = 0;
    let prevIsVowel = false;

    for (const char of lower) {
      const isVowel = VOWELS.has(char);
      if (isVowel && !prevIsVowel) count++;
      prevIsVowel = isVowel;
    }

    // Adjust for silent terminal 'e'
    if (lower.endsWith("e") && count > 1) count--;

    // Keep at least one syllable
    return Math.max(1, count);
  }

  /**
   * Calculate the approximate Flesch Reading Ease score (0–100).
   *
   * Formula: 206.835 - 1.015 × (words / sentences) - 84.6 × (syllables / words)
   */
  private calculateFlesch(
    wordCount: number,
    sentenceCount: number,
    totalSyllables: number,
  ): number {
    if (sentenceCount === 0 || wordCount === 0) return 0;

    const wordsPerSentence = wordCount / sentenceCount;
    const syllablesPerWord = totalSyllables / wordCount;

    const score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

    // Clamp to 0–100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Map average sentence length to a reading level.
   */
  private determineReadingLevel(avgSentenceLength: number): ReadingLevel {
    if (avgSentenceLength <= 0) return "moderate";
    if (avgSentenceLength < 12) return "very-easy";
    if (avgSentenceLength < 16) return "easy";
    if (avgSentenceLength < 20) return "moderate";
    if (avgSentenceLength < 25) return "difficult";
    return "very-difficult";
  }
}
