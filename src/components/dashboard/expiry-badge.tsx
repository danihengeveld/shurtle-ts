"use client"

import { cn } from "@/lib/utils"
import { formatDate, formatDateTime, formatRelative, getExpiryStatus } from "./format"
import { useNow } from "./time"

const pill = "inline-flex items-center gap-1.5 rounded-full border text-xs font-medium whitespace-nowrap tabular-nums"
/** Calm states are plain text that inherits the surrounding size; only states needing attention get a pill. */
const quiet = "whitespace-nowrap text-muted-foreground tabular-nums"

/** Expiry state: "Never", "Expires Dec 24", "Expires in 3 days" (warning) or "Expired". */
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
    case "expired":
      return (
        <span
          title={title}
          className={cn(base, "border-destructive/25 bg-destructive/8 text-[color-mix(in_oklab,var(--destructive)_85%,black)] dark:bg-destructive/12 dark:text-[color-mix(in_oklab,var(--destructive)_80%,white)]", className)}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-destructive" />
          Expired
        </span>
      )
    case "soon":
      return (
        <span title={title} className={cn(base, "border-warning/40 bg-warning/12 text-foreground", className)}>
          <span aria-hidden className="size-1.5 rounded-full bg-warning" />
          Expires {formatRelative(status.expiresAt, now)}
        </span>
      )
    case "later":
      return (
        <span title={title} className={cn(quiet, className)}>
          Expires {formatDate(status.expiresAt, { timeZone: hydrated ? undefined : "UTC" })}
        </span>
      )
  }
}
