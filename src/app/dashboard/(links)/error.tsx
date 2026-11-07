"use client";

import { Button } from "@/components/ui/button";
import { RotateCwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    error instanceof Error && "digest" in error
      ? String(error.digest)
      : undefined;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    // Renders in place of the list (below the links toolbar), so it is a card rather than a page.
    <div className="flex justify-center">
      <div
        role="alert"
        className="relative isolate w-full max-w-md overflow-hidden rounded-3xl border bg-card px-6 py-10 text-center shadow-soft sm:px-10"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        >
          <div className="size-full shell-pattern" />
        </div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Links unavailable
        </p>
        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-balance">
          We couldn&apos;t load your links
        </h3>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          Something went wrong on our side. This is usually temporary, so please
          try again.
        </p>
        <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <Button asChild variant="ghost" className="h-10 sm:h-9">
            <Link href="/">Go home</Link>
          </Button>
          <Button onClick={() => retry()} className="h-10 sm:h-9">
            <RotateCwIcon aria-hidden />
            Try again
          </Button>
        </div>
        {digest && (
          <p className="mt-6 font-mono text-[11px] text-muted-foreground">
            Error ID: {digest}
          </p>
        )}
      </div>
    </div>
  );
}
