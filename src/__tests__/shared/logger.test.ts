import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConsoleLogger } from "@/shared/logger";

describe("ConsoleLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("info", () => {
    it("should call console.log with prefixed message", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = new ConsoleLogger("[Test]");

      logger.info("hello");

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0]![0]).toContain("[Test]");
      expect(spy.mock.calls[0]![0]).toContain("hello");
    });

    it("should include extra arguments", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = new ConsoleLogger("[Test]");

      logger.info("count:", 42);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0]![0]).toContain("42");
    });
  });

  describe("warn", () => {
    it("should call console.warn with prefixed message", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const logger = new ConsoleLogger("[Test]");

      logger.warn("warning");

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0]![0]).toContain("[Test]");
      expect(spy.mock.calls[0]![0]).toContain("warning");
    });
  });

  describe("error", () => {
    it("should call console.error with prefixed message", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = new ConsoleLogger("[Test]");

      logger.error("error!");

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0]![0]).toContain("[Test]");
      expect(spy.mock.calls[0]![0]).toContain("error!");
    });
  });

  describe("formatting", () => {
    it("should stringify objects in extra args", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = new ConsoleLogger("[Test]");

      logger.info("data", { key: "value" });

      expect(spy.mock.calls[0]![0]).toContain('{"key":"value"}');
    });
  });
});
