/**
 * Content Analysis — shared types.
 *
 * Every result type is declared with `readonly` properties for immutability.
 * The engine returns a frozen ContentAnalysisResult.
 */

import type { SeoResult } from "@/crawler/parser/types";

/* ──────────────── Input ──────────────── */

/**
 * Input fed into the ContentAnalysisEngine.
 *
 * @property html     — Raw HTML of the page (used for DOM-based analysis).
 * @property seoResult — Pre-extracted SEO data from the SeoExtractor.
 * @property url      — The page URL (used for self-referencing checks).
 */
export interface ContentAnalysisInput {
  readonly html: string;
  readonly seoResult: SeoResult;
  readonly url: string;
}

/**
 * Pre-computed context passed to every analyzer.
 *
 * The engine extracts the plain text once to avoid duplicated parser logic.
 */
export interface ContentAnalysisContext {
  readonly html: string;
  readonly text: string;
  readonly seoResult: SeoResult;
  readonly url: string;
}

/* ──────────────── Readability ──────────────── */

export type ReadingLevel =
  | "very-easy"
  | "easy"
  | "moderate"
  | "difficult"
  | "very-difficult";

export interface ReadabilityResult {
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly paragraphCount: number;
  readonly readingTimeMinutes: number;
  readonly readingTimeSeconds: number;
  readonly averageSentenceLength: number;
  readonly averageWordLength: number;
  readonly readingLevel: ReadingLevel;
  readonly fleschReadingEase: number;
}

/* ──────────────── Headings ──────────────── */

export interface HierarchyIssue {
  readonly expectedLevel: string;
  readonly actualLevel: string;
  readonly text: string;
  readonly index: number;
}

export interface HeadingCoverage {
  readonly h1Count: number;
  readonly h2Count: number;
  readonly h3Count: number;
  readonly h4Count: number;
  readonly h5Count: number;
  readonly h6Count: number;
}

export interface DuplicateHeading {
  readonly level: string;
  readonly text: string;
  readonly count: number;
}

export interface HeadingResult {
  readonly hierarchy: readonly string[];
  readonly hierarchyIssues: readonly HierarchyIssue[];
  readonly coverage: HeadingCoverage;
  readonly missingH1: boolean;
  readonly duplicateHeadings: readonly DuplicateHeading[];
  readonly totalHeadings: number;
}

/* ──────────────── Keywords ──────────────── */

export interface KeywordInfo {
  readonly word: string;
  readonly count: number;
  readonly density: number;
}

export interface KeywordResult {
  readonly keywords: readonly KeywordInfo[];
  readonly totalWords: number;
  readonly uniqueWords: number;
  readonly stopWordRatio: number;
  readonly overusedKeywords: readonly string[];
}

/* ──────────────── Structure ──────────────── */

export interface StructureResult {
  readonly listCount: number;
  readonly tableCount: number;
  readonly hasFAQ: boolean;
  readonly faqCount: number;
  readonly internalLinkCount: number;
  readonly externalLinkCount: number;
  readonly contentDepth: number;
}

/* ──────────────── Media ──────────────── */

export interface MediaResult {
  readonly imageCount: number;
  readonly imagesWithAlt: number;
  readonly imagesWithoutAlt: number;
  readonly imageToTextRatio: number;
}

/* ──────────────── E-E-A-T ──────────────── */

export interface EEATResult {
  readonly hasAuthor: boolean;
  readonly authorName: string | null;
  readonly hasAuthorMeta: boolean;
  readonly hasAuthorSchema: boolean;
  readonly hasContactInfo: boolean;
  readonly contactTypes: readonly string[];
  readonly hasOrganizationInfo: boolean;
  readonly organizationName: string | null;
  readonly hasOrganizationSchema: boolean;
  readonly trustIndicators: readonly string[];
  readonly trustIndicatorCount: number;
  readonly eeatSignalCount: number;
}

/* ──────────────── AI Answerability ──────────────── */

export interface AIAnswerabilityResult {
  readonly hasQASections: boolean;
  readonly qaSectionCount: number;
  readonly hasDefinitions: boolean;
  readonly definitionCount: number;
  readonly hasLists: boolean;
  readonly listCount: number;
  readonly hasTables: boolean;
  readonly tableCount: number;
  readonly chunkableContentScore: number;
  readonly citationFriendly: boolean;
  readonly citationCount: number;
  readonly aiAnswerabilityScore: number;
}

/* ──────────────── Freshness ──────────────── */

export interface FreshnessResult {
  readonly hasPublishedDate: boolean;
  readonly publishedDate: string | null;
  readonly hasModifiedDate: boolean;
  readonly modifiedDate: string | null;
  readonly freshnessScore: number;
  readonly isStale: boolean;
  readonly daysSincePublished: number | null;
  readonly daysSinceModified: number | null;
}

/* ───────────────── Result ──────────────── */

export interface ContentAnalysisResult {
  readonly readability: ReadabilityResult;
  readonly headings: HeadingResult;
  readonly keywords: KeywordResult;
  readonly structure: StructureResult;
  readonly media: MediaResult;
  readonly eeat: EEATResult;
  readonly aiAnswerability: AIAnswerabilityResult;
  readonly freshness: FreshnessResult;
}

/* ──────────────── Analyzer Interface ──────────────── */

/**
 * Every analyzer implements this interface.
 *
 * @template T — The analyzer's specific result type (e.g. ReadabilityResult).
 */
export interface ContentAnalyzer<T> {
  analyze(context: ContentAnalysisContext): T;
}

/* ──────────────── Default values for safe fallback ──────────────── */

export const DEFAULT_READABILITY: ReadabilityResult = Object.freeze({
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

export const DEFAULT_HEADING: HeadingResult = Object.freeze({
  hierarchy: [],
  hierarchyIssues: [],
  coverage: { h1Count: 0, h2Count: 0, h3Count: 0, h4Count: 0, h5Count: 0, h6Count: 0 },
  missingH1: true,
  duplicateHeadings: [],
  totalHeadings: 0,
});

export const DEFAULT_KEYWORD: KeywordResult = Object.freeze({
  keywords: [],
  totalWords: 0,
  uniqueWords: 0,
  stopWordRatio: 0,
  overusedKeywords: [],
});

export const DEFAULT_STRUCTURE: StructureResult = Object.freeze({
  listCount: 0,
  tableCount: 0,
  hasFAQ: false,
  faqCount: 0,
  internalLinkCount: 0,
  externalLinkCount: 0,
  contentDepth: 0,
});

export const DEFAULT_MEDIA: MediaResult = Object.freeze({
  imageCount: 0,
  imagesWithAlt: 0,
  imagesWithoutAlt: 0,
  imageToTextRatio: 0,
});

export const DEFAULT_EEAT: EEATResult = Object.freeze({
  hasAuthor: false,
  authorName: null,
  hasAuthorMeta: false,
  hasAuthorSchema: false,
  hasContactInfo: false,
  contactTypes: [],
  hasOrganizationInfo: false,
  organizationName: null,
  hasOrganizationSchema: false,
  trustIndicators: [],
  trustIndicatorCount: 0,
  eeatSignalCount: 0,
});

export const DEFAULT_AI_ANSWERABILITY: AIAnswerabilityResult = Object.freeze({
  hasQASections: false,
  qaSectionCount: 0,
  hasDefinitions: false,
  definitionCount: 0,
  hasLists: false,
  listCount: 0,
  hasTables: false,
  tableCount: 0,
  chunkableContentScore: 0,
  citationFriendly: false,
  citationCount: 0,
  aiAnswerabilityScore: 0,
});

export const DEFAULT_FRESHNESS: FreshnessResult = Object.freeze({
  hasPublishedDate: false,
  publishedDate: null,
  hasModifiedDate: false,
  modifiedDate: null,
  freshnessScore: 0,
  isStale: true,
  daysSincePublished: null,
  daysSinceModified: null,
});

export const DEFAULT_RESULT: ContentAnalysisResult = Object.freeze({
  readability: DEFAULT_READABILITY,
  headings: DEFAULT_HEADING,
  keywords: DEFAULT_KEYWORD,
  structure: DEFAULT_STRUCTURE,
  media: DEFAULT_MEDIA,
  eeat: DEFAULT_EEAT,
  aiAnswerability: DEFAULT_AI_ANSWERABILITY,
  freshness: DEFAULT_FRESHNESS,
});
