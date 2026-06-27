"use client";

import { useState, useEffect, useCallback } from "react";
import type { WebsiteDTO } from "@/features/websites/schemas/website-schema";
import {
  fetchWebsites,
  createWebsite,
  updateWebsite,
  deleteWebsite,
} from "@/features/websites/api/website-client";

interface UseWebsitesReturn {
  /** List of websites in the organization. */
  websites: WebsiteDTO[];
  /** Currently loading state. */
  isLoading: boolean;
  /** Error message if the last operation failed. */
  error: string | null;
  /** Refetch websites from the server. */
  refetch: () => Promise<void>;
  /** Create a new website. Returns the created site on success. */
  create: (name: string, domain: string) => Promise<WebsiteDTO>;
  /** Update a website (name and/or domain). */
  update: (id: string, data: { name?: string; domain?: string }) => Promise<WebsiteDTO>;
  /** Delete a website. */
  remove: (id: string) => Promise<void>;
  /** Clear the current error. */
  clearError: () => void;
}

/**
 * Hook for website CRUD operations within an organization.
 *
 * Provides loading, error, and empty states for the UI.
 */
export function useWebsites(organizationId: string): UseWebsitesReturn {
  const [websites, setWebsites] = useState<WebsiteDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWebsites(organizationId);
      setWebsites(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load websites",
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (name: string, domain: string): Promise<WebsiteDTO> => {
      setError(null);
      try {
        const created = await createWebsite(organizationId, name, domain);
        setWebsites((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create website";
        setError(message);
        throw err;
      }
    },
    [organizationId],
  );

  const update = useCallback(
    async (
      id: string,
      data: { name?: string; domain?: string },
    ): Promise<WebsiteDTO> => {
      setError(null);
      try {
        const updated = await updateWebsite(id, data);
        setWebsites((prev) =>
          prev.map((w) => (w.id === id ? updated : w)),
        );
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update website";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await deleteWebsite(id);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete website";
      setError(message);
      throw err;
    }
  }, []);

  return {
    websites,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
    clearError,
  };
}
