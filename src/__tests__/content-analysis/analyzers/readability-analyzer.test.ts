/**
 * Tests — ReadabilityAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { ReadabilityAnalyzer } from "@/content-analysis/analyzers/readability-analyzer";
import type { ContentAnalysisContext } from "@/content-analysis/types";
import { makeSeoResult } from "@/__tests__/content-analysis/test-helpers";

/* ──────────────── Helpers ──────────────── */

function makeContext(text: string, html?: string): ContentAnalysisContext {
  return {
    html: html ?? `<html><body><p>${text}</p></body></html>`,
    text,
    seoResult: makeSeoResult(),
    url: "https://example.com/page",
  };
}

/* ──────────────── Suite ──────────────── */

describe("ReadabilityAnalyzer", () => {
  const analyzer = new ReadabilityAnalyzer();

  it("should return 0 values for empty text", () => {
    const result = analyzer.analyze(makeContext(""));
    expect(result.wordCount).toBe(0);
    expect(result.sentenceCount).toBe(0);
    expect(result.paragraphCount).toBe(0);
    expect(result.readingTimeMinutes).toBe(0);
    expect(result.readingTimeSeconds).toBe(0);
    expect(result.averageSentenceLength).toBe(0);
  });

  it("should count words correctly", () => {
    const result = analyzer.analyze(makeContext("one two three four five"));
    expect(result.wordCount).toBe(5);
  });

  it("should count sentences correctly", () => {
    const result = analyzer.analyze(makeContext(
      "First sentence. Second sentence! Third sentence? Fourth sentence.",
    ));
    expect(result.sentenceCount).toBe(4);
  });

  it("should handle text with no sentence-ending punctuation", () => {
    const result = analyzer.analyze(makeContext("just one sentence without punctuation"));
    expect(result.sentenceCount).toBe(1);
  });

  it("should count paragraphs from HTML", () => {
    const html = "<html><body><p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p></body></html>";
    const text = "First paragraph. Second paragraph. Third paragraph.";
    const result = analyzer.analyze(makeContext(text, html));
    expect(result.paragraphCount).toBe(3);
  });

  it("should ignore empty paragraphs", () => {
    const html = "<html><body><p></p><p>Non-empty.</p><p>  </p></body></html>";
    const text = "Non-empty.";
    const result = analyzer.analyze(makeContext(text, html));
    expect(result.paragraphCount).toBe(1);
  });

  it("should compute reading time correctly", () => {
    // 200 words of text
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
    const result = analyzer.analyze(makeContext(words));
    expect(result.readingTimeMinutes).toBe(1);
    expect(result.readingTimeSeconds).toBe(60);
  });

  it("should compute reading time for partial minute", () => {
    // 100 words = 0.5 min = 30 seconds
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`).join(" ");
    const result = analyzer.analyze(makeContext(words + "."));
    expect(result.readingTimeMinutes).toBe(0.5);
    expect(result.readingTimeSeconds).toBe(30);
  });

  it("should compute average sentence length", () => {
    // 10 words across 2 sentences
    const text = "Word one here is five. Word two here is five.";
    const result = analyzer.analyze(makeContext(text));
    expect(result.averageSentenceLength).toBe(5);
  });

  it("should compute average word length", () => {
    // Words with known lengths: test(4) + page(4) + analyz(6) + content(7) = 21 / 4 = 5.25
    const text = "test page analyz content.";
    const result = analyzer.analyze(makeContext(text));
    expect(result.averageWordLength).toBe(5.3);
  });

  it("should determine reading level correctly", () => {
    // Very short sentences → very-easy
    const shortSentences = "I am here. Go there. Do it. Yes.";
    const shortResult = analyzer.analyze(makeContext(shortSentences));
    expect(shortResult.readingLevel).toBe("very-easy");

    // Long sentences → very-difficult (25+ avg)
    const longSentences =
      "This is an extremely complicated sentence that contains many difficult words and complex subordinate clauses which make it very hard to read understand and comprehend for most readers.";
    const longResult = analyzer.analyze(makeContext(longSentences));
    expect(longResult.readingLevel).toBe("very-difficult");
  });

  it("should calculate Flesch Reading Ease", () => {
    // Simple text should have higher score
    const simpleText = "The cat sat on the mat. The dog ran fast. I like to play.";
    const result = analyzer.analyze(makeContext(simpleText));
    expect(result.fleschReadingEase).toBeGreaterThan(0);
    expect(result.fleschReadingEase).toBeLessThanOrEqual(100);

    // Complex text should have a valid Flesch score
    const complexText =
      "Notwithstanding the aforementioned circumstances, the extraordinary complexity of this particular paragraph demonstrates substantial difficult readability characteristics. Additionally, multiple subordinate clauses contribute to the obfuscation of the fundamental meaning.";
    const complexResult = analyzer.analyze(makeContext(complexText));
    expect(complexResult.fleschReadingEase).toBeGreaterThanOrEqual(0);
    expect(complexResult.fleschReadingEase).toBeLessThanOrEqual(100);
    expect(typeof complexResult.fleschReadingEase).toBe("number");
  });

  it("should handle malformed HTML gracefully", () => {
    const html = "<html><body><p>Some text</p></html>"; // missing closing tags
    const context: ContentAnalysisContext = {
      html,
      text: "Some text",
      seoResult: makeSeoResult(),
      url: "https://example.com/page",
    };
    const result = analyzer.analyze(context);
    expect(result.wordCount).toBe(2);
    expect(result.paragraphCount).toBe(1);
  });

  it("should handle very large text without error", () => {
    const largeText = Array.from({ length: 5000 }, (_, i) => `word${i}`).join(" ") + ".";
    const result = analyzer.analyze(makeContext(largeText));
    expect(result.wordCount).toBe(5000);
    expect(result.readingTimeMinutes).toBe(25);
    expect(result.readingTimeSeconds).toBe(1500);
  });

  it("should return moderate reading level for average text", () => {
    // Each sentence is ~17-19 words → moderate (16-20)
    const text = "This is an average paragraph for a typical web page that would have moderate length sentences for general audiences. The reading level should be moderate as well for this particular example that we are using. Most web content falls into this moderate range for broad accessibility among all readers.";
    const result = analyzer.analyze(makeContext(text));
    expect(result.readingLevel).toBe("moderate");
  });

  it("should handle text with numbers and punctuation", () => {
    const text = "Page 1 of 10 was updated in 2025. The price is $99.99! Is it worth it? Check section 2.2 for details.";
    const result = analyzer.analyze(makeContext(text));
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.sentenceCount).toBeGreaterThan(0);
  });

  it("should handle single word text", () => {
    const result = analyzer.analyze(makeContext("Hello."));
    expect(result.wordCount).toBe(1);
    expect(result.sentenceCount).toBe(1);
  });
});
