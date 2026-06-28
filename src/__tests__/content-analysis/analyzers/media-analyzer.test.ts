/**
 * Tests — MediaAnalyzer.
 */

import { describe, it, expect } from "vitest";
import { MediaAnalyzer } from "@/content-analysis/analyzers/media-analyzer";
import type { ContentAnalysisContext } from "@/content-analysis/types";
import { makeSeoResult, makeEmptySeoResult } from "@/__tests__/content-analysis/test-helpers";

/* ──────────────── Helpers ──────────────── */

function makeContext(text: string, imageOverride?: unknown): ContentAnalysisContext {
  return {
    html: `<html><body><p>${text}</p></body></html>`,
    text,
    seoResult: makeSeoResult(imageOverride as Partial<import("@/crawler/parser/types").SeoResult> | undefined),
    url: "https://example.com/page",
  };
}

/* ──────────────── Suite ──────────────── */

describe("MediaAnalyzer", () => {
  const analyzer = new MediaAnalyzer();

  it("should count images from seoResult", () => {
    const result = analyzer.analyze(makeContext("Some text"));
    expect(result.imageCount).toBe(2);
  });

  it("should count images with and without alt text", () => {
    const result = analyzer.analyze(makeContext("Some text"));
    expect(result.imagesWithAlt).toBe(1);
    expect(result.imagesWithoutAlt).toBe(1);
  });

  it("should return 0 images for empty page", () => {
    const context: ContentAnalysisContext = {
      html: "",
      text: "",
      seoResult: makeEmptySeoResult(),
      url: "https://example.com/page",
    };
    const result = analyzer.analyze(context);
    expect(result.imageCount).toBe(0);
    expect(result.imagesWithAlt).toBe(0);
    expect(result.imagesWithoutAlt).toBe(0);
    expect(result.imageToTextRatio).toBe(0);
  });

  it("should count all images correctly", () => {
    const result = analyzer.analyze(makeContext("Some text.", {
      images: [
        { src: "/a.jpg", alt: "Alt A", title: null, loading: null, width: null, height: null },
        { src: "/b.jpg", alt: "Alt B", title: null, loading: null, width: null, height: null },
        { src: "/c.jpg", alt: null, title: null, loading: null, width: null, height: null },
      ],
    }));
    expect(result.imageCount).toBe(3);
    expect(result.imagesWithAlt).toBe(2);
    expect(result.imagesWithoutAlt).toBe(1);
  });

  it("should compute image to text ratio correctly", () => {
    // 2 images, 2 words → ratio = (2/2) * 100 = 100
    const result = analyzer.analyze(makeContext("some text", {
      images: [
        { src: "/a.jpg", alt: "Alt", title: null, loading: null, width: null, height: null },
        { src: "/b.jpg", alt: null, title: null, loading: null, width: null, height: null },
      ],
    }));
    expect(result.imageToTextRatio).toBe(100);
  });

  it("should compute image to text ratio for many words", () => {
    // 2 images, 100 words → ratio = (2/100)*100 = 2
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`).join(" ");
    const result = analyzer.analyze(makeContext(words, {
      images: [
        { src: "/a.jpg", alt: "Alt", title: null, loading: null, width: null, height: null },
        { src: "/b.jpg", alt: null, title: null, loading: null, width: null, height: null },
      ],
    }));
    expect(result.imageToTextRatio).toBe(2);
  });

  it("should handle images with empty alt text as missing alt", () => {
    const result = analyzer.analyze(makeContext("Text.", {
      images: [
        { src: "/a.jpg", alt: "", title: null, loading: null, width: null, height: null },
        { src: "/b.jpg", alt: "  ", title: null, loading: null, width: null, height: null },
        { src: "/c.jpg", alt: null, title: null, loading: null, width: null, height: null },
      ],
    }));
    expect(result.imageCount).toBe(3);
    expect(result.imagesWithAlt).toBe(0);
    expect(result.imagesWithoutAlt).toBe(3);
  });

  it("should return 0 ratio for 0 images with text", () => {
    const result = analyzer.analyze(makeContext("Some text here.", {
      images: [],
    }));
    expect(result.imageCount).toBe(0);
    expect(result.imageToTextRatio).toBe(0);
  });

  it("should return 0 for empty page with no text but images", () => {
    const result = analyzer.analyze(makeContext("", {
      images: [
        { src: "/a.jpg", alt: "Alt", title: null, loading: null, width: null, height: null },
      ],
    }));
    // 1 image, 0 words → ratio should be high since images dominate
    expect(result.imageToTextRatio).toBe(100);
  });
});
