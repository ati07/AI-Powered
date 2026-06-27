import { describe, it, expect } from "vitest";
import {
  WebsiteEntity,
  type CreateWebsiteEntityInput,
} from "@/domain/entities/website.entity";
import { Domain } from "@/domain/value-objects/domain";

function makeWebsite(
  overrides: Partial<CreateWebsiteEntityInput> = {},
): WebsiteEntity {
  const domain = Domain.create("https://example.com");
  const defaults: CreateWebsiteEntityInput = {
    id: "website-1",
    organizationId: "org-1",
    name: "My Website",
    domain,
    normalizedDomain: domain.getValue(),
    faviconUrl: null,
    verified: false,
    lastScanAt: null,
    ...overrides,
  };
  return new WebsiteEntity(defaults);
}

describe("WebsiteEntity", () => {
  describe("constructor", () => {
    it("should create with required fields", () => {
      const website = makeWebsite();
      expect(website.id).toBe("website-1");
      expect(website.name).toBe("My Website");
      expect(website.normalizedDomain).toBe("example.com");
      expect(website.organizationId).toBe("org-1");
    });

    it("should default faviconUrl to null (when not provided)", () => {
      const website = makeWebsite();
      expect(website.faviconUrl).toBeNull();
    });

    it("should default verified to false (when not provided)", () => {
      const website = makeWebsite();
      expect(website.verified).toBe(false);
    });

    it("should default lastScanAt to null (when not provided)", () => {
      const website = makeWebsite();
      expect(website.lastScanAt).toBeNull();
    });

    it("should set createdAt and updatedAt when provided", () => {
      const now = new Date("2026-01-01");
      const website = makeWebsite({ createdAt: now, updatedAt: now });
      expect(website.createdAt).toEqual(now);
      expect(website.updatedAt).toEqual(now);
    });
  });

  describe("rename", () => {
    it("should change the name", () => {
      const website = makeWebsite();
      const renamed = website.rename("New Name");
      expect(renamed.name).toBe("New Name");
    });

    it("should keep the domain unchanged", () => {
      const website = makeWebsite();
      const renamed = website.rename("New Name");
      expect(renamed.normalizedDomain).toBe("example.com");
    });

    it("should preserve other fields", () => {
      const website = makeWebsite({ faviconUrl: "https://example.com/favicon.ico" });
      const renamed = website.rename("New Name");
      expect(renamed.faviconUrl).toBe("https://example.com/favicon.ico");
      expect(renamed.organizationId).toBe("org-1");
    });

    it("should update the updatedAt timestamp", () => {
      const website = makeWebsite();
      const renamed = website.rename("New Name");
      expect(renamed.updatedAt.getTime()).toBeGreaterThanOrEqual(
        website.updatedAt.getTime(),
      );
    });

    it("should not mutate the original entity (immutability)", () => {
      const website = makeWebsite({ name: "Original" });
      website.rename("New Name");
      expect(website.name).toBe("Original");
    });
  });

  describe("changeDomain", () => {
    it("should change the domain", () => {
      const website = makeWebsite();
      const newDomain = Domain.create("https://other.com");
      const updated = website.changeDomain(newDomain);
      expect(updated.normalizedDomain).toBe("other.com");
    });

    it("should preserve the name", () => {
      const website = makeWebsite({ name: "My Site" });
      const newDomain = Domain.create("https://other.com");
      const updated = website.changeDomain(newDomain);
      expect(updated.name).toBe("My Site");
    });
  });

  describe("updateProfile", () => {
    it("should update the name", () => {
      const website = makeWebsite();
      const updated = website.updateProfile({ name: "Updated Name" });
      expect(updated.name).toBe("Updated Name");
    });

    it("should update the faviconUrl", () => {
      const website = makeWebsite();
      const updated = website.updateProfile({
        faviconUrl: "https://example.com/favicon.ico",
      });
      expect(updated.faviconUrl).toBe("https://example.com/favicon.ico");
    });

    it("should not change fields that are not provided", () => {
      const website = makeWebsite({ faviconUrl: "https://example.com/favicon.ico" });
      const updated = website.updateProfile({ faviconUrl: null });
      expect(updated.faviconUrl).toBeNull();
    });
  });

  describe("verify", () => {
    it("should set verified to true", () => {
      const website = makeWebsite();
      const verified = website.verify();
      expect(verified.verified).toBe(true);
    });
  });

  describe("recordScan", () => {
    it("should set lastScanAt", () => {
      const website = makeWebsite();
      const scanned = website.recordScan();
      expect(scanned.lastScanAt).not.toBeNull();
      expect(scanned.lastScanAt!.getTime()).toBeGreaterThanOrEqual(
        website.updatedAt.getTime(),
      );
    });
  });
});
