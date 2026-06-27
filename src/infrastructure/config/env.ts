import { z } from "zod";

const EnvSchema = z.object({
  /* ─── Database ─── */
  DATABASE_URL: z.string().url(),

  /* ─── Auth (Clerk) ─── */
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  /* ─── Clerk redirects ─── */
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/dashboard"),

  /* ─── App ─── */
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof EnvSchema>;

let parsedEnv: Env | null = null;

/**
 * Validate & cache environment variables.
 * Throws a clear error if a required variable is missing at startup.
 * In production this prevents the app from booting with an invalid config.
 */
export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join(".")} — ${i.message}`)
      .join("\n");

    throw new Error(
      `❌ Invalid environment variables:\n${missing}\n\n` +
        `Check your .env file or environment variables.`,
    );
  }

  parsedEnv = result.data;
  return parsedEnv;
}
