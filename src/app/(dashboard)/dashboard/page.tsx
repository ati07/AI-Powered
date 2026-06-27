import type { Metadata } from "next";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Dashboard page must be dynamically rendered because it uses Clerk client hooks.
 */
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardContent />;
}
