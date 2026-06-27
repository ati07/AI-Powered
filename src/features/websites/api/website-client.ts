import type { WebsiteDTO, ApiResponse, ApiError } from "@/features/websites/schemas/website-schema";

/**
 * Client-side API helpers for website CRUD.
 *
 * All requests include Clerk auth cookies automatically.
 */

export async function fetchWebsites(
  organizationId: string,
): Promise<WebsiteDTO[]> {
  const response = await fetch(
    `/api/organizations/${organizationId}/websites`,
  );

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to fetch websites");
  }

  const body = (await response.json()) as ApiResponse<WebsiteDTO[]>;
  return body.data;
}

export async function createWebsite(
  organizationId: string,
  name: string,
  domain: string,
): Promise<WebsiteDTO> {
  const response = await fetch(
    `/api/organizations/${organizationId}/websites`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain }),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to create website");
  }

  const body = (await response.json()) as ApiResponse<WebsiteDTO>;
  return body.data;
}

export async function updateWebsite(
  id: string,
  data: { name?: string; domain?: string },
): Promise<WebsiteDTO> {
  const response = await fetch(`/api/websites/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to update website");
  }

  const body = (await response.json()) as ApiResponse<WebsiteDTO>;
  return body.data;
}

export async function deleteWebsite(id: string): Promise<void> {
  const response = await fetch(`/api/websites/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to delete website");
  }
}
