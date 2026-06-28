/**
 * Shared HTTP — URL utilities.
 *
 * Normalisation and validation helpers reused across crawler
 * modules (sitemaps, HTML pages, …) so every component applies
 * the same rules.
 */

/**
 * Normalise a URL and validate its scheme.
 *
 * Accepts only `http:` and `https:` — returns `null` for
 * everything else (mailto, ftp, javascript, …) as well as
 * for malformed input.
 *
 * Normalisation performed by the `URL` constructor:
 *   - lowercases the hostname
 *   - removes default ports (:80 / :443)
 *   - percent-encodes invalid characters
 */
export function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
