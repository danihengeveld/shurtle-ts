"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSyncExternalStore } from "react";

type AuthGuess = "unknown" | "signed-in" | "signed-out";

const noopSubscribe = () => () => {};

/**
 * Clerk mirrors the session state in a readable `__client_uat` cookie (0 = signed out). Reading it
 * lets us show the right placeholder before Clerk's JS has loaded, instead of flashing "Sign in"
 * at someone who is already signed in.
 */
function readAuthCookie(): AuthGuess {
  const values = [
    ...document.cookie.matchAll(/(?:^|;\s*)__client_uat(?:_[^=]*)?=(\d+)/g),
  ].map((m) => Number(m[1]));
  return values.some((v) => v > 0) ? "signed-in" : "signed-out";
}

const SIGN_IN_CLASSES = "h-10 w-full px-3.5";

/**
 * Auth slot in the navbar. It has a fixed width so nothing around it moves when Clerk loads or the
 * user signs in.
 */
export function NavbarAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const guess = useSyncExternalStore<AuthGuess>(
    noopSubscribe,
    readAuthCookie,
    () => "unknown",
  );
  const signedIn = isLoaded ? isSignedIn : guess === "signed-in";

  return (
    <div className="flex w-[4.75rem] shrink-0 items-center justify-end">
      {signedIn ? (
        <div className="relative flex size-10 items-center justify-center">
          {/* Placeholder avatar until Clerk renders the real one on top of it. */}
          <span
            aria-hidden="true"
            className="absolute size-8 rounded-full bg-muted"
          />
          {isLoaded && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                  userButtonTrigger: "rounded-full",
                },
              }}
            />
          )}
        </div>
      ) : isLoaded ? (
        <SignInButton mode="modal">
          <Button className={SIGN_IN_CLASSES}>Sign in</Button>
        </SignInButton>
      ) : (
        // Works without Clerk's JS: the dashboard redirects signed-out visitors to sign in.
        // Hidden (but space-reserving) during SSR, when we can't know the auth state yet.
        <Button asChild className={SIGN_IN_CLASSES}>
          <Link
            href="/dashboard"
            className={guess === "unknown" ? "invisible" : undefined}
          >
            Sign in
          </Link>
        </Button>
      )}
    </div>
  );
}
