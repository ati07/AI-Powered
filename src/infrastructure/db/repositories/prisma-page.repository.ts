/**
 * Infrastructure — Prisma Page Repository.
 *
 * Implements the {@link IPageRepository} interface using Prisma.
 * JSON fields are serialised / deserialised transparently.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import {
  PageEntity,
  type CreatePageEntityInput,
  type PageHeadingSnapshot,
  type PageImageSnapshot,
  type PageLinkSnapshot,
  type PageStructuredDataSnapshot,
  type PageWarningSnapshot,
} from "@/domain/entities/page.entity";
import {
  type IPageRepository,
  type CreatePageInput,
  type CreatePagesInput,
  type FindPagesByScanInput,
  type FindPageByUrlInput,
  type FindScanPagesPaginatedInput,
  type FindScanPagesPaginatedResult,
} from "@/domain/repositories/page.repository";
import type {
  CategoryScore,
  Deduction,
  Recommendation,
} from "@/scoring/calculator/types";
import { PageScoreEntity } from "@/domain/entities/page-score.entity";

/* ──────────────── Helpers ──────────────── */

type PrismaJsonValue = Prisma.JsonValue;

/**
 * Wrap a nullable JavaScript value so it can be passed to a Prisma JSON field.
 * - `null` → `Prisma.DbNull` (SQL `NULL`)
 * - a value → the value itself (Prisma serialises to JSONB)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonField(value: unknown): any {
  return value === null ? Prisma.DbNull : value;
}

/**
 * Safely cast a Prisma JSON value back to the expected domain type.
 * Returns `null` when the column was SQL NULL or not present.
 */
function castJson<T>(value: PrismaJsonValue | null | undefined): T | null {
  if (value === null || value === undefined) return null;
  return value as unknown as T;
}

/* ──────────────── Mapper ──────────────── */

function toDomain(
  dbPage: {
    id: string;
    scanId: string;
    url: string;
    finalUrl: string;
    statusCode: number;
    contentType: string;
    title: string | null;
    metaDescription: string | null;
    canonical: string | null;
    robots: string | null;
    openGraph: PrismaJsonValue | null;
    twitter: PrismaJsonValue | null;
    language: string | null;
    charset: string | null;
    viewport: string | null;
    headings: PrismaJsonValue | null;
    images: PrismaJsonValue | null;
    links: PrismaJsonValue | null;
    structuredData: PrismaJsonValue | null;
    crawlDepth: number;
    parentUrl: string | null;
    source: string;
    warnings: PrismaJsonValue | null;
    downloadDurationMs: number;
    extractionDurationMs: number;
    createdAt: Date;
  },
): PageEntity {
  const input: CreatePageEntityInput = {
    id: dbPage.id,
    scanId: dbPage.scanId,
    url: dbPage.url,
    finalUrl: dbPage.finalUrl,
    statusCode: dbPage.statusCode,
    contentType: dbPage.contentType,
    title: dbPage.title,
    metaDescription: dbPage.metaDescription,
    canonical: dbPage.canonical,
    robots: dbPage.robots,
    openGraph: castJson<Record<string, string>>(dbPage.openGraph),
    twitter: castJson<Record<string, string>>(dbPage.twitter),
    language: dbPage.language,
    charset: dbPage.charset,
    viewport: dbPage.viewport,
    headings: castJson<PageHeadingSnapshot>(dbPage.headings),
    images: castJson<PageImageSnapshot[]>(dbPage.images),
    links: castJson<PageLinkSnapshot[]>(dbPage.links),
    structuredData: castJson<PageStructuredDataSnapshot[]>(dbPage.structuredData),
    crawlDepth: dbPage.crawlDepth,
    parentUrl: dbPage.parentUrl,
    source: dbPage.source,
    warnings: castJson<PageWarningSnapshot[]>(dbPage.warnings),
    downloadDurationMs: dbPage.downloadDurationMs,
    extractionDurationMs: dbPage.extractionDurationMs,
    createdAt: dbPage.createdAt,
  };
  return new PageEntity(input);
}

function toPrismaCreate(page: PageEntity): Prisma.PageCreateInput {
  return {
    id: page.id,
    scan: { connect: { id: page.scanId } },
    url: page.url,
    finalUrl: page.finalUrl,
    statusCode: page.statusCode,
    contentType: page.contentType,
    title: page.title,
    metaDescription: page.metaDescription,
    canonical: page.canonical,
    robots: page.robots,
    openGraph: jsonField(page.openGraph),
    twitter: jsonField(page.twitter),
    language: page.language,
    charset: page.charset,
    viewport: page.viewport,
    headings: jsonField(page.headings),
    images: jsonField(page.images),
    links: jsonField(page.links),
    structuredData: jsonField(page.structuredData),
    crawlDepth: page.crawlDepth,
    parentUrl: page.parentUrl,
    source: page.source,
    warnings: jsonField(page.warnings),
    downloadDurationMs: page.downloadDurationMs,
    extractionDurationMs: page.extractionDurationMs,
    createdAt: page.createdAt,
  };
}

/**
 * Convert a Prisma PageScore row to a domain PageScoreEntity.
 */
function pageScoreToDomain(
  dbScore: {
    id: string;
    pageId: string;
    scanId: string;
    overallScore: number;
    categoryScores: PrismaJsonValue;
    deductions: PrismaJsonValue;
    recommendations: PrismaJsonValue;
    scoredAt: Date;
  },
): PageScoreEntity {
  return new PageScoreEntity({
    id: dbScore.id,
    pageId: dbScore.pageId,
    scanId: dbScore.scanId,
    overallScore: dbScore.overallScore,
    categoryScores: castJson<CategoryScore[]>(dbScore.categoryScores) ?? [],
    deductions: castJson<Deduction[]>(dbScore.deductions) ?? [],
    recommendations: castJson<Recommendation[]>(dbScore.recommendations) ?? [],
    scoredAt: dbScore.scoredAt,
  });
}

/* ──────────────── Repository ──────────────── */

export class PrismaPageRepository implements IPageRepository {
  async create(input: CreatePageInput): Promise<PageEntity> {
    const data = toPrismaCreate(input.page);

    const saved = await prisma.page.create({
      data,
    });

    return toDomain(saved);
  }

  async createMany(input: CreatePagesInput): Promise<PageEntity[]> {
    const data = input.pages.map(toPrismaCreate);

    const saved = await prisma.$transaction(
      data.map((d) => prisma.page.create({ data: d })),
    );

    return saved.map(toDomain);
  }

  async findByScan(input: FindPagesByScanInput): Promise<PageEntity[]> {
    const pages = await prisma.page.findMany({
      where: { scanId: input.scanId },
      orderBy: { url: "asc" },
    });

    return pages.map(toDomain);
  }

  async findByUrl(input: FindPageByUrlInput): Promise<PageEntity | null> {
    const page = await prisma.page.findFirst({
      where: {
        scanId: input.scanId,
        url: input.url,
      },
    });

    return page ? toDomain(page) : null;
  }

  async findByScanPaginated(
    input: FindScanPagesPaginatedInput,
  ): Promise<FindScanPagesPaginatedResult> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const sortBy = input.sortBy ?? "url";
    const sortDir = input.sortDir ?? "asc";
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: Prisma.PageWhereInput = { scanId: input.scanId };

    // Score range filter — only applies to pages that have been scored
    if (input.minScore !== undefined || input.maxScore !== undefined) {
      const scoreFilter: Prisma.PageScoreWhereInput = {};
      if (input.minScore !== undefined) {
        scoreFilter.overallScore = {
          ...(scoreFilter.overallScore as Prisma.IntFilter ?? {}),
          gte: input.minScore,
        };
      }
      if (input.maxScore !== undefined) {
        scoreFilter.overallScore = {
          ...(scoreFilter.overallScore as Prisma.IntFilter ?? {}),
          lte: input.maxScore,
        };
      }
      where.pageScore = scoreFilter;
    }

    // Indexability filter
    if (input.indexability === "indexable") {
      where.OR = [
        { robots: { not: { contains: "noindex" } } },
        { robots: null },
      ];
    } else if (input.indexability === "noindex") {
      where.robots = { contains: "noindex" };
    }

    // Missing field filters
    if (input.missingTitle) {
      where.title = null;
    }
    if (input.missingDescription) {
      where.metaDescription = null;
    }
    if (input.missingCanonical) {
      where.canonical = null;
    }
    if (input.missingStructuredData) {
      where.structuredData = { equals: Prisma.DbNull };
    }

    // Build orderBy
    let orderBy: Prisma.PageOrderByWithRelationInput;
    if (sortBy === "score") {
      orderBy = { pageScore: { overallScore: sortDir } };
    } else {
      orderBy = { [sortBy]: sortDir };
    }

    // Execute count + findMany in parallel
    const [total, rows] = await Promise.all([
      prisma.page.count({ where }),
      prisma.page.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          pageScore: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const items = rows.map((row) => ({
      page: toDomain(row),
      score: row.pageScore
        ? pageScoreToDomain(row.pageScore)
        : null,
    }));

    return { items, total, page, pageSize, totalPages };
  }
}
