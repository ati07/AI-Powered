import { clerkClient } from "./clerk-client";
import { prisma } from "@/infrastructure/db/prisma";

/**
 * Resolve a Clerk user ID to an internal database user ID.
 *
 * If the user does not yet exist in the local database (because the Clerk
 * webhook hasn't fired — common in local development), this function
 * fetches their details from the Clerk API and creates the database record
 * on the fly.
 *
 * This allows local development to work without configuring Clerk webhooks
 * or a tunneling service (ngrok).
 */
export async function resolveInternalUserId(
  clerkUserId: string,
): Promise<string> {
  // 1. Check if user already exists in local DB
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  // 2. Fetch user from Clerk API
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(
      `Clerk user ${clerkUserId} has no email address; cannot create local record`,
    );
  }

  // 3. Create local user record
  const created = await prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      role: "USER",
      isActive: true,
    },
    select: { id: true },
  });

  console.info(
    `🆕 Auto-created local user record for Clerk user ${clerkUserId} → ${created.id}`,
  );

  return created.id;
}
