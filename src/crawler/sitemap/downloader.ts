/**
 * Crawler — sitemap XML downloader.
 *
 * Downloads sitemap XML using the shared HttpClient.
 * HTTP failures are handled gracefully — the caller receives an
 * empty string so the scan can continue.
 */

import { HttpResponseError } from "@/shared/http/errors";
import { type CrawlerContext } from "@/crawler/core/crawler-context";

export class SitemapDownloader {
  private readonly logger;
  private readonly httpClient;

  constructor(ctx: CrawlerContext) {
    this.logger = ctx.logger;
    this.httpClient = ctx.httpClient;
  }

  /**
   * Download a sitemap XML file.
   *
   * @param url — Absolute URL of the sitemap.
   * @returns The raw XML text, or an empty string on failure.
   */
  async download(url: string): Promise<string> {
    this.logger.info("sitemap download started", { url });

    try {
      const response = await this.httpClient.get<string>(url);

      this.logger.info("sitemap download succeeded", {
        url,
        status: response.status,
        bytes: (response.data as string).length,
      });

      return response.data as string;
    } catch (error: unknown) {
      if (error instanceof HttpResponseError) {
        this.logger.warn("sitemap download failed — continuing with defaults", {
          url,
          status: error.status,
          error: error.message,
        });
      } else {
        this.logger.warn("sitemap download failed — continuing with defaults", {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return "";
    }
  }
}
