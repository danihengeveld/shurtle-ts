"use client";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { RENEWAL_WINDOW_MS } from "@/lib/link-lifecycle";
import { siteInfo } from "@/lib/site";
import { isValidSlug } from "@/lib/slugs";
import { cn } from "cn";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { StatusText, statusCta } from "../../_components/status-view";
import {
  formatClock,
  formatTimeLeft,
} from "../../dashboard/_components/format";

/*
 * The expired page's content. While the owner can still renew the link it counts down to the
 * moment anyone can claim the slug; at zero it flips, live, to offering the slug.
 */

let clockNow = 0;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const notify of clockListeners) notify();
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) clearInterval(clockTimer);
  };
}

/** A clock ticking every second; `serverNow` during SSR and hydration, so the markup matches. */
function useClock(serverNow: number) {
  return useSyncExternalStore(
    subscribeToClock,
    () => clockNow || Date.now(),
    () => serverNow,
  );
}

export function ExpiredView({
  slug,
  releasesAt,
  serverNow,
}: {
  /** The expired short link's slug, when the proxy sent the visitor here. */
  slug: string | null;
  /** When anyone can claim the slug (ms), or null when they already can. */
  releasesAt: number | null;
  serverNow: number;
}) {
  const now = useClock(serverNow);
  const left = releasesAt === null ? 0 : releasesAt - now;
  // Slugs from before today's rules may not be claimable (e.g. now reserved): no offer for those.
  const claimable = slug !== null && left <= 0 && isValidSlug(slug);
  // Announce the flip to screen readers only when it happens on screen, not on arrival.
  const [arrivedClaimable] = useState(claimable);

  return (
    <>
      <StatusText
        eyebrow="410 · Link expired"
        markerClassName={claimable ? "bg-brand-ink" : "bg-muted-foreground"}
        title={
          claimable ? (
            <>
              <SlugMark slug={slug} /> is up for grabs.
            </>
          ) : (
            "This link has run its course."
          )
        }
        actions={
          <>
            {claimable ? (
              <Button asChild size="lg" className={cn(statusCta, "group")}>
                <Link href={`/dashboard?new=${encodeURIComponent(slug)}`}>
                  Claim this link
                  <ArrowRight className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className={statusCta}>
                <Link href="/dashboard">
                  Make your own short link
                  <ArrowRight />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className={statusCta}>
              <Link href="/">Back to home</Link>
            </Button>
          </>
        }
      >
        {claimable ? (
          <>
            It expired and its owner didn&rsquo;t renew it, so the slug is free
            again. Make it yours in a few seconds.
          </>
        ) : slug && releasesAt !== null && left > 0 ? (
          <>
            Whoever shared it set it to stop working, and that time has passed.
            They can still renew it for the next{" "}
            <span className="font-medium whitespace-nowrap text-foreground tabular-nums">
              {formatTimeLeft(left)}
            </span>
            ; after that, <span className="font-mono">/{slug}</span> is up for
            grabs.
          </>
        ) : (
          <>
            Whoever shared it set it to stop working after a while, and that
            time has passed. If you still need it, ask them for a fresh link.
          </>
        )}
      </StatusText>

      <p aria-live="polite" className="sr-only">
        {claimable && !arrivedClaimable ? `/${slug} is now free to claim.` : ""}
      </p>

      <div aria-hidden="true" className="flex justify-center lg:justify-end">
        <Ticket
          slug={slug}
          releasesAt={releasesAt}
          left={left}
          available={claimable}
        />
      </div>
    </>
  );
}

function SlugMark({ slug }: { slug: string }) {
  return (
    <span className="rounded-[0.14em] bg-brand [box-decoration-break:clone] px-[0.12em] font-mono text-[0.8em] font-semibold tracking-[-0.03em] break-all text-brand-foreground">
      /{slug}
    </span>
  );
}

/** A short link "ticket": punched, stamped, and counting down to the slug's release. */
function Ticket({
  slug,
  releasesAt,
  left,
  available,
}: {
  slug: string | null;
  releasesAt: number | null;
  left: number;
  available: boolean;
}) {
  const counting = slug !== null && releasesAt !== null && left > 0;
  const elapsed = counting ? 1 - left / RENEWAL_WINDOW_MS : 1;

  return (
    <div className="relative w-72 max-w-full rotate-[-4deg] sm:w-80">
      <div className="rounded-3xl border border-dashed bg-card/80 p-6 shadow-soft backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <LogoMark
            className={cn(
              "h-9 transition-[opacity,filter] duration-500",
              available ? "opacity-100" : "opacity-50 grayscale",
            )}
          />
          <span className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
            Short link
          </span>
        </div>
        <p
          className={cn(
            "mt-6 truncate font-mono text-lg",
            available
              ? "text-foreground"
              : "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          <span className={available ? "text-muted-foreground" : undefined}>
            {siteInfo.baseUrl.host}/
          </span>
          {slug ? (
            <span
              className={available ? "font-semibold" : "text-foreground/60"}
            >
              {slug}
            </span>
          ) : (
            <span className="text-foreground/60">••••••</span>
          )}
        </p>
        <div className="mt-6 border-t border-dashed pt-4 font-mono text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            {counting ? (
              <>
                <span>free again in</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {formatClock(left)}
                </span>
              </>
            ) : available ? (
              <>
                <span>status</span>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="size-1.5 rounded-full bg-brand-ink" />
                  available now
                </span>
              </>
            ) : (
              <>
                <span>valid until</span>
                <span className="tabular-nums">— — —</span>
              </>
            )}
          </div>
          {counting && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-ink transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
                style={{ width: `${Math.max(2, elapsed * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
      {available ? (
        <span
          key="available"
          className="absolute -top-4 -right-3 rotate-[14deg] rounded-lg border-2 border-brand-ink/80 bg-card/60 px-3 py-1 font-display text-lg font-bold tracking-[0.08em] text-brand-ink uppercase backdrop-blur-sm duration-500 ease-out-expo motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-150"
        >
          Available
        </span>
      ) : (
        <span
          key="expired"
          className="absolute -top-4 -right-3 rotate-[14deg] rounded-lg border-2 border-destructive/70 px-3 py-1 font-display text-lg font-bold tracking-[0.08em] text-[color-mix(in_oklab,var(--destructive)_85%,black)] uppercase dark:text-[color-mix(in_oklab,var(--destructive)_80%,white)]"
        >
          Expired
        </span>
      )}
    </div>
  );
}
