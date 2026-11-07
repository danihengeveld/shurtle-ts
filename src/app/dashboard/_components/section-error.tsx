"use client";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { RotateCwIcon } from "lucide-react";
import { catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";
import { LinksHeading } from "./links/links-heading";

/**
 * Error boundaries for the parts of the dashboard layout that load data. `dashboard/error.tsx` only
 * wraps the list (`children`), so without these a failing overview or toolbar query would reach
 * the root error page and replace the whole dashboard. `catchError` lets `redirect()` and
 * `notFound()` through (e.g. `auth.protect()` sending a signed-out visitor to sign in).
 */

function SectionErrorMessage({
  what,
  error,
  retry,
  className,
}: { what: string; className?: string } & ErrorInfo) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-center gap-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <p>Couldn&apos;t load {what}.</p>
      <Button size="sm" variant="outline" onClick={() => retry()}>
        <RotateCwIcon aria-hidden />
        Try again
      </Button>
    </div>
  );
}

/** A card-shaped fallback; size it with `className` to match the section it replaces. */
export const SectionErrorBoundary = catchError(
  (props: { what: string; className?: string }, info: ErrorInfo) => (
    <SectionErrorMessage
      {...info}
      what={props.what}
      className={cn(
        "flex-col rounded-2xl border border-dashed bg-card p-6 text-center",
        props.className,
      )}
    />
  ),
);

/** Keeps the "Links" heading (the section's accessible name) when the toolbar fails. */
export const LinksToolbarErrorBoundary = catchError(
  (_props: object, info: ErrorInfo) => (
    <LinksHeading>
      <SectionErrorMessage {...info} what="search and filters" />
    </LinksHeading>
  ),
);
