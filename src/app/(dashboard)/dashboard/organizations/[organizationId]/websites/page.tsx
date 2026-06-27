import type { Metadata } from "next";
import { WebsitesPageClient } from "@/features/websites/components/websites-page-client";

export const metadata: Metadata = {
  title: "Websites",
};

/**
 * Dynamic render required for Clerk client hooks.
 */
export const dynamic = "force-dynamic";

interface WebsitesPageProps {
  params: Promise<{ organizationId: string }>;
}

export default async function WebsitesPage({ params }: WebsitesPageProps) {
  const { organizationId } = await params;

  return <WebsitesPageClient organizationId={organizationId} />;
}
