"use client";

import { ExternalLink } from "@/components/layout/external-link";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { siteInfo } from "@/lib/site";
import { RotateCw } from "lucide-react";
import { StatusPage, StatusText, statusCta } from "./status-view";

/** Narrows the error-boundary `error` prop (it may not be an `Error`) to its digest, if any. */
export function errorDigest(error: unknown) {
  if (
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
  )
    return error.digest;
  return undefined;
}

interface ErrorViewProps {
  retry: () => void;
  digest?: string;
  /**
   * The home link. In `global-error` the root layout (and with it client navigation) may be broken,
   * so a plain anchor is used there.
   */
  homeLink: React.ReactElement;
}

/** Body of the error boundaries: a turtle on its back, a calm explanation and a retry. */
export function ErrorView({ retry, digest, homeLink }: ErrorViewProps) {
  return (
    <StatusPage>
      <StatusText
        eyebrow="Error · Something broke"
        markerClassName="bg-destructive"
        title="Our turtle tripped over something."
        actions={
          <>
            <Button size="lg" className={statusCta} onClick={() => retry()}>
              <RotateCw />
              Try again
            </Button>
            <Button asChild size="lg" variant="outline" className={statusCta}>
              {homeLink}
            </Button>
          </>
        }
        footer={
          digest && (
            <p className="mt-8 font-mono text-xs text-muted-foreground">
              Reference:{" "}
              <span className="text-foreground select-all">{digest}</span>
            </p>
          )
        }
      >
        An unexpected error stopped this page from loading. Give it another go;
        most hiccups clear up on their own. If it keeps happening, please{" "}
        <ExternalLink
          href={`${siteInfo.repoUrl}/issues`}
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-current"
        >
          open an issue on GitHub
        </ExternalLink>
        .
      </StatusText>

      {/* A turtle on its back, legs in the air. */}
      <div aria-hidden="true" className="flex justify-center lg:justify-end">
        <div className="relative">
          <LogoMark className="h-28 -scale-y-100 -rotate-6 sm:h-36" />
          <div className="mx-auto mt-3 h-2.5 w-3/4 rounded-[100%] bg-foreground/10 blur-[2px]" />
        </div>
      </div>
    </StatusPage>
  );
}
