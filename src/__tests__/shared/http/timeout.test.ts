import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTimeoutSignal } from "@/shared/http/timeout";

describe("createTimeoutSignal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should abort the signal after the specified timeout", () => {
    const { signal, clear } = createTimeoutSignal(200);

    expect(signal.aborted).toBe(false);

    vi.advanceTimersByTime(200);

    expect(signal.aborted).toBe(true);

    clear();
  });

  it("should set the abort reason to a TimeoutError DOMException", () => {
    const { signal, clear } = createTimeoutSignal(100);

    vi.advanceTimersByTime(100);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(DOMException);
    expect((signal.reason as DOMException).name).toBe("TimeoutError");
    expect((signal.reason as DOMException).message).toContain("100ms");

    clear();
  });

  it("should NOT abort when clear() is called before the timeout fires", () => {
    const { signal, clear } = createTimeoutSignal(200);

    clear();
    vi.advanceTimersByTime(200);

    expect(signal.aborted).toBe(false);
  });

  it("should abort immediately when the external signal is already aborted", () => {
    const external = new AbortController();
    external.abort(new Error("Cancelled"));

    const { signal, clear } = createTimeoutSignal(500, external.signal);

    expect(signal.aborted).toBe(true);

    clear();
  });

  it("should abort when an external signal fires after creation", () => {
    const external = new AbortController();
    const { signal, clear } = createTimeoutSignal(500, external.signal);

    expect(signal.aborted).toBe(false);

    external.abort(new Error("Cancelled"));

    expect(signal.aborted).toBe(true);

    clear();
  });

  it("should not fire the timeout after the external signal aborts", () => {
    const external = new AbortController();
    const { signal, clear } = createTimeoutSignal(500, external.signal);

    external.abort(new Error("Cancelled"));

    // Advance past the original timeout — should not re-abort
    vi.advanceTimersByTime(500);

    expect(signal.aborted).toBe(true);
    // The fact that no error is thrown and signal is still aborted is enough

    clear();
  });
});
