"use client"

import { Hint } from "@/components/hint"
import { cn } from "cn"
import { formatDate, formatDateTime, formatRelative, getExpiryStatus } from "./format"
import { useNow } from "./time"

const pill = "inline-flex items-center gap-1.5 rounded-full border text-xs font-medium whitespace-nowrap tabular-nums"
/** Calm states are plain text that inherits the surrounding size; only states needing attention get a pill. */
const quiet = "whitespace-nowrap text-muted-foreground tabular-nums"

/** Expiry state: "Never", "Expires Dec 24", "Expires in 3 days" (warning) or "Expired Nov 13". */
export function ExpiryBadge({
  expiresAt,
  compact = false,
  className,
}: {
  expiresAt: Date | string | null
  /** Smaller pill for dense layouts. */
  compact?: boolean
  className?: string
}) {
  const base = cn(pill, compact ? "h-5 px-2" : "h-6 px-2.5")
  const { now, hydrated } = useNow()
  const date = expiresAt === null ? null : new Date(expiresAt)
  const status = getExpiryStatus(date, now)
  const title = date && hydrated ? formatDateTime(date) : undefined

  switch (status.kind) {
    case "never":
      return (
        <span className={cn(quiet, className)}>Never</span>
      )
    case "expired": {
      // Muted, not alarming: expiring is the intended end of a link's life. The date says when.
      const withYear = new Date(now).getUTCFullYear() !== status.expiresAt.getUTCFullYear()
      return (
        <Hint content={title}>
          <span className={cn(base, "border-border bg-muted text-muted-foreground", className)}>
            <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/60" />
            Expired {formatDate(status.expiresAt, { timeZone: hydrated ? undefined : "UTC", withYear })}
          </span>
        </Hint>
      )
    }
    case "soon":
      return (
        <Hint content={title}>
          <span className={cn(base, "border-warning/40 bg-warning/12 text-foreground", className)}>
            <span aria-hidden className="size-1.5 rounded-full bg-warning" />
            Expires {formatRelative(status.expiresAt, now)}
          </span>
        </Hint>
      )
    case "later":
      return (
        <Hint content={title}>
          <span className={cn(quiet, className)}>
            Expires {formatDate(status.expiresAt, { timeZone: hydrated ? undefined : "UTC" })}
          </span>
        </Hint>
      )
  }
}
