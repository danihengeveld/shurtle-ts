import "server-only";

import { auth } from "@clerk/nextjs/server";

/**
 * Resource-level auth check (Clerk's recommended replacement for route matchers in the proxy).
 * Call this in every Server Component / Server Function that reads or writes user data.
 * Redirects signed-out visitors to sign-in from a page, or responds 404 from a Server Function.
 */
export async function requireUserId() {
  const { userId } = await auth.protect();
  return userId;
}
