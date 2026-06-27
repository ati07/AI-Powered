import { describe, it, expect } from "vitest";
import {
  CreateOrganizationInputSchema,
  UpdateOrganizationInputSchema,
  DeleteOrganizationInputSchema,
} from "@/application/organization/organization.schema";

describe("CreateOrganizationInputSchema", () => {
  it("should accept valid input", () => {
    const result = CreateOrganizationInputSchema.safeParse({
      name: "My Agency",
      ownerId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = CreateOrganizationInputSchema.safeParse({
      name: "",
      ownerId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("should reject names under 3 characters", () => {
    const result = CreateOrganizationInputSchema.safeParse({
      name: "AB",
      ownerId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("should reject names over 100 characters", () => {
    const result = CreateOrganizationInputSchema.safeParse({
      name: "A".repeat(101),
      ownerId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-UUID ownerId", () => {
    const result = CreateOrganizationInputSchema.safeParse({
      name: "My Agency",
      ownerId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should trim the name", () => {
    const result = CreateOrganizationInputSchema.safeParse({
      name: "  My Agency  ",
      ownerId: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Agency");
    }
  });
});

describe("UpdateOrganizationInputSchema", () => {
  it("should accept valid input", () => {
    const result = UpdateOrganizationInputSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Renamed Org",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID id", () => {
    const result = UpdateOrganizationInputSchema.safeParse({
      id: "not-a-uuid",
      name: "Renamed Org",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    expect(result.success).toBe(false);
  });
});

describe("DeleteOrganizationInputSchema", () => {
  it("should accept valid input", () => {
    const result = DeleteOrganizationInputSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID id", () => {
    const result = DeleteOrganizationInputSchema.safeParse({
      id: "not-a-uuid",
      userId: "00000000-0000-0000-0000-000000000002",
    });
    expect(result.success).toBe(false);
  });
});
