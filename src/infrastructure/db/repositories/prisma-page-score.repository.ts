/**
 * Infrastructure — Prisma Page Score Repository.
 *
 * Implements the {@link IPageScoreRepository} interface using Prisma.
 * JSON fields are serialised / deserialised transparently.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { PageScoreEntity } from "@/domain/entities/page-score.entity";
import { type IPageScoreRepository } from "@/domain/repositories/page-score.repository";
import type {
  CreatePageScoreInput,
  FindPageScoresByScanInput,
  FindPageScoreByPageInput,
} from "@/domain/repositories/page-score.repository";
import type {
  CategoryScore,
  Deduction,
  Recommendation,
} from "@/scoring/calculator/types";

/* ──────────────── Helpers ──────────────── */

type PrismaJsonValue = Prisma.JsonValue;

/**
 * Wrap a value for Prisma JSON fields.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonField(value: unknown): any {
  return value === null ? Prisma.DbNull : value;
}

/**
 * Safely cast a Prisma JSON value back to the expected domain type.
 */
function castJson<T>(value: PrismaJsonValue | null | undefined): T | null {
  if (value === null || value === undefined) return null;
  return value as unknown as T;
}

/* ──────────────── Mapper ──────────────── */

function toDomain(dbRow: {
  id: string;
  pageId: string;
  scanId: string;
  overallScore: number;
  categoryScores: PrismaJsonValue;
  deductions: PrismaJsonValue;
  recommendations: PrismaJsonValue;
  scoredAt: Date;
}): PageScoreEntity {
  return new PageScoreEntity({
    id: dbRow.id,
    pageId: dbRow.pageId,
    scanId: dbRow.scanId,
    overallScore: dbRow.overallScore,
    categoryScores: castJson<CategoryScore[]>(dbRow.categoryScores) ?? [],
    deductions: castJson<Deduction[]>(dbRow.deductions) ?? [],
    recommendations: castJson<Recommendation[]>(dbRow.recommendations) ?? [],
    scoredAt: dbRow.scoredAt,
  });
}

/* ──────────────── Repository ──────────────── */

export class PrismaPageScoreRepository implements IPageScoreRepository {
  async save(input: CreatePageScoreInput): Promise<PageScoreEntity> {
    const data = {
      id: input.pageScore.id,
      pageId: input.pageScore.pageId,
      scanId: input.pageScore.scanId,
      overallScore: input.pageScore.overallScore,
      categoryScores: jsonField(input.pageScore.categoryScores),
      deductions: jsonField(input.pageScore.deductions),
      recommendations: jsonField(input.pageScore.recommendations),
      scoredAt: input.pageScore.scoredAt,
    };

    const saved = await prisma.pageScore.upsert({
      where: { pageId: input.pageScore.pageId },
      create: data,
      update: {
        overallScore: data.overallScore,
        categoryScores: data.categoryScores,
        deductions: data.deductions,
        recommendations: data.recommendations,
        scoredAt: data.scoredAt,
      },
    });

    return toDomain(saved);
  }

  async findByScan(
    input: FindPageScoresByScanInput,
  ): Promise<PageScoreEntity[]> {
    const rows = await prisma.pageScore.findMany({
      where: { scanId: input.scanId },
      orderBy: { scoredAt: "asc" },
    });

    return rows.map(toDomain);
  }

  async findByPage(
    input: FindPageScoreByPageInput,
  ): Promise<PageScoreEntity | null> {
    const row = await prisma.pageScore.findUnique({
      where: { pageId: input.pageId },
    });

    return row ? toDomain(row) : null;
  }
}
