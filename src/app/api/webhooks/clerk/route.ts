import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { handleClerkWebhook } from "@/infrastructure/auth/clerk/clerk-webhook";

/**
 * POST /api/webhooks/clerk
 *
 * Receives Clerk webhook events (user.created, user.updated, user.deleted)
 * and syncs them to the local database.
 *
 * Protected by Svix signature verification using CLERK_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("❌ CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  let event: WebhookEvent;

  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Handle the event
  try {
    await handleClerkWebhook(event);
    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
