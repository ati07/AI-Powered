import type { OrganizationDTO, ApiResponse, ApiError } from "@/features/organizations/schemas/organization-schema";

const BASE_URL = "/api/organizations";

/**
 * Client-side API helpers for organization CRUD.
 *
 * All requests include Clerk auth cookies automatically.
 */

export async function fetchOrganizations(): Promise<OrganizationDTO[]> {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to fetch organizations");
  }

  const body = (await response.json()) as ApiResponse<OrganizationDTO[]>;
  return body.data;
}

export async function createOrganization(name: string): Promise<OrganizationDTO> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to create organization");
  }

  const body = (await response.json()) as ApiResponse<OrganizationDTO>;
  return body.data;
}

export async function updateOrganization(
  id: string,
  name: string,
): Promise<OrganizationDTO> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to update organization");
  }

  const body = (await response.json()) as ApiResponse<OrganizationDTO>;
  return body.data;
}

export async function deleteOrganization(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error ?? "Failed to delete organization");
  }
}
