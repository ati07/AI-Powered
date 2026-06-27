import { describe, it, expect } from "vitest";
import {
  CreateWebsiteInputSchema,
  UpdateWebsiteInputSchema,
  DeleteWebsiteInputSchema,
  GetWebsitesInputSchema,
} from "@/application/website/website.schema";

const validUuid = "00000000-0000-0000-0000-000000000001";

describe("CreateWebsiteInputSchema", () => {
  it("should accept valid input", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "My Website",
      domain: "https://example.com",
      userId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "",
      domain: "https://example.com",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("should reject names under 3 characters", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "AB",
      domain: "https://example.com",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("should reject names over 100 characters", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "A".repeat(101),
      domain: "https://example.com",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("should trim the name", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "  My Website  ",
      domain: "https://example.com",
      userId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Website");
    }
  });

  it("should reject empty domain", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "My Website",
      domain: "",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-UUID organizationId", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: "not-a-uuid",
      name: "My Website",
      domain: "https://example.com",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-UUID userId", () => {
    const result = CreateWebsiteInputSchema.safeParse({
      organizationId: validUuid,
      name: "My Website",
      domain: "https://example.com",
      userId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateWebsiteInputSchema", () => {
  it("should accept valid input with name only", () => {
    const result = UpdateWebsiteInputSchema.safeParse({
      id: validUuid,
      userId: validUuid,
      name: "Renamed Website",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid input with domain only", () => {
    const result = UpdateWebsiteInputSchema.safeParse({
      id: validUuid,
      userId: validUuid,
      domain: "https://other.com",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid input with both fields", () => {
    const result = UpdateWebsiteInputSchema.safeParse({
      id: validUuid,
      userId: validUuid,
      name: "Renamed",
      domain: "https://other.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID id", () => {
    const result = UpdateWebsiteInputSchema.safeParse({
      id: "not-a-uuid",
      userId: validUuid,
      name: "Renamed",
    });
    expect(result.success).toBe(false);
  });
});

describe("DeleteWebsiteInputSchema", () => {
  it("should accept valid input", () => {
    const result = DeleteWebsiteInputSchema.safeParse({
      id: validUuid,
      userId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID id", () => {
    const result = DeleteWebsiteInputSchema.safeParse({
      id: "not-a-uuid",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });
});

describe("GetWebsitesInputSchema", () => {
  it("should accept valid input", () => {
    const result = GetWebsitesInputSchema.safeParse({
      organizationId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID organizationId", () => {
    const result = GetWebsitesInputSchema.safeParse({
      organizationId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
