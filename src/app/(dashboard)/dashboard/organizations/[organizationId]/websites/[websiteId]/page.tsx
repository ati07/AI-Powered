export const dynamic = "force-dynamic";

import { WebsiteDetailPageClient } from "@/features/websites/components/website-detail-page-client";

/**
 * Server component for the website detail page.
 *
 * Renders the website detail and scan history.
 */
export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string; websiteId: string }>;
}) {
  const { organizationId, websiteId } = await params;

  return (
    <WebsiteDetailPageClient
      organizationId={organizationId}
      websiteId={websiteId}
    />
  );
}
