"use client";

import { isValidSlug } from "@/lib/slugs";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent } from "react";
import { useCreateLink } from "./create-link-provider";

/**
 * `?new=<slug>` (e.g. from the 404 page's "claim this slug" CTA) opens the create dialog with the
 * slug prefilled, then removes the parameter so a refresh doesn't reopen it.
 * Render inside <Suspense> (it reads search params).
 */
export function CreateLinkDeepLink() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { openCreate } = useCreateLink();
  const requested = searchParams.get("new");

  const handleRequest = useEffectEvent((value: string) => {
    const slug = value.trim();
    if (isValidSlug(slug)) openCreate({ slug });

    const remaining = new URLSearchParams(searchParams.toString());
    remaining.delete("new");
    const query = remaining.toString();
    // The native History API updates the URL (and useSearchParams) without a navigation, so the
    // page isn't re-rendered on the server just to drop a parameter.
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  });

  useEffect(() => {
    if (requested !== null) handleRequest(requested);
  }, [requested]);

  return null;
}
