"use client";

import { useState, useEffect } from "react";
import { useWebsites } from "@/features/websites/hooks/use-websites";
import { WebsiteList } from "@/features/websites/components/website-list";
import { CreateWebsiteDialog } from "@/features/websites/components/create-website-dialog";
import { EditWebsiteDialog } from "@/features/websites/components/edit-website-dialog";
import { DeleteWebsiteDialog } from "@/features/websites/components/delete-website-dialog";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { PageContainer } from "@/components/shared/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface WebsitesPageClientProps {
  organizationId: string;
}

/**
 * Websites page that wires hooks to UI components.
 *
 * Handles loading, empty, error states, and permission-aware UI.
 */
export function WebsitesPageClient({
  organizationId,
}: WebsitesPageClientProps) {
  const { websites, isLoading, error, refetch, create, update, remove, clearError } =
    useWebsites(organizationId);

  const [orgName, setOrgName] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch org metadata and role on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch organization details and check role in one call
        const res = await fetch(`/api/organizations/${organizationId}/role`);
        if (!res.ok) throw new Error("Failed to load page data");

        const body = (await res.json()) as {
          name: string;
          role: string;
        };

        if (!cancelled) {
          setOrgName(body.name);
          setCanManage(
            body.role === "OWNER" || body.role === "ADMIN",
          );
        }
      } catch {
        if (!cancelled) {
          setOrgName("Organization");
          setCanManage(false);
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if ((isLoading && websites.length === 0) || pageLoading) {
    return (
      <DashboardLayout>
        <PageContainer
          title="Websites"
          description={orgName ? `Sites in ${orgName}` : undefined}
        >
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading websites…</span>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer
        title="Websites"
        description={orgName ? `Sites in ${orgName}` : undefined}
      >
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
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/organizations"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              Back to Organizations
            </Link>
            <p className="text-sm text-muted-foreground">
              {websites.length}{" "}
              {websites.length === 1 ? "website" : "websites"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
            {canManage && <CreateWebsiteDialog onCreate={create} />}
          </div>
        </div>

        {/* Website cards */}
        <WebsiteList
          websites={websites}
          organizationId={organizationId}
          canManage={canManage}
          actions={
            canManage
              ? (website) => (
                  <>
                    <EditWebsiteDialog website={website} onUpdate={update} />
                    <DeleteWebsiteDialog
                      website={website}
                      onDelete={remove}
                    />
                  </>
                )
              : undefined
          }
        />
      </PageContainer>
    </DashboardLayout>
  );
}
