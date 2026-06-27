import { describe, it, expect } from "vitest";
import { Slug } from "@/domain/value-objects/slug";

describe("Slug", () => {
  describe("generate", () => {
    it("should convert a simple name to a slug with suffix", () => {
      const slug = Slug.generate("My Agency");
      const value = slug.getValue();

      expect(value).toMatch(/^my-agency-[a-f0-9]+$/);
    });

    it("should lowercase the input", () => {
      const slug = Slug.generate("ACME Corp");
      expect(slug.getValue()).toMatch(/^acme-corp-/);
    });

    it("should replace multiple spaces with a single hyphen", () => {
      const slug = Slug.generate("Hello   World");
      expect(slug.getValue()).toMatch(/^hello-world-/);
    });

    it("should remove leading and trailing spaces after conversion", () => {
      const slug = Slug.generate("  Spaces  ");
      expect(slug.getValue()).toMatch(/^spaces-/);
    });

    it("should handle special characters by replacing them", () => {
      const slug = Slug.generate("Hello!!! World???");
      expect(slug.getValue()).toMatch(/^hello-world-/);
    });

    it("should handle names with only special characters", () => {
      const slug = Slug.generate("!!! ???");
      const value = slug.getValue();
      expect(value).toMatch(/^org-[a-f0-9]+$/);
    });

    it("should produce unique slugs on successive calls", () => {
      const slug1 = Slug.generate("My Agency");
      const slug2 = Slug.generate("My Agency");

      expect(slug1.getValue()).not.toBe(slug2.getValue());
    });

    it("should produce slugs shorter than 200 characters", () => {
      const longName = "A".repeat(500);
      const slug = Slug.generate(longName);
      expect(slug.getValue().length).toBeLessThan(200);
    });
  });

  describe("create", () => {
    it("should accept a valid slug", () => {
      const slug = Slug.create("my-agency-a3f8");
      expect(slug.getValue()).toBe("my-agency-a3f8");
    });

    it("should accept a slug with numbers", () => {
      const slug = Slug.create("org-1234-abc");
      expect(slug.getValue()).toBe("org-1234-abc");
    });

    it("should throw for an empty string", () => {
      expect(() => Slug.create("")).toThrow("at least 1 character");
    });

    it("should normalize uppercase characters to lowercase", () => {
      const slug = Slug.create("My-Agency");
      expect(slug.getValue()).toBe("my-agency");
    });

    it("should throw for leading hyphens", () => {
      expect(() => Slug.create("-my-agency")).toThrow();
    });

    it("should throw for trailing hyphens", () => {
      expect(() => Slug.create("my-agency-")).toThrow();
    });

    it("should throw for consecutive hyphens", () => {
      expect(() => Slug.create("my--agency")).toThrow();
    });

    it("should throw for slugs over 200 characters", () => {
      const longSlug = "a".repeat(201);
      expect(() => Slug.create(longSlug)).toThrow("200 characters");
    });

    it("should throw for invalid characters like spaces", () => {
      expect(() => Slug.create("my agency")).toThrow();
    });
  });

  describe("equals", () => {
    it("should return true for identical slugs", () => {
      const a = Slug.create("hello-world");
      const b = Slug.create("hello-world");
      expect(a.equals(b)).toBe(true);
    });

    it("should return false for different slugs", () => {
      const a = Slug.create("hello-world");
      const b = Slug.create("goodbye-world");
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return the slug value", () => {
      const slug = Slug.create("test-org");
      expect(slug.toString()).toBe("test-org");
    });
  });
});
