"use client";

import type { OrganizationDTO } from "@/features/organizations/schemas/organization-schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe } from "lucide-react";

interface OrganizationListProps {
  organizations: OrganizationDTO[];
  /** Renders action buttons per row (edit, delete). */
  actions?: (org: OrganizationDTO) => React.ReactNode;
}

/**
 * Displays the list of organizations as cards.
 *
 * Shows:
 * - Organization name and slug
 * - Member count and website count (when available)
 * - Action buttons (edit / delete)
 *
 * States:
 * - Empty: shows a centered empty-state message
 * - Loaded: card grid
 */
export function OrganizationList({ organizations, actions }: OrganizationListProps) {
  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">No organizations yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first organization to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Card key={org.id} className="flex flex-col">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {org.slug}
              </CardDescription>
            </div>
            {actions && <div className="flex gap-1">{actions(org)}</div>}
          </CardHeader>
          <CardContent className="mt-auto flex items-center gap-2 pt-4">
            <Badge variant="secondary">{org.timezone}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
