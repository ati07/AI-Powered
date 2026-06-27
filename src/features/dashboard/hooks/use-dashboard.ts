"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";

/**
 * Dashboard-specific data hook.
 *
 * Currently provides user context. Extend with server data fetching
 * (e.g., via React Query or server components) as the app grows.
 */
export function useDashboard() {
  const { isAuthenticated, user } = useAuth();

  return {
    isAuthenticated,
    user,
    /** Placeholder stats — replace with real API data */
    stats: [
      {
        title: "Total Users",
        value: "—",
        description: "Coming soon",
      },
      {
        title: "Active Sessions",
        value: "—",
        description: "Coming soon",
      },
      {
        title: "Tasks Completed",
        value: "—",
        description: "Coming soon",
      },
      {
        title: "Uptime",
        value: "—",
        description: "Coming soon",
      },
    ],
  };
}
