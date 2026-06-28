/**
 * Crawler — robots.txt downloader.
 *
 * Requests `/robots.txt` from the target origin using the shared HttpClient.
 * A 404 response is treated as "no robots.txt" — the scan continues with
 * defaults.  Other HTTP and network errors are also handled gracefully so
 * the caller never has to deal with download failures.
 */

import { type ILogger } from "@/shared/logger";
import { HttpClient } from "@/shared/http/http-client";
import { HttpResponseError } from "@/shared/http/errors";

export class RobotsDownloader {
  constructor(
    private readonly logger: ILogger,
    private readonly httpClient: HttpClient,
  ) {}

  /**
   * Download the robots.txt for the given base URL.
   *
   * @param baseUrl — Origin or full URL of the target website.
   * @returns The raw robots.txt text, or an empty string when the
   *          file is missing (404) or the download fails.
   */
  async download(baseUrl: string): Promise<string> {
    /* Build the absolute robots.txt URL. */
    const url = new URL("/robots.txt", baseUrl).toString();

    this.logger.info("robots.txt download started", { url });

    try {
      const response = await this.httpClient.get<string>(url);

      this.logger.info("robots.txt download succeeded", {
        url,
        status: response.status,
        bytes: (response.data as string).length,
      });

      return response.data as string;
    } catch (error: unknown) {
      /* 404 → the file simply doesn't exist; continue with defaults. */
      if (error instanceof HttpResponseError && error.status === 404) {
        this.logger.info("robots.txt not found (404) — continuing with defaults", {
          url,
        });
        return "";
      }

      /* All other errors (timeout, network, retry exhaustion, …). */
      this.logger.warn("robots.txt download failed — continuing with defaults", {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return "";
    }
  }
}
