"use client"

import { ExternalLink } from "@/components/layout/external-link"
import { LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { siteInfo } from "@/lib/site"
import { RotateCw } from "lucide-react"
import { ShellBackdrop } from "./shell-backdrop"

/** Narrows the error-boundary `error` prop (it may not be an `Error`) to its digest, if any. */
export function errorDigest(error: unknown) {
  if (error instanceof Error && "digest" in error && typeof error.digest === "string") return error.digest
  return undefined
}

interface ErrorViewProps {
  retry: () => void
  digest?: string
  /**
   * The home link. In `global-error` the root layout (and with it client navigation) may be broken,
   * so a plain anchor is used there.
   */
  homeLink: React.ReactElement
}

/** Body of the error boundaries: a turtle on its back, a calm explanation and a retry. */
export function ErrorView({ retry, digest, homeLink }: ErrorViewProps) {
  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden">
      <ShellBackdrop className="[mask-image:radial-gradient(ellipse_55%_70%_at_75%_50%,black_10%,transparent_75%)] max-lg:[mask-image:radial-gradient(ellipse_100%_50%_at_50%_85%,black_10%,transparent_75%)]" />
      <div className="container-page grid items-center gap-x-12 gap-y-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            <span aria-hidden="true" className="size-2 rotate-45 rounded-[2px] bg-destructive" />
            Error · Something broke
          </p>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.02] font-bold tracking-[-0.04em] text-balance sm:text-6xl">
            Our turtle tripped over something.
          </h1>
          <p className="mt-6 max-w-lg text-lg/relaxed text-muted-foreground text-pretty">
            An unexpected error stopped this page from loading. Give it another go; most hiccups clear up on their
            own. If it keeps happening, please{" "}
            <ExternalLink
              href={`${siteInfo.repoUrl}/issues`}
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-current"
            >
              open an issue on GitHub
            </ExternalLink>
            .
          </p>
          <div className="mt-9 flex flex-col gap-3 min-[25rem]:flex-row">
            <Button size="lg" className="h-12 rounded-xl px-6 text-base" onClick={() => retry()}>
              <RotateCw />
              Try again
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base">
              {homeLink}
            </Button>
          </div>
          {digest && (
            <p className="mt-8 font-mono text-xs text-muted-foreground">
              Reference: <span className="select-all text-foreground">{digest}</span>
            </p>
          )}
        </div>

        {/* A turtle on its back, legs in the air. */}
        <div aria-hidden="true" className="flex justify-center lg:justify-end">
          <div className="relative">
            <LogoMark className="h-28 -scale-y-100 -rotate-6 sm:h-36" />
            <div className="mx-auto mt-3 h-2.5 w-3/4 rounded-[100%] bg-foreground/10 blur-[2px]" />
          </div>
        </div>
      </div>
    </section>
  )
}
