"use client"

import { Hint } from "@/components/hint"
import { cn } from "cn"
import { createContext, use, useSyncExternalStore } from "react"
import { formatDate, formatDateTime, formatRelative } from "./format"

/*
 * Hydration-safe time rendering.
 *
 * The server renders time-dependent text against a `now` timestamp it passes down (via
 * <ServerNowProvider>) and formats absolute dates in UTC. The first client render reuses the
 * exact same inputs, so the markup matches. After hydration, components read the browser clock
 * (refreshed every 30 s) and the viewer's time zone instead.
 */

const ServerNowContext = createContext<number | null>(null)

export function ServerNowProvider({ now, children }: { now: number; children: React.ReactNode }) {
  return <ServerNowContext value={now}>{children}</ServerNowContext>
}

let clientNow = 0
const listeners = new Set<() => void>()
let interval: ReturnType<typeof setInterval> | undefined

function tick() {
  clientNow = Date.now()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    clientNow = Date.now()
    interval = setInterval(tick, 30_000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearInterval(interval)
  }
}

function getSnapshot() {
  if (clientNow === 0) clientNow = Date.now()
  return clientNow
}

const getServerSnapshot = () => null

/**
 * `{ now, hydrated }`: before hydration `now` is the server's timestamp and `hydrated` is false;
 * afterwards it is the (ticking) browser clock.
 */
export function useNow() {
  const serverNow = use(ServerNowContext)
  const clientValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (clientValue !== null) return { now: clientValue, hydrated: true }
  return { now: serverNow ?? 0, hydrated: false }
}

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value
}

/** "3 days ago", with the exact local date & time on hover. */
export function RelativeTime({ date, className }: { date: Date | string; className?: string }) {
  const { now, hydrated } = useNow()
  const value = toDate(date)
  const label = now ? formatRelative(value, now) : formatDate(value, { timeZone: "UTC", withYear: true })

  return (
    <Hint content={hydrated ? formatDateTime(value) : undefined}>
      <time dateTime={value.toISOString()} className={cn("whitespace-nowrap", className)}>
        {label}
      </time>
    </Hint>
  )
}

/** "Nov 6" (or "Nov 6, 2027" outside the current year) in the viewer's time zone once hydrated. */
export function LocalDate({ date, className }: { date: Date | string; className?: string }) {
  const { now, hydrated } = useNow()
  const value = toDate(date)
  const timeZone = hydrated ? undefined : "UTC"
  const withYear = new Date(now).getUTCFullYear() !== value.getUTCFullYear()

  return (
    <Hint content={hydrated ? formatDateTime(value) : undefined}>
      <time dateTime={value.toISOString()} className={cn("whitespace-nowrap", className)}>
        {formatDate(value, { timeZone, withYear })}
      </time>
    </Hint>
  )
}
