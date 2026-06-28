/**
 * Crawler — URL queue.
 *
 * A FIFO queue that stores discovered URLs with deduplication,
 * crawl depth, and source tracking.
 *
 * Framework-independent — works in-memory and is fully testable.
 * Later stories may replace this with a persistent queue (Redis,
 * database, …) behind the same interface.
 */

import { type QueueEntry } from "./types";

/**
 * Result returned by {@link UrlQueue.enqueue}.
 */
export type EnqueueResult = "added" | "duplicate";

export class UrlQueue {
  private readonly entries: QueueEntry[] = [];
  private readonly seenUrls: Set<string> = new Set();

  /**
   * Add a URL to the queue.
   *
   * @returns `"added"` when the entry was new, `"duplicate"` when
   *          the normalized URL was already in the queue.
   */
  enqueue(entry: QueueEntry): EnqueueResult {
    if (this.seenUrls.has(entry.normalizedUrl)) {
      return "duplicate";
    }

    this.seenUrls.add(entry.normalizedUrl);
    this.entries.push(entry);
    return "added";
  }

  /**
   * Remove and return the next entry in FIFO order.
   * Returns `undefined` when the queue is empty.
   */
  dequeue(): QueueEntry | undefined {
    return this.entries.shift();
  }

  /**
   * Return the next entry without removing it.
   * Returns `undefined` when the queue is empty.
   */
  peek(): QueueEntry | undefined {
    return this.entries[0];
  }

  /**
   * Check whether a normalized URL is already in the queue.
   */
  has(normalizedUrl: string): boolean {
    return this.seenUrls.has(normalizedUrl);
  }

  /** Number of entries currently in the queue. */
  get size(): number {
    return this.entries.length;
  }

  /** `true` when the queue holds zero entries. */
  isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /**
   * Return a shallow copy of all entries (preserves FIFO order).
   */
  toArray(): readonly QueueEntry[] {
    return [...this.entries];
  }

  /** Remove every entry and reset the dedup set. */
  clear(): void {
    this.entries.length = 0;
    this.seenUrls.clear();
  }
}
