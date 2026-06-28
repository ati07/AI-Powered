import { prisma } from "@/infrastructure/db/prisma";
import {
  ScanEntity,
  ScanStatus,
  type CreateScanEntityInput,
} from "@/domain/entities/scan.entity";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import type {
  CreateScanInput,
  UpdateScanInput,
  FindScanByIdInput,
  FindScansByWebsiteInput,
  FindRunningScanInput,
} from "@/domain/repositories/scan.repository";
import { NotFoundError } from "@/application/common/errors";

/* ──────────────── Mapper ──────────────── */

const STATUS_MAP: Record<string, ScanStatus> = {
  PENDING: ScanStatus.PENDING,
  RUNNING: ScanStatus.RUNNING,
  COMPLETED: ScanStatus.COMPLETED,
  FAILED: ScanStatus.FAILED,
  CANCELLED: ScanStatus.CANCELLED,
};

function toDomain(dbScan: {
  id: string;
  websiteId: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  pagesFound: number;
  pagesCrawled: number;
  pagesFailed: number;
  error: string | null;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  pagesScored: number | null;
  createdAt: Date;
  updatedAt: Date;
}): ScanEntity {
  const input: CreateScanEntityInput = {
    id: dbScan.id,
    websiteId: dbScan.websiteId,
    status: STATUS_MAP[dbScan.status] ?? ScanStatus.PENDING,
    startedAt: dbScan.startedAt,
    finishedAt: dbScan.finishedAt,
    pagesFound: dbScan.pagesFound,
    pagesCrawled: dbScan.pagesCrawled,
    pagesFailed: dbScan.pagesFailed,
    error: dbScan.error,
    averageScore: dbScan.averageScore,
    highestScore: dbScan.highestScore,
    lowestScore: dbScan.lowestScore,
    pagesScored: dbScan.pagesScored,
    createdAt: dbScan.createdAt,
    updatedAt: dbScan.updatedAt,
  };
  return new ScanEntity(input);
}

/* ──────────────── Repository ──────────────── */

export class PrismaScanRepository implements IScanRepository {
  async create(input: CreateScanInput): Promise<ScanEntity> {
    const saved = await prisma.scan.create({
      data: {
        id: input.scan.id,
        websiteId: input.scan.websiteId,
        status: input.scan.status,
        startedAt: input.scan.startedAt,
        finishedAt: input.scan.finishedAt,
        pagesFound: input.scan.pagesFound,
        pagesCrawled: input.scan.pagesCrawled,
        pagesFailed: input.scan.pagesFailed,
        error: input.scan.error,
        createdAt: input.scan.createdAt,
        updatedAt: input.scan.updatedAt,
      },
    });

    return toDomain(saved);
  }

  async update(input: UpdateScanInput): Promise<ScanEntity> {
    const data: Record<string, unknown> = {};

    if (input.status !== undefined) data.status = input.status;
    if (input.startedAt !== undefined) data.startedAt = input.startedAt;
    if (input.finishedAt !== undefined) data.finishedAt = input.finishedAt;
    if (input.pagesFound !== undefined) data.pagesFound = input.pagesFound;
    if (input.pagesCrawled !== undefined) data.pagesCrawled = input.pagesCrawled;
    if (input.pagesFailed !== undefined) data.pagesFailed = input.pagesFailed;
    if (input.error !== undefined) data.error = input.error;
    if (input.averageScore !== undefined) data.averageScore = input.averageScore;
    if (input.highestScore !== undefined) data.highestScore = input.highestScore;
    if (input.lowestScore !== undefined) data.lowestScore = input.lowestScore;
    if (input.pagesScored !== undefined) data.pagesScored = input.pagesScored;
    if (input.updatedAt !== undefined) data.updatedAt = input.updatedAt;

    try {
      const saved = await prisma.scan.update({
        where: { id: input.id },
        data,
      });

      return toDomain(saved);
    } catch {
      throw new NotFoundError("Scan", input.id);
    }
  }

  async findById(input: FindScanByIdInput): Promise<ScanEntity | null> {
    const scan = await prisma.scan.findUnique({
      where: { id: input.id },
    });

    return scan ? toDomain(scan) : null;
  }

  async findByWebsite(
    input: FindScansByWebsiteInput,
  ): Promise<ScanEntity[]> {
    const scans = await prisma.scan.findMany({
      where: { websiteId: input.websiteId },
      orderBy: { createdAt: "desc" },
    });

    return scans.map(toDomain);
  }

  async findRunningScan(
    input: FindRunningScanInput,
  ): Promise<ScanEntity | null> {
    const scan = await prisma.scan.findFirst({
      where: {
        websiteId: input.websiteId,
        status: "RUNNING",
      },
    });

    return scan ? toDomain(scan) : null;
  }

  async findNextPending(): Promise<ScanEntity | null> {
    const scan = await prisma.scan.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    return scan ? toDomain(scan) : null;
  }

  async updateStatus(input: {
    id: string;
    status: string;
  }): Promise<void> {
    try {
      await prisma.scan.update({
        where: { id: input.id },
        data: { status: input.status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" },
      });
    } catch {
      throw new NotFoundError("Scan", input.id);
    }
  }

  async updateProgress(input: {
    id: string;
    pagesFound: number;
    pagesCrawled: number;
    pagesFailed?: number;
  }): Promise<void> {
    try {
      const data: Record<string, unknown> = {
        pagesFound: input.pagesFound,
        pagesCrawled: input.pagesCrawled,
      };
      if (input.pagesFailed !== undefined) data.pagesFailed = input.pagesFailed;

      await prisma.scan.update({
        where: { id: input.id },
        data,
      });
    } catch {
      throw new NotFoundError("Scan", input.id);
    }
  }
}
