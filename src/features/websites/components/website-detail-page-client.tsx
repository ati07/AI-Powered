"use client";

import { useState, useEffect } from "react";
import { useWebsites } from "@/features/websites/hooks/use-websites";
import { ScansSection } from "@/features/scans/components/scans-section";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { PageContainer } from "@/components/shared/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface WebsiteDetailPageClientProps {
  organizationId: string;
  websiteId: string;
}

/**
 * Website detail page showing website info and scan history.
 *
 * Handles loading, error, and permission-aware UI.
 */
export function WebsiteDetailPageClient({
  organizationId,
  websiteId,
}: WebsiteDetailPageClientProps) {
  const { websites, isLoading, error: websiteError, refetch } =
    useWebsites(organizationId);

  const [orgName, setOrgName] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch org metadata and role on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
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

  const website = websites.find((w) => w.id === websiteId);

  if ((isLoading && websites.length === 0) || pageLoading) {
    return (
      <DashboardLayout>
        <PageContainer title="Website" description="Loading…">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading website…</span>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!website) {
    return (
      <DashboardLayout>
        <PageContainer title="Website Not Found">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Website not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The website you are looking for does not exist or has been removed.
            </p>
            <Link
              href={`/dashboard/organizations/${organizationId}/websites`}
              className="mt-4"
            >
              <Button variant="outline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Websites
              </Button>
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer
        title={website.name}
        description={orgName ? `Website in ${orgName}` : undefined}
      >
        {/* Error banner */}
        {websiteError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{websiteError}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refetch}>
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="mb-6">
          <Link
            href={`/dashboard/organizations/${organizationId}/websites`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to Websites
          </Link>
        </div>

        {/* Website info card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-medium">{website.domain}</span>
              <Badge
                variant={website.verified ? "default" : "secondary"}
                className="ml-2"
              >
                {website.verified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            {website.faviconUrl && (
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  Normalized: {website.normalizedDomain}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan section */}
        <ScansSection websiteId={websiteId} canManage={canManage} />
      </PageContainer>
    </DashboardLayout>
  );
}
