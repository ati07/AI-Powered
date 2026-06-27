import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/infrastructure/db/prisma";

type ClerkUserData = {
  id: string;
  email_addresses: { email_address: string }[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

/**
 * Handle Clerk webhook events to keep the local user table in sync.
 *
 * Called from src/app/api/webhooks/clerk/route.ts
 */
export async function handleClerkWebhook(event: WebhookEvent): Promise<void> {
  const { type, data } = event;

  switch (type) {
    case "user.created":
    case "user.updated": {
      const userData = data as unknown as ClerkUserData;
      const primaryEmail = userData.email_addresses[0]?.email_address;

      if (!primaryEmail) {
        console.warn("Clerk webhook: user has no email — skipping", userData.id);
        return;
      }

      await prisma.user.upsert({
        where: { clerkId: userData.id },
        create: {
          clerkId: userData.id,
          email: primaryEmail,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
          role: "USER",
          isActive: true,
        },
        update: {
          email: primaryEmail,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
        },
      });

      console.log(`✅ Clerk webhook: user ${type} synced — ${userData.id}`);
      break;
    }

    case "user.deleted": {
      const userId = data.id as string;
      if (userId) {
        await prisma.user.deleteMany({ where: { clerkId: userId } });
        console.log(`🗑️ Clerk webhook: user deleted — ${userId}`);
      }
      break;
    }

    default: {
      console.log(`ℹ️ Clerk webhook: unhandled event type — ${type}`);
    }
  }
}
