/**
 * Crawler — HTML Parser & SEO Extractor type definitions.
 *
 * Describes the shape of the raw extraction output before any
 * scoring or persistence.
 */

/* ──────────────── Document ──────────────── */

export interface DocumentInfo {
  /** Page `<title>` content, or `null` when absent. */
  readonly title: string | null;
  /** Value of the `<html lang="…">` attribute, or `null`. */
  readonly language: string | null;
  /** Declared charset (e.g. `utf-8`), or `null`. */
  readonly charset: string | null;
  /** Content of `<meta name="viewport" content="…">`, or `null`. */
  readonly viewport: string | null;
}

/* ──────────────── Meta ──────────────── */

export interface MetaInfo {
  /** Content of `<meta name="description" content="…">`, or `null`. */
  readonly description: string | null;
  /** Content of `<meta name="robots" content="…">`, or `null`. */
  readonly robots: string | null;
}

/* ──────────────── Canonical ──────────────── */

export interface CanonicalInfo {
  /** URL from `<link rel="canonical" href="…">`, or `null`. */
  readonly url: string | null;
}

/* ──────────────── OpenGraph ──────────────── */

/**
 * Map of Open Graph properties discovered in the page.
 *
 * Keys use the full `property` attribute value (e.g. `"og:title"`,
 * `"og:description"`, `"og:image"`).  When the same property
 * appears multiple times only the first value is retained — a
 * warning is emitted for each duplicate.
 */
export interface OpenGraphInfo {
  readonly [property: string]: string | undefined;
}

/* ──────────────── Twitter ──────────────── */

/**
 * Map of Twitter Card properties.
 *
 * Keys use the full `name` attribute value (e.g. `"twitter:card"`,
 * `"twitter:site"`).  The same first-value-wins rule applies.
 */
export interface TwitterInfo {
  readonly [property: string]: string | undefined;
}

/* ──────────────── Headings ──────────────── */

export interface HeadingInfo {
  readonly h1: readonly string[];
  readonly h2: readonly string[];
  readonly h3: readonly string[];
  readonly h4: readonly string[];
  readonly h5: readonly string[];
  readonly h6: readonly string[];
}

/* ──────────────── Images ──────────────── */

export interface ImageInfo {
  /** Image `src` attribute (raw, as-written in HTML). */
  readonly src: string;
  /** `alt` attribute, or `null`. */
  readonly alt: string | null;
  /** `title` attribute, or `null`. */
  readonly title: string | null;
  /** `loading` attribute (`"lazy"` / `"eager"`), or `null`. */
  readonly loading: string | null;
  /** Declared `width` attribute (parsed to number), or `null`. */
  readonly width: number | null;
  /** Declared `height` attribute (parsed to number), or `null`. */
  readonly height: number | null;
}

/* ──────────────── Links ──────────────── */

export interface LinkInfo {
  /** Raw `href` attribute value. */
  readonly href: string;
  /** Visible link text (inner text of the `<a>` element). */
  readonly text: string;
  /**
   * Normalised absolute URL, or `null` when the URL could not be
   * normalised (invalid scheme, malformed, etc.).
   */
  readonly normalizedUrl: string | null;
}

/* ──────────────── Structured data ──────────────── */

export interface StructuredDataInfo {
  /** Raw JSON text from the `<script>` block. */
  readonly raw: string;
  /**
   * Parsed JSON value, or `null` when the content is not valid JSON
   * (a warning is recorded in that case).
   */
  readonly json: Record<string, unknown> | unknown[] | null;
}

/* ──────────────── Warnings ──────────────── */

export interface ExtractionWarning {
  /** Human-readable description of what went wrong. */
  readonly message: string;
  /** The extraction area that produced this warning (e.g. `"title"`, `"json-ld"`). */
  readonly source: string;
}

/* ──────────────── Page statistics ──────────────── */

export interface PageStats {
  readonly totalImages: number;
  readonly totalInternalLinks: number;
  readonly totalExternalLinks: number;
  readonly totalStructuredData: number;
  readonly totalHeadings: number;
}

/* ───────────────── Full result ──────────────── */

/**
 * The result of parsing and extracting SEO data from a single HTML page.
 *
 * Every field is populated — never throws during construction.
 */
export interface SeoResult {
  readonly document: DocumentInfo;
  readonly meta: MetaInfo;
  readonly canonical: CanonicalInfo;
  readonly openGraph: OpenGraphInfo;
  readonly twitter: TwitterInfo;
  readonly headings: HeadingInfo;
  readonly images: readonly ImageInfo[];
  readonly internalLinks: readonly LinkInfo[];
  readonly externalLinks: readonly LinkInfo[];
  readonly structuredData: readonly StructuredDataInfo[];
  readonly warnings: readonly ExtractionWarning[];
  readonly stats: PageStats;
}
