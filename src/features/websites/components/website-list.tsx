"use client";

import type { WebsiteDTO } from "@/features/websites/schemas/website-schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface WebsiteListProps {
  websites: WebsiteDTO[];
  /** Organization ID for constructing detail page links. */
  organizationId: string;
  /** Renders action buttons per row (edit, delete). */
  actions?: (website: WebsiteDTO) => React.ReactNode;
  /** Whether the user can edit/delete (OWNER or ADMIN). */
  canManage?: boolean;
}

/**
 * Displays the list of websites for an organization as cards.
 *
 * Shows:
 * - Website name
 * - Normalized domain
 * - Verification status badge
 * - Last scan date
 * - Created date
 * - Action buttons (edit / delete)
 *
 * States:
 * - Empty: shows a centered empty-state message
 * - Loaded: card grid (clickable to detail page)
 */
export function WebsiteList({
  websites,
  organizationId,
  actions,
}: WebsiteListProps) {
  if (websites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Globe className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">No websites yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first website to start monitoring its AI visibility.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {websites.map((website) => (
        <Link
          key={website.id}
          href={`/dashboard/organizations/${organizationId}/websites/${website.id}`}
          className="transition-colors hover:opacity-90"
        >
          <Card className="flex h-full flex-col cursor-pointer">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg">{website.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {website.normalizedDomain}
                </CardDescription>
              </div>
              {actions && <div className="flex gap-1 shrink-0">{actions(website)}</div>}
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center gap-2 pt-4">
              <Badge
                variant={website.verified ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {website.verified ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {website.verified ? "Verified" : "Unverified"}
              </Badge>

              {website.lastScanAt ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(website.lastScanAt)}
                </Badge>
              ) : (
                <Badge variant="outline">No scans yet</Badge>
              )}

              <Badge variant="outline" className="ml-auto">
                {formatDate(website.createdAt)}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}
