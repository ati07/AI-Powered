/**
 * Application — Zod error formatter.
 *
 * Converts a ZodError into the `Record<string, string[]>` format expected
 * by the {@link ValidationError} error class.
 */

import { type ZodError } from "zod";

/**
 * Convert a ZodError into a field-level error map.
 *
 * Each key is the dot-joined path to the invalid field.
 * Each value is an array of human-readable error messages for that field.
 */
export function fromZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!details[key]) {
      details[key] = [];
    }
    details[key]!.push(issue.message);
  }

  return details;
}
