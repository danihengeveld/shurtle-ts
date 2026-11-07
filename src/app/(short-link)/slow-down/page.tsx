import { LogoMark } from "@/components/logo";
import styles from "./breather.module.css";
import { ShellBackdrop } from "@/components/shell-backdrop";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { RotateCw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Slow down",
  description:
    "Too many short links opened in a short time. Wait a minute and try again.",
  robots: { index: false },
};

/**
 * Shown by the proxy (rewrite, HTTP 429) when a visitor opens too many short links in a minute.
 * The browser URL is still the short link, so "Try again" simply reloads it.
 */
export default function SlowDownPage() {
  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden">
      <ShellBackdrop className="[mask-image:radial-gradient(ellipse_55%_70%_at_75%_50%,black_10%,transparent_75%)] max-lg:[mask-image:radial-gradient(ellipse_100%_50%_at_50%_85%,black_10%,transparent_75%)]" />
      <div className="container-page grid items-center gap-x-12 gap-y-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            <span
              aria-hidden="true"
              className="size-2 rotate-45 rounded-[2px] bg-warning"
            />
            429 · Too many requests
          </p>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.02] font-bold tracking-[-0.04em] text-balance sm:text-6xl">
            Even turtles need a breather.
          </h1>
          <p className="mt-6 max-w-lg text-lg/relaxed text-pretty text-muted-foreground">
            You&rsquo;ve opened quite a few short links in the last minute, so
            we&rsquo;re pausing for a moment to keep things fair for everyone.
            Wait about a minute, then try again. Your link will still be here.
          </p>
          <div className="mt-9 flex flex-col gap-3 min-[25rem]:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl px-6 text-base"
            >
              {/* An empty href reloads the current URL, i.e. the short link that was rate limited. */}
              <a href="">
                <RotateCw />
                Try again
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-6 text-base"
            >
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>

        <div aria-hidden="true" className="flex justify-center lg:justify-end">
          <div className="relative grid size-64 place-items-center sm:size-72">
            <svg
              viewBox="0 0 120 120"
              className="absolute inset-0 size-full -rotate-90"
            >
              <circle
                cx="60"
                cy="60"
                r="54"
                pathLength={100}
                fill="none"
                strokeWidth="3"
                className="stroke-border"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                pathLength={100}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                className={cn(styles.ring, "stroke-brand-ink")}
              />
            </svg>
            <div className="flex flex-col items-center">
              <div className="relative">
                <LogoMark
                  className={cn(styles.breathe, "h-20 origin-bottom sm:h-24")}
                />
                <div className="absolute -top-7 -right-3 flex gap-0.5 font-display text-lg font-bold text-muted-foreground">
                  <span className={styles.z}>z</span>
                  <span className={cn(styles.z, "-translate-y-2 text-sm")}>
                    z
                  </span>
                  <span className={cn(styles.z, "-translate-y-4 text-xs")}>
                    z
                  </span>
                </div>
              </div>
              <span className="mt-4 font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                ~1 minute
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
