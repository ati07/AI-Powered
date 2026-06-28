/**
 * Domain — Page Entity.
 *
 * An immutable snapshot of a single crawled page, holding the SEO-relevant
 * data extracted from the HTML at crawl time.
 *
 * Pages are **immutable**: once created they can never be updated.
 * No setter, no update method, no state-mutating domain behaviour.
 */

/* ──────────────── Snapshot types ──────────────── */

/**
 * Headings snapshot — mirrors the shape of the SeoExtractor's HeadingInfo
 * but defined in the domain layer to avoid a dependency on the crawler.
 */
export interface PageHeadingSnapshot {
  readonly h1: readonly string[];
  readonly h2: readonly string[];
  readonly h3: readonly string[];
  readonly h4: readonly string[];
  readonly h5: readonly string[];
  readonly h6: readonly string[];
}

/**
 * Single image found on the page.
 */
export interface PageImageSnapshot {
  readonly src: string;
  readonly alt: string | null;
  readonly title: string | null;
  readonly loading: string | null;
  readonly width: number | null;
  readonly height: number | null;
}

/**
 * Single link found on the page, classified as internal or external.
 */
export interface PageLinkSnapshot {
  readonly href: string;
  readonly text: string;
  readonly normalizedUrl: string | null;
  readonly type: "internal" | "external";
}

/**
 * Single JSON-LD structured-data block.
 */
export interface PageStructuredDataSnapshot {
  readonly raw: string;
  readonly json: Record<string, unknown> | unknown[] | null;
}

/**
 * Single extraction warning emitted during SEO extraction.
 */
export interface PageWarningSnapshot {
  readonly source: string;
  readonly message: string;
}

/* ──────────────── Entity Props ──────────────── */

export interface PageEntityProps {
  readonly id: string;
  readonly scanId: string;

  // General
  readonly url: string;
  readonly finalUrl: string;
  readonly statusCode: number;
  readonly contentType: string;

  // SEO
  readonly title: string | null;
  readonly metaDescription: string | null;
  readonly canonical: string | null;
  readonly robots: string | null;

  // Social
  readonly openGraph: Record<string, string> | null;
  readonly twitter: Record<string, string> | null;

  // Structure
  readonly language: string | null;
  readonly charset: string | null;
  readonly viewport: string | null;

  // Collections
  readonly headings: PageHeadingSnapshot | null;
  readonly images: PageImageSnapshot[] | null;
  readonly links: PageLinkSnapshot[] | null;
  readonly structuredData: PageStructuredDataSnapshot[] | null;

  // Metadata
  readonly crawlDepth: number;
  readonly parentUrl: string | null;
  readonly source: string;
  readonly warnings: PageWarningSnapshot[] | null;
  readonly downloadDurationMs: number;
  readonly extractionDurationMs: number;

  // Timestamps
  readonly createdAt: Date;
}

/**
 * Input type for creating a PageEntity.
 *
 * All nullable SEO / social / collection fields are optional so callers
 * only need to supply what they have; the constructor defaults missing
 * nullable fields to `null`.
 */
export type CreatePageEntityInput = Omit<
  PageEntityProps,
  | "createdAt"
  | "title"
  | "metaDescription"
  | "canonical"
  | "robots"
  | "openGraph"
  | "twitter"
  | "language"
  | "charset"
  | "viewport"
  | "headings"
  | "images"
  | "links"
  | "structuredData"
  | "parentUrl"
  | "warnings"
> & {
  createdAt?: Date;
  title?: string | null;
  metaDescription?: string | null;
  canonical?: string | null;
  robots?: string | null;
  openGraph?: Record<string, string> | null;
  twitter?: Record<string, string> | null;
  language?: string | null;
  charset?: string | null;
  viewport?: string | null;
  headings?: PageHeadingSnapshot | null;
  images?: PageImageSnapshot[] | null;
  links?: PageLinkSnapshot[] | null;
  structuredData?: PageStructuredDataSnapshot[] | null;
  parentUrl?: string | null;
  warnings?: PageWarningSnapshot[] | null;
};

/* ──────────────── Entity ──────────────── */

export class PageEntity {
  private readonly props: PageEntityProps;

  constructor(input: CreatePageEntityInput) {
    this.props = {
      ...input,
      title: input.title ?? null,
      metaDescription: input.metaDescription ?? null,
      canonical: input.canonical ?? null,
      robots: input.robots ?? null,
      openGraph: input.openGraph ?? null,
      twitter: input.twitter ?? null,
      language: input.language ?? null,
      charset: input.charset ?? null,
      viewport: input.viewport ?? null,
      headings: input.headings ?? null,
      images: input.images ?? null,
      links: input.links ?? null,
      structuredData: input.structuredData ?? null,
      parentUrl: input.parentUrl ?? null,
      warnings: input.warnings ?? null,
      createdAt: input.createdAt ?? new Date(),
    };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get scanId(): string {
    return this.props.scanId;
  }

  get url(): string {
    return this.props.url;
  }

  get finalUrl(): string {
    return this.props.finalUrl;
  }

  get statusCode(): number {
    return this.props.statusCode;
  }

  get contentType(): string {
    return this.props.contentType;
  }

  get title(): string | null {
    return this.props.title;
  }

  get metaDescription(): string | null {
    return this.props.metaDescription;
  }

  get canonical(): string | null {
    return this.props.canonical;
  }

  get robots(): string | null {
    return this.props.robots;
  }

  get openGraph(): Record<string, string> | null {
    return this.props.openGraph;
  }

  get twitter(): Record<string, string> | null {
    return this.props.twitter;
  }

  get language(): string | null {
    return this.props.language;
  }

  get charset(): string | null {
    return this.props.charset;
  }

  get viewport(): string | null {
    return this.props.viewport;
  }

  get headings(): PageHeadingSnapshot | null {
    return this.props.headings;
  }

  get images(): PageImageSnapshot[] | null {
    return this.props.images;
  }

  get links(): PageLinkSnapshot[] | null {
    return this.props.links;
  }

  get structuredData(): PageStructuredDataSnapshot[] | null {
    return this.props.structuredData;
  }

  get crawlDepth(): number {
    return this.props.crawlDepth;
  }

  get parentUrl(): string | null {
    return this.props.parentUrl;
  }

  get source(): string {
    return this.props.source;
  }

  get warnings(): PageWarningSnapshot[] | null {
    return this.props.warnings;
  }

  get downloadDurationMs(): number {
    return this.props.downloadDurationMs;
  }

  get extractionDurationMs(): number {
    return this.props.extractionDurationMs;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
