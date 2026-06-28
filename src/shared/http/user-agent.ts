/**
 * Shared HTTP client — configurable crawler User-Agent.
 *
 * The value can be overridden at runtime via the `CRAWLER_USER_AGENT`
 * environment variable. When unset, a sensible default is used.
 */

const DEFAULT_USER_AGENT = "AIVisibilityBot/1.0 (+https://your-domain.com)";

/**
 * Return the User-Agent string for the crawler's outbound requests.
 *
 * Order of precedence:
 * 1. `CRAWLER_USER_AGENT` environment variable
 * 2. Hard-coded default
 */
export function getUserAgent(): string {
  return process.env.CRAWLER_USER_AGENT ?? DEFAULT_USER_AGENT;
}
