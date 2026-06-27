"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

/**
 * ClerkProvider is lazily loaded to avoid its eager key-format validation
 * during static pre-rendering at build time.
 *
 * In a production deployment with real Clerk keys you can remove this
 * dynamic wrapper and import Providers directly in the root layout.
 */
const ClerkProviders = dynamic(
  () => import("@/components/providers").then((mod) => ({ default: mod.Providers })),
  { ssr: false },
);

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ClerkProviders>
      <div className="relative flex min-h-screen flex-col">
        <DynamicHeader />
        <main className="flex-1">{children}</main>
      </div>
      <DynamicToaster />
    </ClerkProviders>
  );
}

const DynamicHeader = dynamic(
  () => import("@/components/shared/header").then((mod) => ({ default: mod.Header })),
  { ssr: false },
);

const DynamicToaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => ({ default: mod.Toaster })),
  { ssr: false },
);
