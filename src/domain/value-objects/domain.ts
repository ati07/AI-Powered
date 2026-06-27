import { z } from "zod";

/**
 * Domain value object.
 *
 * Handles domain normalization and validation in one place.
 * All normalization logic lives here — never duplicated elsewhere.
 *
 * Normalization rules:
 * 1. Trim whitespace
 * 2. Remove protocol (http://, https://)
 * 3. Remove "www." prefix
 * 4. Convert to lowercase
 * 5. Remove trailing slash
 */
export class Domain {
  private readonly value: string;
  private readonly normalizedValue: string;

  private constructor(value: string, normalizedValue: string) {
    this.value = value;
    this.normalizedValue = normalizedValue;
  }

  /**
   * Create a Domain from a raw user input string.
   * Validates and normalizes the domain in one step.
   */
  static create(raw: string): Domain {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new Error("Domain is required");
    }

    const normalized = Domain.normalize(trimmed);

    // After normalization, validate the result is a reasonable domain
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
    if (!domainRegex.test(normalized)) {
      throw new Error(
        `Invalid domain: "${trimmed}" (normalized: "${normalized}")`,
      );
    }

    return new Domain(trimmed, normalized);
  }

  /**
   * Create a Domain without validation (e.g., when loading from DB).
   * The value passed in must already be normalized.
   */
  static unsafeCreate(normalized: string): Domain {
    return new Domain(normalized, normalized);
  }

  /**
   * Normalize a domain string by:
   * - Trimming whitespace
   * - Removing protocol (http://, https://)
   * - Removing "www." prefix
   * - Converting to lowercase
   * - Removing trailing slash
   */
  static normalize(raw: string): string {
    return raw
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .toLowerCase()
      .replace(/\/+$/, "")
      .trim();
  }

  /** Returns the normalized domain value. */
  getValue(): string {
    return this.normalizedValue;
  }

  /** Returns the original domain as entered by the user. */
  getOriginalValue(): string {
    return this.value;
  }

  equals(other: Domain): boolean {
    return this.normalizedValue === other.normalizedValue;
  }

  toString(): string {
    return this.normalizedValue;
  }
}

export const DomainSchema = z
  .string()
  .min(1, "Domain is required")
  .refine(
    (val) => {
      try {
        Domain.create(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid domain format" },
  );
