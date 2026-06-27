/**
 * Re-export Clerk's server and client helpers.
 *
 * This is the single point of integration for Clerk in the application.
 * If you ever need to mock Clerk in tests or swap providers, this is the only
 * file you need to modify.
 */
export {
  auth,
  currentUser,
  clerkClient,
} from "@clerk/nextjs/server";
