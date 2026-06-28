/**
 * Crawler — robots.txt service.
 *
 * Coordinates the download and parsing of `/robots.txt`.
 * This is the primary entry point used by the CrawlProcessor.
 *
 * Usage:
 *   const service = new RobotsService(logger, httpClient);
 *   const result = await service.fetchAndParse("https://example.com");
 *   // result.groups     → per-user-agent rule sets
 *   // result.sitemapUrls → discovered sitemap URLs
 */

import { type ILogger } from "@/shared/logger";
import { HttpClient } from "@/shared/http/http-client";
import { RobotsDownloader } from "./downloader";
import { RobotsParser } from "./parser";
import { type RobotsResult } from "./types";

export class RobotsService {
  private readonly downloader: RobotsDownloader;
  private readonly parser: RobotsParser;

  constructor(
    private readonly logger: ILogger,
    httpClient: HttpClient,
  ) {
    this.downloader = new RobotsDownloader(logger, httpClient);
    this.parser = new RobotsParser();
  }

  /**
   * Download and parse robots.txt for the given website.
   *
   * @param baseUrl — Origin (e.g. `https://example.com`).
   * @returns A structured `RobotsResult`.  Never throws — failures produce
   *          an empty result so the scan always continues.
   */
  async fetchAndParse(baseUrl: string): Promise<RobotsResult> {
    const raw = await this.downloader.download(baseUrl);

    if (raw === "") {
      this.logger.info("robots.txt empty or missing — returning default result");
      return { groups: [], sitemapUrls: [] };
    }

    this.logger.info("robots.txt parse started", { bytes: raw.length });
    const result = this.parser.parse(raw);
    this.logger.info("robots.txt parse completed", {
      groups: result.groups.length,
      sitemapUrls: result.sitemapUrls.length,
    });

    return result;
  }
}
