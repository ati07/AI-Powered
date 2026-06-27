"use client";

import { useOrganizations } from "@/features/organizations/hooks/use-organizations";
import { OrganizationList } from "@/features/organizations/components/organization-list";
import { CreateOrganizationDialog } from "@/features/organizations/components/create-organization-dialog";
import { EditOrganizationDialog } from "@/features/organizations/components/edit-organization-dialog";
import { DeleteOrganizationDialog } from "@/features/organizations/components/delete-organization-dialog";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { PageContainer } from "@/components/shared/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Organization page that wires hooks to UI components.
 *
 * Handles loading, empty, and error states.
 */
export function OrganizationsPageClient() {
  const { organizations, isLoading, error, refetch, create, rename, remove, clearError } =
    useOrganizations();

  if (isLoading && organizations.length === 0) {
    return (
      <DashboardLayout>
        <PageContainer title="Organizations" description="Manage your workspaces.">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading organizations…</span>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer title="Organizations" description="Manage your workspaces.">
      {/* Error banner */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {organizations.length}{" "}
          {organizations.length === 1 ? "organization" : "organizations"}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
          <CreateOrganizationDialog onCreate={create} />
        </div>
      </div>

      {/* Organization cards */}
      <OrganizationList
        organizations={organizations}
        actions={(org) => (
          <>
            <EditOrganizationDialog organization={org} onRename={rename} />
            <DeleteOrganizationDialog organization={org} onDelete={remove} />
          </>
        )}
      />
    </PageContainer>
      </DashboardLayout>
  );
}
