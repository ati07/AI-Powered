"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Wraps the application with all global providers.
 *
 * ClerkProvider provides auth context throughout the app.
 * Add other providers (Theme, QueryClient, etc.) here as needed.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorText: "hsl(var(--foreground))",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
