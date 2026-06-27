"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrganizationDTO } from "@/features/organizations/schemas/organization-schema";
import {
  fetchOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/features/organizations/api/organization-client";

interface UseOrganizationsReturn {
  /** List of organizations the user belongs to. */
  organizations: OrganizationDTO[];
  /** Currently loading state. */
  isLoading: boolean;
  /** Error message if the last operation failed. */
  error: string | null;
  /** Refetch organizations from the server. */
  refetch: () => Promise<void>;
  /** Create a new organization. Returns the created org on success. */
  create: (name: string) => Promise<OrganizationDTO>;
  /** Rename an organization. */
  rename: (id: string, name: string) => Promise<OrganizationDTO>;
  /** Delete an organization. */
  remove: (id: string) => Promise<void>;
  /** Clear the current error. */
  clearError: () => void;
}

/**
 * Hook for organization CRUD operations.
 *
 * Provides loading, error, and empty states for the UI.
 */
export function useOrganizations(): UseOrganizationsReturn {
  const [organizations, setOrganizations] = useState<OrganizationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchOrganizations();
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(async (name: string): Promise<OrganizationDTO> => {
    setError(null);

    try {
      const created = await createOrganization(name);
      setOrganizations((prev) => [...prev, created]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create organization";
      setError(message);
      throw err;
    }
  }, []);

  const rename = useCallback(async (id: string, name: string): Promise<OrganizationDTO> => {
    setError(null);

    try {
      const updated = await updateOrganization(id, name);
      setOrganizations((prev) => prev.map((o) => (o.id === id ? updated : o)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update organization";
      setError(message);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      await deleteOrganization(id);
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete organization";
      setError(message);
      throw err;
    }
  }, []);

  return {
    organizations,
    isLoading,
    error,
    refetch,
    create,
    rename,
    remove,
    clearError,
  };
}
