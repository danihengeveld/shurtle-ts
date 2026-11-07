"use client";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { siteInfo } from "@/lib/site";
import { isValidSlug } from "@/lib/slugs";
import { cn } from "cn";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";
import styles from "./not-found.module.css";
import { StatusPage, StatusText, statusCta } from "./status-view";

const noopSubscribe = () => () => {};

/** Runs during HTML parsing: hide the generic fallback if the URL may be a claimable slug. */
const PENDING_SCRIPT = `(function(){var p=location.pathname;if(/^\\/[A-Za-z0-9_-]{1,64}$/.test(p)&&p!=="/not-found"){var s=document.currentScript;s&&s.parentElement&&s.parentElement.setAttribute("data-pending","")}})()`;

function slugFromPath(pathname: string | null) {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(segments[0]);
  } catch {
    return null;
  }
  return isValidSlug(slug) ? slug : null;
}

export function NotFoundContent() {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <StatusPage
      className={styles.root}
      data-ready={hydrated ? "" : undefined}
      suppressHydrationWarning
      backdropClassName="[mask-image:radial-gradient(ellipse_60%_70%_at_75%_50%,black_10%,transparent_75%)] max-lg:[mask-image:radial-gradient(ellipse_100%_50%_at_50%_80%,black_10%,transparent_75%)]"
      prelude={
        <script
          // Server: executable. Client: inert (React warns about rendering live scripts on the client).
          type={
            typeof window === "undefined" ? "text/javascript" : "text/plain"
          }
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: PENDING_SCRIPT }}
        />
      }
    >
      <Suspense fallback={<GenericNotFound />}>
        <NotFoundVariant hydrated={hydrated} />
      </Suspense>
    </StatusPage>
  );
}

function subscribeToHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function NotFoundVariant({ hydrated }: { hydrated: boolean }) {
  const pathname = usePathname();
  const browserPath = useSyncExternalStore(
    subscribeToHistory,
    () => window.location.pathname,
    () => null,
  );
  // The page is prerendered for `/not-found`; only trust the pathname once we're in the browser. If
  // the router still reports the rewrite target, fall back to the address bar.
  const path = pathname === "/not-found" ? browserPath : pathname;
  const slug = hydrated ? slugFromPath(path) : null;
  return slug ? <ClaimSlug slug={slug} /> : <GenericNotFound />;
}

function ClaimSlug({ slug }: { slug: string }) {
  const host = siteInfo.baseUrl.host;

  return (
    <>
      <StatusText
        eyebrow="404 · Not claimed yet"
        markerClassName="bg-brand-ink"
        title={
          <>
            <span className="rounded-[0.14em] bg-brand [box-decoration-break:clone] px-[0.12em] font-mono text-[0.8em] font-semibold tracking-[-0.03em] break-all text-brand-foreground">
              /{slug}
            </span>{" "}
            is up for grabs.
          </>
        }
        actions={
          <>
            <Button asChild size="lg" className={cn(statusCta, "group")}>
              <Link href={`/dashboard?new=${encodeURIComponent(slug)}`}>
                Claim this link
                <ArrowRight className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={statusCta}>
              <Link href="/">Back to home</Link>
            </Button>
          </>
        }
      >
        There&rsquo;s no short link here, at least not yet. It may have expired,
        or nobody has claimed it. Make it yours in a few seconds.
      </StatusText>

      <div
        aria-hidden="true"
        className="relative mx-auto w-full max-w-md select-none lg:mr-0"
      >
        <div className="absolute inset-0 translate-x-1.5 translate-y-2.5 rotate-[1.75deg] rounded-[1.75rem] bg-brand sm:translate-x-3.5 sm:translate-y-3.5 sm:rotate-[2.5deg]" />
        <div className="relative rounded-[1.75rem] border bg-card p-5 shadow-lift sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Short link
            </span>
            <span className="flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium">
              <Check className="size-3.5 text-success" strokeWidth={2.5} />
              Available
            </span>
          </div>
          <p className="mt-3 rounded-xl border-2 border-dashed border-foreground/25 bg-background px-4 py-3.5 font-mono text-base break-all sm:text-lg">
            <span className="text-muted-foreground">{host}/</span>
            <span className="font-semibold">{slug}</span>
            <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] animate-blink rounded-full bg-brand-ink" />
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col items-end gap-[3px]">
                <span className="h-0.5 w-3 rounded-full bg-brand-ink/70" />
                <span className="h-0.5 w-5 rounded-full bg-brand-ink" />
                <span className="h-0.5 w-2.5 rounded-full bg-brand-ink/70" />
              </div>
              <LogoMark className="h-5" />
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Waiting for a destination…
          </p>
        </div>
      </div>
    </>
  );
}

function GenericNotFound() {
  return (
    <>
      <StatusText
        eyebrow="404 · Page not found"
        markerClassName="bg-brand-ink"
        title="This page has gone into its shell."
        actions={
          <>
            <Button asChild size="lg" className={statusCta}>
              <Link href="/">
                <ArrowLeft />
                Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={statusCta}>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </>
        }
      >
        We couldn&rsquo;t find what you were looking for. If you followed a
        short link, it may have expired or been deleted.
      </StatusText>

      <div
        aria-hidden="true"
        className="flex items-center justify-center font-display text-[8rem] leading-none font-extrabold tracking-[-0.06em] select-none sm:text-[11rem] lg:justify-end"
      >
        <span>4</span>
        <LogoMark className="mx-[0.06em] h-[0.62em] translate-y-[0.06em]" />
        <span>4</span>
      </div>
    </>
  );
}
