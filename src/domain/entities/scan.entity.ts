/**
 * Scan lifecycle statuses.
 *
 * Valid transitions:
 *   PENDING  →  RUNNING
 *   RUNNING  →  COMPLETED | FAILED | CANCELLED
 *   PENDING  →  CANCELLED
 */
export enum ScanStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/** Allowed transitions keyed by current status. */
const VALID_TRANSITIONS: Record<ScanStatus, ScanStatus[]> = {
  [ScanStatus.PENDING]: [ScanStatus.RUNNING, ScanStatus.CANCELLED],
  [ScanStatus.RUNNING]: [ScanStatus.COMPLETED, ScanStatus.FAILED, ScanStatus.CANCELLED],
  [ScanStatus.COMPLETED]: [],
  [ScanStatus.FAILED]: [],
  [ScanStatus.CANCELLED]: [],
};

export interface ScanEntityProps {
  id: string;
  websiteId: string;
  status: ScanStatus;
  startedAt: Date | null;
  finishedAt: Date | null;
  pagesFound: number;
  pagesCrawled: number;
  pagesFailed: number;
  error: string | null;

  /** Scan summary — AI Visibility Score statistics. */
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  pagesScored: number | null;

  createdAt: Date;
  updatedAt: Date;
}

export class ScanEntity {
  private readonly props: ScanEntityProps;

  constructor(props: CreateScanEntityInput) {
    this.props = {
      ...props,
      averageScore: props.averageScore ?? null,
      highestScore: props.highestScore ?? null,
      lowestScore: props.lowestScore ?? null,
      pagesScored: props.pagesScored ?? null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get websiteId(): string {
    return this.props.websiteId;
  }

  get status(): ScanStatus {
    return this.props.status;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get finishedAt(): Date | null {
    return this.props.finishedAt;
  }

  get pagesFound(): number {
    return this.props.pagesFound;
  }

  get pagesCrawled(): number {
    return this.props.pagesCrawled;
  }

  get pagesFailed(): number {
    return this.props.pagesFailed;
  }

  get error(): string | null {
    return this.props.error;
  }

  get averageScore(): number | null {
    return this.props.averageScore;
  }

  get highestScore(): number | null {
    return this.props.highestScore;
  }

  get lowestScore(): number | null {
    return this.props.lowestScore;
  }

  get pagesScored(): number | null {
    return this.props.pagesScored;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /* ──────────────── Domain Behavior ──────────────── */

  /**
   * Transition the scan to RUNNING.
   * Records the startedAt timestamp on first invocation.
   */
  start(): ScanEntity {
    this.assertTransition(ScanStatus.RUNNING);
    return new ScanEntity({
      ...this.props,
      status: ScanStatus.RUNNING,
      startedAt: this.props.startedAt ?? new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Transition the scan to COMPLETED.
   * Records the finishedAt timestamp.
   */
  complete(): ScanEntity {
    this.assertTransition(ScanStatus.COMPLETED);
    return new ScanEntity({
      ...this.props,
      status: ScanStatus.COMPLETED,
      finishedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Transition the scan to FAILED.
   * Stores the error message and records the finishedAt timestamp.
   */
  fail(errorMessage: string): ScanEntity {
    this.assertTransition(ScanStatus.FAILED);
    return new ScanEntity({
      ...this.props,
      status: ScanStatus.FAILED,
      error: errorMessage,
      finishedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Transition the scan to CANCELLED.
   * Records the finishedAt timestamp.
   */
  cancel(): ScanEntity {
    this.assertTransition(ScanStatus.CANCELLED);
    return new ScanEntity({
      ...this.props,
      status: ScanStatus.CANCELLED,
      finishedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Increment the pagesFound counter.
   */
  incrementPagesFound(): ScanEntity {
    return new ScanEntity({
      ...this.props,
      pagesFound: this.props.pagesFound + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Increment the pagesCrawled counter.
   */
  incrementPagesCrawled(): ScanEntity {
    return new ScanEntity({
      ...this.props,
      pagesCrawled: this.props.pagesCrawled + 1,
      updatedAt: new Date(),
    });
  }

  /* ──────────────── Helpers ──────────────── */

  /**
   * Throws if transitioning to `target` from the current status is not allowed.
   */
  private assertTransition(target: ScanStatus): void {
    const allowed = VALID_TRANSITIONS[this.props.status];
    if (!allowed.includes(target)) {
      throw new InvalidScanTransitionError(this.props.status, target);
    }
  }
}

/**
 * Error thrown when an invalid scan status transition is attempted.
 */
export class InvalidScanTransitionError extends Error {
  constructor(from: ScanStatus, to: ScanStatus) {
    super(`Cannot transition scan from ${from} to ${to}`);
    this.name = "InvalidScanTransitionError";
  }
}

export type CreateScanEntityInput = Omit<
  ScanEntityProps,
  "createdAt" | "updatedAt" | "averageScore" | "highestScore" | "lowestScore" | "pagesScored"
> & {
  createdAt?: Date;
  updatedAt?: Date;
  averageScore?: number | null;
  highestScore?: number | null;
  lowestScore?: number | null;
  pagesScored?: number | null;
};
