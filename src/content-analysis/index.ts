/**
 * Content Analysis — barrel exports.
 */

export { ContentAnalysisEngine } from "./content-analysis-engine";

export { ReadabilityAnalyzer } from "./analyzers/readability-analyzer";
export { HeadingAnalyzer } from "./analyzers/heading-analyzer";
export { KeywordAnalyzer } from "./analyzers/keyword-analyzer";
export { StructureAnalyzer } from "./analyzers/structure-analyzer";
export { MediaAnalyzer } from "./analyzers/media-analyzer";
export { EEATAnalyzer } from "./analyzers/eeat-analyzer";
export { AIAnswerabilityAnalyzer } from "./analyzers/ai-answerability-analyzer";
export { FreshnessAnalyzer } from "./analyzers/freshness-analyzer";

export type {
  ContentAnalysisInput,
  ContentAnalysisContext,
  ContentAnalysisResult,
  ContentAnalyzer,
  ReadabilityResult,
  ReadingLevel,
  HeadingResult,
  HeadingCoverage,
  HierarchyIssue,
  DuplicateHeading,
  KeywordResult,
  KeywordInfo,
  StructureResult,
  MediaResult,
  EEATResult,
  AIAnswerabilityResult,
  FreshnessResult,
} from "./types";

export {
  DEFAULT_RESULT,
  DEFAULT_READABILITY,
  DEFAULT_HEADING,
  DEFAULT_KEYWORD,
  DEFAULT_STRUCTURE,
  DEFAULT_MEDIA,
  DEFAULT_EEAT,
  DEFAULT_AI_ANSWERABILITY,
  DEFAULT_FRESHNESS,
} from "./types";
