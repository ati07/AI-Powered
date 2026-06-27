import { describe, it, expect } from "vitest";
import { OrganizationEntity, type CreateOrganizationEntityInput } from "@/domain/entities/organization.entity";

function makeOrg(overrides: Partial<CreateOrganizationEntityInput> = {}): OrganizationEntity {
  const defaults: CreateOrganizationEntityInput = {
    id: "org-1",
    name: "My Agency",
    slug: "my-agency-a3f8",
    logoUrl: null,
    description: null,
    timezone: "UTC",
    ...overrides,
  };
  return new OrganizationEntity(defaults);
}

describe("OrganizationEntity", () => {
  describe("constructor", () => {
    it("should create with required fields", () => {
      const org = makeOrg();
      expect(org.id).toBe("org-1");
      expect(org.name).toBe("My Agency");
      expect(org.slug).toBe("my-agency-a3f8");
    });

    it("should default logoUrl and description to null", () => {
      const org = makeOrg({ logoUrl: undefined, description: undefined });
      expect(org.logoUrl).toBeNull();
      expect(org.description).toBeNull();
    });

    it("should default timezone to UTC", () => {
      const org = makeOrg({ timezone: undefined });
      expect(org.timezone).toBe("UTC");
    });

    it("should set createdAt and updatedAt when provided", () => {
      const now = new Date("2026-01-01");
      const org = makeOrg({ createdAt: now, updatedAt: now });
      expect(org.createdAt).toEqual(now);
      expect(org.updatedAt).toEqual(now);
    });
  });

  describe("rename", () => {
    it("should change the name", () => {
      const org = makeOrg();
      const renamed = org.rename("New Agency Name");
      expect(renamed.name).toBe("New Agency Name");
    });

    it("should keep the slug unchanged", () => {
      const org = makeOrg();
      const renamed = org.rename("New Agency Name");
      expect(renamed.slug).toBe("my-agency-a3f8");
    });

    it("should preserve other fields", () => {
      const org = makeOrg({ description: "Original description" });
      const renamed = org.rename("New Name");
      expect(renamed.description).toBe("Original description");
      expect(renamed.timezone).toBe("UTC");
    });

    it("should update the updatedAt timestamp", () => {
      const org = makeOrg();
      const renamed = org.rename("New Name");
      expect(renamed.updatedAt.getTime()).toBeGreaterThanOrEqual(org.updatedAt.getTime());
    });

    it("should not mutate the original entity (immutability)", () => {
      const org = makeOrg({ name: "Original" });
      org.rename("New Name");
      expect(org.name).toBe("Original");
    });
  });

  describe("updateProfile", () => {
    it("should update description", () => {
      const org = makeOrg();
      const updated = org.updateProfile({ description: "New description" });
      expect(updated.description).toBe("New description");
    });

    it("should update logoUrl", () => {
      const org = makeOrg();
      const updated = org.updateProfile({ logoUrl: "https://example.com/logo.png" });
      expect(updated.logoUrl).toBe("https://example.com/logo.png");
    });

    it("should update timezone", () => {
      const org = makeOrg();
      const updated = org.updateProfile({ timezone: "America/New_York" });
      expect(updated.timezone).toBe("America/New_York");
    });

    it("should not change fields that are not provided", () => {
      const org = makeOrg({ description: "Original" });
      const updated = org.updateProfile({ timezone: "Europe/London" });
      expect(updated.description).toBe("Original");
    });

    it("should allow clearing optional fields with null", () => {
      const org = makeOrg({ description: "Something", logoUrl: "https://example.com/logo.png" });
      const updated = org.updateProfile({ description: null, logoUrl: null });
      expect(updated.description).toBeNull();
      expect(updated.logoUrl).toBeNull();
    });
  });
});
