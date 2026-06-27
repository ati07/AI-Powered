"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";

/**
 * Wraps Clerk's useUser hook.
 *
 * Centralizes user data access. Add derived state or memoized values here.
 */
export function useUserProfile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();

  return {
    isLoaded,
    isSignedIn,
    user,
    /** Flattened profile for UI components. */
    profile: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          role: user.publicMetadata?.role as string | undefined,
        }
      : null,
  };
}
