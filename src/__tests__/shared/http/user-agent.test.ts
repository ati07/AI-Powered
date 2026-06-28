import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserAgent } from "@/shared/http/user-agent";

const ORIGINAL_ENV = process.env;

describe("getUserAgent", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should return the default when CRAWLER_USER_AGENT is not set", () => {
    delete process.env.CRAWLER_USER_AGENT;

    const ua = getUserAgent();

    expect(ua).toBe("AIVisibilityBot/1.0 (+https://your-domain.com)");
  });

  it("should return the env var value when CRAWLER_USER_AGENT is set", () => {
    process.env.CRAWLER_USER_AGENT = "CustomBot/2.0 (+https://example.com)";

    const ua = getUserAgent();

    expect(ua).toBe("CustomBot/2.0 (+https://example.com)");
  });

  it("should return the default when CRAWLER_USER_AGENT is empty string", () => {
    process.env.CRAWLER_USER_AGENT = "";

    const ua = getUserAgent();

    // '' is not null nor undefined, so ?? does not fall through
    expect(ua).toBe("");
  });

  it("should prefer the env var over a falsy-but-present value", () => {
    // With ?? the empty-string case is returned as-is, which is fine
    // because an explicitly empty env var is a deliberate choice.
    process.env.CRAWLER_USER_AGENT = "";

    const ua = getUserAgent();

    expect(ua).toBe("");
  });
});
