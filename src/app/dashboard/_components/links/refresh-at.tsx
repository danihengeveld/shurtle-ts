"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

/** setTimeout's ceiling (~24.8 days); later moments get a fresh timer after the next render. */
const MAX_DELAY = 2 ** 31 - 1;
/** A moment's grace, so the server's clock has passed the boundary too. */
const SLACK_MS = 1000;

/**
 * Re-renders the page's server data at the earliest of `moments` (ms timestamps) that's still
 * ahead: when a shown link expires or its renewal window ends, it moves to the right list without
 * a reload. Pills and countdowns tick on their own; this catches the structure up.
 */
export function RefreshAt({ moments }: { moments: number[] }) {
  const router = useRouter();
  // A stable dependency for the array the server sends on every render.
  const key = moments.join(",");

  useEffect(() => {
    const now = Date.now();
    const next = Math.min(
      ...key
        .split(",")
        .map(Number)
        .filter((moment) => moment > now),
    );
    if (!Number.isFinite(next)) return;

    const timer = setTimeout(
      () => startTransition(() => router.refresh()),
      Math.min(next - now + SLACK_MS, MAX_DELAY),
    );
    return () => clearTimeout(timer);
  }, [key, router]);

  return null;
}
