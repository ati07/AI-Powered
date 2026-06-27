const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHORT_SUFFIX_LENGTH = 4;

/**
 * Slug value object.
 *
 * Encapsulates slug validation and generation logic.
 * Slugs are auto-generated from organization names and appended with
 * a short random suffix to guarantee uniqueness without a DB round-trip.
 */
export class Slug {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /* ──────────────── Factory methods ──────────────── */

  /**
   * Create a Slug from a validated slug string.
   * Throws if the format is invalid.
   */
  static create(value: string): Slug {
    const normalized = value.toLowerCase();

    if (normalized.length < 1) {
      throw new Error("Slug must be at least 1 character long.");
    }

    if (normalized.length > 200) {
      throw new Error("Slug must be at most 200 characters long.");
    }

    if (!SLUG_PATTERN.test(normalized)) {
      throw new Error(
        "Slug must contain only lowercase letters, numbers, and hyphens. " +
          "Hyphens cannot be at the start or end, and cannot be consecutive.",
      );
    }

    return new Slug(normalized);
  }

  /**
   * Generate a slug from a name string.
   * Lowercases, replaces non-alphanumeric sequences with hyphens,
   * strips leading/trailing hyphens, and appends a short random suffix.
   *
   * @example
   * Slug.generate("My Agency")       // → "my-agency-a3f8"
   * Slug.generate("Hello World!!!")  // → "hello-world-b1c2"
   */
  static generate(name: string): Slug {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 80);

    const suffix = randomHex(SHORT_SUFFIX_LENGTH);

    if (base.length === 0) {
      // Name was entirely non-alphanumeric
      return new Slug(`org-${suffix}`);
    }

    return new Slug(`${base}-${suffix}`);
  }

  /* ──────────────── Accessors ──────────────── */

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}

/**
 * Generate a cryptographically-safe hex string of `length` characters.
 * Falls back to Math.random if crypto is unavailable (edge environments).
 */
function randomHex(length: number): string {
  try {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, length);
  } catch {
    // Fallback for environments without crypto.getRandomValues
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }
}
