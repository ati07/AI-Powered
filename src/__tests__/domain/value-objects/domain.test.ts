import { describe, it, expect } from "vitest";
import { Domain } from "@/domain/value-objects/domain";

describe("Domain", () => {
  describe("normalize", () => {
    it("should remove https:// prefix", () => {
      expect(Domain.normalize("https://example.com")).toBe("example.com");
    });

    it("should remove http:// prefix", () => {
      expect(Domain.normalize("http://example.com")).toBe("example.com");
    });

    it("should remove www. prefix", () => {
      expect(Domain.normalize("www.example.com")).toBe("example.com");
    });

    it("should remove https://www. prefix", () => {
      expect(Domain.normalize("https://www.example.com")).toBe("example.com");
    });

    it("should remove http://www. prefix", () => {
      expect(Domain.normalize("http://www.example.com")).toBe("example.com");
    });

    it("should convert to lowercase", () => {
      expect(Domain.normalize("HTTPS://WWW.OPENAI.COM")).toBe("openai.com");
    });

    it("should remove trailing slash", () => {
      expect(Domain.normalize("https://example.com/")).toBe("example.com");
    });

    it("should trim whitespace", () => {
      expect(Domain.normalize("  https://example.com  ")).toBe("example.com");
    });

    it("should handle complex domain with subdomain", () => {
      expect(Domain.normalize("https://blog.example.com")).toBe(
        "blog.example.com",
      );
    });

    it("should handle domain with path (should not strip path)", () => {
      // According to the spec, only trailing slashes are removed
      expect(Domain.normalize("https://www.example.com/path")).toBe(
        "example.com/path",
      );
    });

    it("should handle the full example from the spec: https://WWW.OpenAI.com/", () => {
      expect(Domain.normalize("https://WWW.OpenAI.com/")).toBe("openai.com");
    });

    it("should handle domain with port", () => {
      expect(Domain.normalize("https://localhost:3000")).toBe("localhost:3000");
    });
  });

  describe("create", () => {
    it("should create a Domain from a raw URL", () => {
      const domain = Domain.create("https://example.com");
      expect(domain.getValue()).toBe("example.com");
    });

    it("should normalize the domain on creation", () => {
      const domain = Domain.create("https://WWW.OpenAI.com/");
      expect(domain.getValue()).toBe("openai.com");
    });

    it("should throw for an empty string", () => {
      expect(() => Domain.create("")).toThrow("required");
    });

    it("should throw for a whitespace-only string", () => {
      expect(() => Domain.create("   ")).toThrow("required");
    });

    it("should throw for an invalid domain (no TLD)", () => {
      expect(() => Domain.create("not-a-domain")).toThrow("Invalid domain");
    });

    it("should throw for an IP address (not in spec)", () => {
      // IP addresses don't match the domain regex
      expect(() => Domain.create("https://192.168.1.1")).toThrow(
        "Invalid domain",
      );
    });

    it("should preserve the original input", () => {
      const domain = Domain.create("  https://EXAMPLE.com/  ");
      expect(domain.getOriginalValue()).toBe("https://EXAMPLE.com/");
      expect(domain.getValue()).toBe("example.com");
    });
  });

  describe("unsafeCreate", () => {
    it("should create a Domain without validation", () => {
      const domain = Domain.unsafeCreate("example.com");
      expect(domain.getValue()).toBe("example.com");
    });

    it("should not normalize the value", () => {
      const domain = Domain.unsafeCreate("EXAMPLE.com");
      expect(domain.getValue()).toBe("EXAMPLE.com");
    });
  });

  describe("equals", () => {
    it("should return true for domains with the same normalized value", () => {
      const a = Domain.create("https://example.com");
      const b = Domain.create("http://www.example.com");
      expect(a.equals(b)).toBe(true);
    });

    it("should return false for different domains", () => {
      const a = Domain.create("https://example.com");
      const b = Domain.create("https://other.com");
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return the normalized value", () => {
      const domain = Domain.create("https://www.example.com");
      expect(domain.toString()).toBe("example.com");
    });
  });
});
