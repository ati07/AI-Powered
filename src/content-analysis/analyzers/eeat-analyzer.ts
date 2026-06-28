/**
 * Content Analysis — E-E-A-T Analyzer.
 *
 * Evaluates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
 * signals on a page:
 *   - Author detection (meta, schema, bylines)
 *   - Contact information (email, phone, address)
 *   - Organization information (schema, about page)
 *   - Trust indicators (privacy, terms, policies, social)
 *
 * Pure analysis — never throws, never modifies state.
 */

import * as cheerio from "cheerio";
import type { ContentAnalysisContext, EEATResult } from "@/content-analysis/types";

/* ──────────────── Constants ──────────────── */

/** Email address regex. */
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Phone number regex (basic international patterns). */
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/;

/** US / Canadian postal code patterns for address detection. */
const ADDRESS_KEYWORDS = /\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|suite|ste|floor|fl|po\s*box|postal\s*code|zip)\b/i;

const TRUST_INDICATOR_KEYWORDS = [
  { keyword: /privacy/i, label: "privacy-policy" },
  { keyword: /terms?\s*(?:of\s+)?(?:service|use|conditions?)/i, label: "terms-of-service" },
  { keyword: /cookie/i, label: "cookie-policy" },
  { keyword: /about/i, label: "about-page" },
  { keyword: /contact/i, label: "contact-page" },
  { keyword: /testimonial/i, label: "testimonials" },
  { keyword: /review/i, label: "reviews" },
  { keyword: /secure/i, label: "secure-connection" },
  { keyword: /ssl/i, label: "ssl-certificate" },
  { keyword: /gdpr/i, label: "gdpr-compliance" },
  { keyword: /accessibility/i, label: "accessibility-statement" },
  { keyword: /sitemap/i, label: "sitemap" },
];

/* ──────────────── Analyzer ──────────────── */

export class EEATAnalyzer {
  /**
   * Analyze E-E-A-T signals on a page.
   *
   * @param context — Pre-computed analysis context.
   * @returns A frozen EEATResult.
   */
  analyze(context: ContentAnalysisContext): EEATResult {
    try {
      const { html, seoResult } = context;

      const $ = cheerio.load(html);

      // Author detection
      const authorMeta = this.detectAuthorMeta($);
      const authorSchema = this.detectAuthorSchema(seoResult);
      const authorName = authorMeta ?? authorSchema ?? null;
      const hasAuthor = authorName !== null || this.detectAuthorByline($);

      // Contact information
      const contactTypes = this.detectContactInfo($);

      // Organization information
      const orgName = this.detectOrganizationName($, seoResult);
      const hasOrganizationSchema = this.hasOrganizationSchema(seoResult);

      // Trust indicators
      const trustIndicators = this.detectTrustIndicators($);

      // Count unique E-E-A-T signals
      let eeatSignalCount = 0;
      if (hasAuthor) eeatSignalCount++;
      if (contactTypes.length > 0) eeatSignalCount++;
      if (orgName !== null || hasOrganizationSchema) eeatSignalCount++;
      if (trustIndicators.length > 0) eeatSignalCount++;

      return Object.freeze({
        hasAuthor,
        authorName,
        hasAuthorMeta: authorMeta !== null,
        hasAuthorSchema: authorSchema !== null,
        hasContactInfo: contactTypes.length > 0,
        contactTypes: Object.freeze(contactTypes),
        hasOrganizationInfo: orgName !== null || hasOrganizationSchema,
        organizationName: orgName,
        hasOrganizationSchema,
        trustIndicators: Object.freeze(trustIndicators),
        trustIndicatorCount: trustIndicators.length,
        eeatSignalCount,
      });
    } catch {
      return Object.freeze({
        hasAuthor: false,
        authorName: null,
        hasAuthorMeta: false,
        hasAuthorSchema: false,
        hasContactInfo: false,
        contactTypes: [],
        hasOrganizationInfo: false,
        organizationName: null,
        hasOrganizationSchema: false,
        trustIndicators: [],
        trustIndicatorCount: 0,
        eeatSignalCount: 0,
      });
    }
  }

  /* ──────────────── Author Detection ──────────────── */

  /**
   * Check <meta name="author"> and <link rel="author">.
   */
  private detectAuthorMeta($: cheerio.CheerioAPI): string | null {
    // <meta name="author" content="...">
    const metaAuthor = $('meta[name="author"]').first().attr("content");
    if (metaAuthor && metaAuthor.trim().length > 0) return metaAuthor.trim();

    // <link rel="author" href="...">
    const linkAuthor = $('link[rel="author"]').first().attr("href");
    if (linkAuthor && linkAuthor.trim().length > 0) return linkAuthor.trim();

    return null;
  }

  /**
   * Check structured data for schema.org/Person author references.
   */
  private detectAuthorSchema(
    seoResult: ContentAnalysisContext["seoResult"],
  ): string | null {
    for (const sd of seoResult.structuredData) {
      if (!sd.json) continue;

      const items = Array.isArray(sd.json) ? sd.json : [sd.json];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const obj = item as Record<string, unknown>;
        const type = this.extractType(obj);

        if (type?.includes("Person")) {
          const name = this.extractName(obj);
          if (name) return name;
        }

        // Check author property on Article types
        if (type?.includes("Article") || type?.includes("BlogPosting")) {
          const author = obj["author"];
          if (author && typeof author === "object") {
            const authorObj = author as Record<string, unknown>;
            const authorName = this.extractName(authorObj);
            if (authorName) return authorName;
          }
        }
      }
    }
    return null;
  }

  /**
   * Detect "By AuthorName" pattern in the page text.
   */
  private detectAuthorByline($: cheerio.CheerioAPI): boolean {
    // Check common byline patterns
    const bylineSelectors = [
      ".author",
      ".byline",
      '[itemprop="author"]',
      '[rel="author"]',
    ];

    for (const sel of bylineSelectors) {
      const el = $(sel).first();
      const text = el.text().trim();
      if (text.length > 0) return true;
    }

    return false;
  }

  /* ──────────────── Contact Detection ──────────────── */

  /**
   * Detect contact information (email, phone, address) in the page.
   */
  private detectContactInfo($: cheerio.CheerioAPI): string[] {
    const types: string[] = [];

    try {
      const bodyText = $("body").text();

      if (EMAIL_RE.test(bodyText)) types.push("email");
      if (PHONE_RE.test(bodyText)) types.push("phone");

      // Check for address patterns
      if (ADDRESS_KEYWORDS.test(bodyText)) types.push("address");

      // Check for contact page link
      const hasContactLink = $('a[href*="contact"]').length > 0;
      if (hasContactLink) types.push("contact-page");
    } catch {
      // ignore
    }

    return types;
  }

  /* ──────────────── Organization Detection ──────────────── */

  /**
   * Detect organization name from meta tags or schema.
   */
  private detectOrganizationName(
    $: cheerio.CheerioAPI,
    seoResult: ContentAnalysisContext["seoResult"],
  ): string | null {
    // Check schema.org/Organization in structured data
    for (const sd of seoResult.structuredData) {
      if (!sd.json) continue;

      const items = Array.isArray(sd.json) ? sd.json : [sd.json];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const obj = item as Record<string, unknown>;
        const type = this.extractType(obj);

        if (type?.includes("Organization")) {
          const name = this.extractName(obj);
          if (name) return name;
        }

        // Check publisher / provider on Article types
        if (type?.includes("Article") || type?.includes("BlogPosting")) {
          const publisher = obj["publisher"];
          if (publisher && typeof publisher === "object") {
            const pubObj = publisher as Record<string, unknown>;
            const pubName = this.extractName(pubObj);
            if (pubName) return pubName;
          }
        }
      }
    }

    // Check Open Graph site_name
    const ogSiteName = seoResult.openGraph["og:site_name"];
    if (ogSiteName && ogSiteName.trim().length > 0) return ogSiteName.trim();

    return null;
  }

  /**
   * Check if the page has an Organization schema.
   */
  private hasOrganizationSchema(
    seoResult: ContentAnalysisContext["seoResult"],
  ): boolean {
    for (const sd of seoResult.structuredData) {
      if (!sd.json) continue;

      const items = Array.isArray(sd.json) ? sd.json : [sd.json];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;

        const obj = item as Record<string, unknown>;
        const type = this.extractType(obj);
        if (type?.includes("Organization")) return true;
      }
    }
    return false;
  }

  /* ──────────────── Trust Indicators ──────────────── */

  /**
   * Detect trust indicators from link text and content.
   */
  private detectTrustIndicators($: cheerio.CheerioAPI): string[] {
    const found: string[] = [];

    try {
      // Check link text for trust indicators
      $("a").each((_i: number, el: unknown) => {
        const text = $(el as any).text().trim();
        const href = $(el as any).attr("href") ?? "";

        const combined = `${text} ${href}`;

        for (const indicator of TRUST_INDICATOR_KEYWORDS) {
          if (indicator.keyword.test(combined)) {
            if (!found.includes(indicator.label)) {
              found.push(indicator.label);
            }
          }
        }
      });

      // Also check body text for additional matches
      const bodyText = $("body").text();
      for (const indicator of TRUST_INDICATOR_KEYWORDS) {
        if (indicator.keyword.test(bodyText)) {
          if (!found.includes(indicator.label)) {
            found.push(indicator.label);
          }
        }
      }
    } catch {
      // ignore
    }

    return found;
  }

  /* ──────────────── Helpers ──────────────── */

  private extractType(obj: Record<string, unknown>): string | null {
    const type = obj["@type"];
    if (!type) return null;
    if (Array.isArray(type)) return (type[0] as string) ?? null;
    return type as string;
  }

  private extractName(obj: Record<string, unknown>): string | null {
    const name = obj["name"];
    if (name && typeof name === "string" && name.trim().length > 0) {
      return name.trim();
    }
    return null;
  }
}
