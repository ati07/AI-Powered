"use client";

import { SignIn } from "@clerk/nextjs";

/**
 * Clerk's pre-built sign-in component with redirect back to the app.
 *
 * Using the pre-built component ensures we get OAuth, MFA, passwordless,
 * error handling, and all Clerk features out of the box.
 */
export function SignInForm() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "mx-auto w-full",
          card: "shadow-none border-0",
        },
      }}
    />
  );
}
