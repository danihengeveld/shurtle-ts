import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { RotateCw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusPage,
  StatusText,
  statusCta,
} from "../../_components/status-view";
import styles from "./breather.module.css";

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
    <StatusPage>
      <StatusText
        eyebrow="429 · Too many requests"
        markerClassName="bg-warning"
        title="Even turtles need a breather."
        actions={
          <>
            <Button asChild size="lg" className={statusCta}>
              {/* An empty href reloads the current URL, i.e. the short link that was rate limited. */}
              <a href="">
                <RotateCw />
                Try again
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className={statusCta}>
              <Link href="/">Back to home</Link>
            </Button>
          </>
        }
      >
        You&rsquo;ve opened quite a few short links in the last minute, so
        we&rsquo;re pausing for a moment to keep things fair for everyone. Wait
        about a minute, then try again. Your link will still be here.
      </StatusText>

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
    </StatusPage>
  );
}
