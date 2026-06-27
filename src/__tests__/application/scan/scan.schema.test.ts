import { describe, it, expect } from "vitest";
import {
  CreateScanInputSchema,
  GetScansInputSchema,
  GetScanInputSchema,
} from "@/application/scan/scan.schema";

const validUuid = "00000000-0000-0000-0000-000000000001";

describe("CreateScanInputSchema", () => {
  it("should accept valid input", () => {
    const result = CreateScanInputSchema.safeParse({
      websiteId: validUuid,
      userId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID websiteId", () => {
    const result = CreateScanInputSchema.safeParse({
      websiteId: "not-a-uuid",
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-UUID userId", () => {
    const result = CreateScanInputSchema.safeParse({
      websiteId: validUuid,
      userId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("GetScansInputSchema", () => {
  it("should accept valid input", () => {
    const result = GetScansInputSchema.safeParse({
      websiteId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID websiteId", () => {
    const result = GetScansInputSchema.safeParse({
      websiteId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("GetScanInputSchema", () => {
  it("should accept valid input", () => {
    const result = GetScanInputSchema.safeParse({
      id: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID id", () => {
    const result = GetScanInputSchema.safeParse({
      id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
