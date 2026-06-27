"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/shared/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Authenticated dashboard layout with sidebar navigation.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
