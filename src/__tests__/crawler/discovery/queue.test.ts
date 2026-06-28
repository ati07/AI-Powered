import { describe, it, expect } from "vitest";
import { UrlQueue } from "@/crawler/discovery/queue";
import { DiscoverySource, type QueueEntry } from "@/crawler/discovery/types";

/* ──────────────── Helpers ──────────────── */

function makeEntry(overrides?: Partial<QueueEntry>): QueueEntry {
  return {
    url: "https://example.com/page",
    normalizedUrl: "https://example.com/page",
    parentUrl: null,
    depth: 0,
    source: DiscoverySource.HOMEPAGE,
    discoveredAt: new Date().toISOString(),
    ...overrides,
  };
}

/* ──────────────── Suite ──────────────── */

describe("UrlQueue", () => {
  describe("enqueue", () => {
    it("should add a new entry and return 'added'", () => {
      const queue = new UrlQueue();
      expect(queue.enqueue(makeEntry())).toBe("added");
    });

    it("should reject duplicate normalized URLs and return 'duplicate'", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      expect(
        queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" })),
      ).toBe("duplicate");
    });

    it("should allow different normalized URLs", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      expect(
        queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/b" })),
      ).toBe("added");
    });

    it("should not count different original URLs with the same normalized URL as unique", () => {
      const queue = new UrlQueue();
      queue.enqueue(
        makeEntry({
          url: "https://example.com/page",
          normalizedUrl: "https://example.com/page",
        }),
      );
      // Different casing in original URL but same normalized
      const result = queue.enqueue(
        makeEntry({
          url: "https://Example.COM/page",
          normalizedUrl: "https://example.com/page",
        }),
      );
      expect(result).toBe("duplicate");
    });
  });

  describe("FIFO ordering", () => {
    it("should return entries in FIFO order", () => {
      const queue = new UrlQueue();

      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/first" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/second" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/third" }));

      expect(queue.dequeue()!.normalizedUrl).toBe(
        "https://example.com/first",
      );
      expect(queue.dequeue()!.normalizedUrl).toBe(
        "https://example.com/second",
      );
      expect(queue.dequeue()!.normalizedUrl).toBe(
        "https://example.com/third",
      );
    });

    it("should dequeue in the same order entries were added", () => {
      const queue = new UrlQueue();

      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.enqueue(
        makeEntry({
          normalizedUrl: "https://example.com/b",
          depth: 1,
          source: DiscoverySource.SITEMAP,
        }),
      );
      queue.enqueue(
        makeEntry({
          normalizedUrl: "https://example.com/c",
          parentUrl: "https://example.com/a",
          depth: 2,
          source: DiscoverySource.INTERNAL_LINK,
        }),
      );

      const first = queue.dequeue()!;
      expect(first.normalizedUrl).toBe("https://example.com/a");
      expect(first.depth).toBe(0);
      expect(first.source).toBe(DiscoverySource.HOMEPAGE);

      const second = queue.dequeue()!;
      expect(second.normalizedUrl).toBe("https://example.com/b");
      expect(second.depth).toBe(1);
      expect(second.source).toBe(DiscoverySource.SITEMAP);

      const third = queue.dequeue()!;
      expect(third.normalizedUrl).toBe("https://example.com/c");
      expect(third.parentUrl).toBe("https://example.com/a");
      expect(third.depth).toBe(2);
      expect(third.source).toBe(DiscoverySource.INTERNAL_LINK);
    });
  });

  describe("peek", () => {
    it("should return the next entry without removing it", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/first" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/second" }));

      expect(queue.peek()!.normalizedUrl).toBe("https://example.com/first");
      expect(queue.size).toBe(2); // still there
    });

    it("should return undefined for an empty queue", () => {
      const queue = new UrlQueue();
      expect(queue.peek()).toBeUndefined();
    });
  });

  describe("dequeue", () => {
    it("should return undefined for an empty queue", () => {
      const queue = new UrlQueue();
      expect(queue.dequeue()).toBeUndefined();
    });

    it("should reduce the queue size", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/b" }));

      queue.dequeue();
      expect(queue.size).toBe(1);

      queue.dequeue();
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe("has", () => {
    it("should return true for an enqueued normalized URL", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/page" }));

      expect(queue.has("https://example.com/page")).toBe(true);
    });

    it("should return false for a URL not in the queue", () => {
      const queue = new UrlQueue();
      expect(queue.has("https://example.com/missing")).toBe(false);
    });

    it("should return true even after the entry was dequeued", () => {
      // The dedup set should persist after dequeue
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/page" }));
      queue.dequeue();

      expect(queue.has("https://example.com/page")).toBe(true);
    });
  });

  describe("size / isEmpty", () => {
    it("should start empty", () => {
      const queue = new UrlQueue();
      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });

    it("should reflect the number of unique entries added", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/b" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/c" }));

      expect(queue.size).toBe(3);
    });

    it("should not count duplicates in size", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" })); // duplicate

      expect(queue.size).toBe(1);
    });
  });

  describe("toArray", () => {
    it("should return a shallow copy of all entries in FIFO order", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/b" }));

      const arr = queue.toArray();
      expect(arr).toHaveLength(2);
      expect(arr[0]!.normalizedUrl).toBe("https://example.com/a");
      expect(arr[1]!.normalizedUrl).toBe("https://example.com/b");

      // Mutating the copy should not affect the original
      (arr as QueueEntry[]).shift();
      expect(queue.size).toBe(2);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/b" }));

      queue.clear();

      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
      expect(queue.dequeue()).toBeUndefined();
    });

    it("should reset the dedup set", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" }));
      queue.clear();

      // Should be able to re-add the same URL
      expect(
        queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a" })),
      ).toBe("added");
    });
  });

  describe("depth and source tracking", () => {
    it("should preserve depth from the entry", () => {
      const queue = new UrlQueue();
      queue.enqueue(makeEntry({ normalizedUrl: "https://example.com/a", depth: 3 }));

      expect(queue.dequeue()!.depth).toBe(3);
    });

    it("should preserve source from the entry", () => {
      const queue = new UrlQueue();
      queue.enqueue(
        makeEntry({
          normalizedUrl: "https://example.com/a",
          source: DiscoverySource.CANONICAL,
        }),
      );

      expect(queue.dequeue()!.source).toBe(DiscoverySource.CANONICAL);
    });

    it("should preserve parentUrl from the entry", () => {
      const queue = new UrlQueue();
      queue.enqueue(
        makeEntry({
          normalizedUrl: "https://example.com/child",
          parentUrl: "https://example.com/parent",
        }),
      );

      expect(queue.dequeue()!.parentUrl).toBe("https://example.com/parent");
    });
  });
});
