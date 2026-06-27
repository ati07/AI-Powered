"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

/**
 * Custom auth hook wrapping Clerk.
 *
 * Provides user authentication state in one place.
 * If you ever swap auth providers, this is the only file to update.
 */
export function useAuth() {
  const { isSignedIn, isLoaded, userId, sessionId, orgId, orgRole, orgSlug } = useClerkAuth();
  const { user } = useUser();

  return {
    /** True while Clerk initializes. Show a loader while false. */
    isLoaded,
    /** Whether a user is currently signed in. */
    isAuthenticated: isSignedIn,
    /** Raw Clerk session data (use sparingly). */
    userId,
    sessionId,
    orgId,
    orgRole,
    orgSlug,
    /** Full Clerk user object. */
    user,
  };
}
