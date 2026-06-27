"use client";

import { SignUp } from "@clerk/nextjs";

/**
 * Clerk's pre-built sign-up component.
 */
export function SignUpForm() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto w-full",
          card: "shadow-none border-0",
        },
      }}
    />
  );
}
