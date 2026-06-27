import type { Metadata } from "next";
import { OrganizationsPageClient } from "@/features/organizations/components/organizations-page-client";

export const metadata: Metadata = {
  title: "Organizations",
};

/**
 * Dashboard organizations page.
 * Marked as dynamic since it uses client-side Clerk hooks for auth.
 */
export const dynamic = "force-dynamic";

export default function OrganizationsPage() {
  return <OrganizationsPageClient />;
}
