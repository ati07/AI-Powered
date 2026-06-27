import { ScanEntity } from "../entities/scan.entity";

export interface FindScanByIdInput {
  id: string;
}

export interface FindScansByWebsiteInput {
  websiteId: string;
}

export interface FindRunningScanInput {
  websiteId: string;
}

export interface CreateScanInput {
  scan: ScanEntity;
}

export interface UpdateScanInput {
  id: string;
  status?: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  pagesFound?: number;
  pagesCrawled?: number;
  error?: string | null;
  updatedAt?: Date;
}

export interface IScanRepository {
  /** Create a new scan. */
  create(input: CreateScanInput): Promise<ScanEntity>;

  /** Update an existing scan's mutable fields. */
  update(input: UpdateScanInput): Promise<ScanEntity>;

  /** Find a scan by its ID. */
  findById(input: FindScanByIdInput): Promise<ScanEntity | null>;

  /** List all scans for a website, newest first. */
  findByWebsite(input: FindScansByWebsiteInput): Promise<ScanEntity[]>;

  /** Find the currently RUNNING scan for a website, if any. */
  findRunningScan(input: FindRunningScanInput): Promise<ScanEntity | null>;

  /** Find the oldest PENDING scan. Returns null if none exist. */
  findNextPending(): Promise<ScanEntity | null>;

  /** Atomically update the status of a scan. */
  updateStatus(input: { id: string; status: string }): Promise<void>;

  /** Atomically update progress counters. */
  updateProgress(input: {
    id: string;
    pagesFound: number;
    pagesCrawled: number;
  }): Promise<void>;
}
