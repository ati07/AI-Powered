/**
 * Crawler — HTML Parser.
 *
 * Loads raw HTML into a Cheerio DOM that the {@link SeoExtractor}
 * can traverse.  This is deliberately kept separate from extraction
 * so the DOM can be inspected or tested independently.
 *
 * Usage:
 *   const parser = new HtmlParser(ctx);
 *   const $ = parser.parse(rawHtml);
 *   // pass `$` to extractor.extract($)
 */

import { type CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import { type ILogger } from "@/shared/logger";
import { type CrawlerContext } from "@/crawler/core/crawler-context";

export class HtmlParser {
  private readonly logger: ILogger;

  constructor(ctx: CrawlerContext) {
    this.logger = ctx.logger;
  }

  /**
   * Parse raw HTML into a Cheerio DOM.
   *
   * The same returned `$` instance can be passed to every extraction
   * helper — the DOM is loaded once and reused.
   *
   * @param html — Raw HTML string.  When empty a minimal empty DOM is returned.
   */
  parse(html: string): CheerioAPI {
    this.logger.info("HTML parser started", { bytes: html.length });

    const $ = cheerio.load(html);

    this.logger.info("HTML parser complete", { bytes: html.length });

    return $;
  }
}
