"use client";

import { Hint } from "@/components/hint";
import { RENEWAL_WINDOW_MS, linkLifecycle } from "@/lib/link-lifecycle";
import { cn } from "cn";
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatTimeLeft,
  getExpiryStatus,
} from "./format";
import { useNow } from "./time";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border text-xs font-medium whitespace-nowrap tabular-nums";
/** Calm states are plain text that inherits the surrounding size; only states needing attention get a pill. */
const quiet = "whitespace-nowrap text-muted-foreground tabular-nums";

/** In its last hour, a renewable link's pill turns from brand to warning. */
const URGENT_MS = 3_600_000;

/**
 * Expiry state: "Never", "Expires Dec 24", "Expires in 3 days" (warning), "Renewable · 17h left"
 * (expired, slug still reserved for its owner) or "Expired Nov 13".
 */
export function ExpiryBadge({
  expiresAt,
  archived = false,
  compact = false,
  className,
}: {
  expiresAt: Date | string | null;
  /** Released early (see link-lifecycle.ts): never renewable. */
  archived?: boolean;
  /** Smaller pill for dense layouts. */
  compact?: boolean;
  className?: string;
}) {
  const base = cn(pill, compact ? "h-5 px-2" : "h-6 px-2.5");
  const { now, hydrated } = useNow();
  const date = expiresAt === null ? null : new Date(expiresAt);
  const lifecycle = linkLifecycle({ expiresAt: date, archived }, now);
  const title = date && hydrated ? formatDateTime(date) : undefined;

  if (lifecycle.state === "renewable") {
    const left = lifecycle.releasesAt.getTime() - now;
    const urgent = left < URGENT_MS;
    return (
      <Hint
        content={
          hydrated
            ? `Expired ${formatDateTime(lifecycle.expiresAt)}. Renew it by ${formatDateTime(lifecycle.releasesAt)} to keep the slug; after that, anyone can claim it.`
            : undefined
        }
      >
        <span
          className={cn(
            base,
            "text-foreground",
            urgent
              ? "border-warning/45 bg-warning/12"
              : "border-brand-ink/25 bg-brand-soft/70 dark:border-brand-ink/30 dark:bg-brand-soft/35",
            className,
          )}
        >
          <RenewalRing
            fraction={left / RENEWAL_WINDOW_MS}
            className={urgent ? "text-warning" : "text-brand-ink"}
          />
          Renewable
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <span className="sr-only">,</span>
          {formatTimeLeft(left)} left
        </span>
      </Hint>
    );
  }

  const status = getExpiryStatus(date, now);
  switch (status.kind) {
    case "never":
      return <span className={cn(quiet, className)}>Never</span>;
    case "expired": {
      // Muted, not alarming: expiring is the intended end of a link's life. The date says when.
      const withYear =
        new Date(now).getUTCFullYear() !== status.expiresAt.getUTCFullYear();
      return (
        <Hint
          content={
            title && `Expired ${title}. Its slug is no longer reserved for you.`
          }
        >
          <span
            className={cn(
              base,
              "border-border bg-muted text-muted-foreground",
              className,
            )}
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-muted-foreground/60"
            />
            Expired{" "}
            {formatDate(status.expiresAt, {
              timeZone: hydrated ? undefined : "UTC",
              withYear,
            })}
          </span>
        </Hint>
      );
    }
    case "soon":
      return (
        <Hint content={title}>
          <span
            className={cn(
              base,
              "border-warning/40 bg-warning/12 text-foreground",
              className,
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-warning" />
            Expires {formatRelative(status.expiresAt, now)}
          </span>
        </Hint>
      );
    case "later":
      return (
        <Hint content={title}>
          <span className={cn(quiet, className)}>
            Expires{" "}
            {formatDate(status.expiresAt, {
              timeZone: hydrated ? undefined : "UTC",
            })}
          </span>
        </Hint>
      );
  }
}

/** A small ring that drains as a renewal window runs out. `fraction` is the share of time left. */
export function RenewalRing({
  fraction,
  className,
}: {
  fraction: number;
  className?: string;
}) {
  const circumference = 2 * Math.PI * 5;
  const left = Math.min(1, Math.max(0, fraction));
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      className={cn("size-3.5 shrink-0 -rotate-90", className)}
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="2.25"
      />
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - left)}
        className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}
