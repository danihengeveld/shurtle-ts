import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { siteInfo } from "@/lib/site";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusPage,
  StatusText,
  statusCta,
} from "../../_components/status-view";

export const metadata: Metadata = {
  title: "Link expired",
  description: "This short link has expired and no longer redirects.",
  robots: { index: false },
};

/**
 * Shown by the proxy (rewrite, HTTP 410) when someone opens a short link that has expired. The
 * browser URL is still the short link. Deliberately generic: it reveals nothing about the link's
 * owner or destination.
 */
export default function ExpiredPage() {
  return (
    <StatusPage>
      <StatusText
        eyebrow="410 · Link expired"
        markerClassName="bg-muted-foreground"
        title="This link has run its course."
        actions={
          <>
            <Button asChild size="lg" className={statusCta}>
              <Link href="/dashboard">
                Make your own short link
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={statusCta}>
              <Link href="/">Back to home</Link>
            </Button>
          </>
        }
      >
        Whoever shared it set it to stop working after a while, and that time
        has passed. If you still need it, ask them for a fresh link.
      </StatusText>

      <div aria-hidden="true" className="flex justify-center lg:justify-end">
        <ExpiredTicket />
      </div>
    </StatusPage>
  );
}

/** A short link "ticket", punched and stamped expired. */
function ExpiredTicket() {
  return (
    <div className="relative w-72 max-w-full rotate-[-4deg] sm:w-80">
      <div className="rounded-3xl border border-dashed bg-card/80 p-6 shadow-soft backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 opacity-50 grayscale" />
          <span className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
            Short link
          </span>
        </div>
        <p className="mt-6 truncate font-mono text-lg text-muted-foreground line-through decoration-muted-foreground/50">
          {siteInfo.baseUrl.host}/
          <span className="text-foreground/60">••••••</span>
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-dashed pt-4 font-mono text-xs text-muted-foreground">
          <span>valid until</span>
          <span className="tabular-nums">— — —</span>
        </div>
      </div>
      <span className="absolute -top-4 -right-3 rotate-[14deg] rounded-lg border-2 border-destructive/70 px-3 py-1 font-display text-lg font-bold tracking-[0.08em] text-[color-mix(in_oklab,var(--destructive)_85%,black)] uppercase dark:text-[color-mix(in_oklab,var(--destructive)_80%,white)]">
        Expired
      </span>
    </div>
  );
}
