import { LogoMark } from "@/components/logo"
import { siteInfo } from "@/lib/site"
import { cn } from "cn"
import { Archive, CalendarClock, Check, Moon, Shuffle, Sun } from "lucide-react"

/*
 * Miniature, static UI scenes for the feature bento. All decorative: each card's heading and copy
 * carry the meaning, so every vignette is aria-hidden by its container.
 */

const field = "flex h-10 min-w-0 flex-1 items-center rounded-lg border bg-card px-3 font-mono text-[0.8125rem] shadow-xs"
const miniLabel = "w-[4.75rem] shrink-0 text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase"

export function SlugVignette() {
  const host = siteInfo.baseUrl.host
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <span className={cn(miniLabel, "max-sm:hidden")}>Custom</span>
        <div className={cn(field, "border-foreground/25 ring-4 ring-brand/35 dark:border-brand/60 dark:ring-brand/15")}>
          <span className="truncate">
            <span className="text-muted-foreground">{host}/</span>
            <span className="font-semibold">launch-party</span>
          </span>
          <span className="ml-px h-4 w-0.5 shrink-0 animate-blink rounded-full bg-brand-ink" />
        </div>
        <span className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-success/12 px-2.5 text-xs font-medium text-foreground">
          <Check className="size-3.5 text-success" strokeWidth={2.5} />
          <span className="max-[25rem]:hidden">Available</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(miniLabel, "max-sm:hidden")}>Generated</span>
        <div className={field}>
          <span className="truncate">
            <span className="text-muted-foreground">{host}/</span>
            <span className="font-semibold">x7Kp2qR</span>
          </span>
        </div>
        <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground shadow-xs">
          <Shuffle className="size-3.5" />
        </span>
      </div>
    </div>
  )
}

export function ExpiryVignette() {
  return (
    <div className="w-full max-w-xs space-y-2.5">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-xs">
        <span className="size-2 shrink-0 rounded-full bg-success" />
        <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] font-medium">spring-sale</span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-warning/18 px-2 py-1 text-xs font-medium">
          <CalendarClock className="size-3.5" />
          Mar 31
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-dashed bg-card/50 px-3.5 py-3">
        <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
        <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-muted-foreground line-through decoration-muted-foreground/60">
          beta-invite
        </span>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Expired</span>
      </div>
      <p className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
        <Archive className="size-3" />
        Kept in your dashboard, clicks and all
      </p>
    </div>
  )
}

export function ProxyVignette() {
  return (
    <div className="w-full max-w-xs rounded-xl bg-primary p-4 font-mono text-[0.75rem]/[1.9] text-primary-foreground shadow-lift dark:bg-black/45 dark:text-foreground dark:ring-1 dark:ring-white/10">
      <div>
        <span className="text-brand">GET</span> /x7Kp2qR
      </div>
      <div className="text-primary-foreground/65 dark:text-foreground/60">
        <span aria-hidden="true">├─</span> proxy resolves slug
      </div>
      <div className="text-primary-foreground/65 dark:text-foreground/60">
        <span aria-hidden="true">├─</span> visit logged after
      </div>
      <div>
        <span className="text-primary-foreground/65 dark:text-foreground/60">└─</span>{" "}
        <span className="rounded bg-brand px-1 py-px font-semibold text-brand-foreground">307</span> example.com/…
      </div>
    </div>
  )
}

/** Illustrative 30-day series; not real data. */
const CLICKS = [3, 5, 4, 6, 8, 5, 7, 9, 6, 8, 11, 9, 7, 10, 12, 9, 13, 11, 10, 14, 12, 16, 13, 15, 18, 14, 17, 20, 16, 22]
const MAX_CLICKS = Math.max(...CLICKS)

export function ClicksVignette() {
  return (
    <div className="w-full max-w-lg">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[0.8125rem] font-semibold">x7Kp2qR</span>
        <span className="text-xs text-muted-foreground">Clicks · last 30 days</span>
      </div>
      <div className="relative mt-4 flex h-28 items-end gap-[3px] border-b border-foreground/15 pt-8 sm:gap-1">
        {CLICKS.map((value, i) => {
          const last = i === CLICKS.length - 1
          return (
            <span
              key={i}
              className={cn("relative flex-1 rounded-t-[3px]", last ? "bg-chart-1" : "bg-chart-1/35 dark:bg-chart-1/30")}
              style={{ height: `${(value / MAX_CLICKS) * 100}%` }}
            >
              {last && (
                <span className="absolute right-0 bottom-full mb-2 rounded-md bg-foreground px-2 py-1 text-[0.6875rem] font-medium whitespace-nowrap text-background shadow-soft">
                  Today · {value}
                </span>
              )}
            </span>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.625rem] text-muted-foreground">
        <span>30 days ago</span>
        <span>today</span>
      </div>
    </div>
  )
}

export function RateLimitVignette() {
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        <span>Opens this minute</span>
        <span className="font-mono tracking-normal">1 IP</span>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="h-8 flex-1 rounded-md bg-chart-1/80" />
        ))}
        <span className="h-8 flex-1 rounded-md border-2 border-dashed border-destructive/70 bg-destructive/10" />
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border bg-card p-3 shadow-soft">
        <span className="mt-0.5 rounded bg-destructive px-1.5 py-px font-mono text-[0.6875rem] font-semibold text-white dark:bg-destructive/15 dark:text-destructive">
          429
        </span>
        <span className="text-[0.8125rem]/snug">
          <span className="font-medium">Even turtles need a breather.</span>{" "}
          <span className="text-muted-foreground">Try again in a minute.</span>
        </span>
      </div>
    </div>
  )
}

const LIGHT = { bg: "oklch(0.986 0.005 106)", fg: "oklch(0.205 0.022 162)", line: "oklch(0.905 0.01 110)" }
const DARK = { bg: "oklch(0.158 0.013 162)", fg: "oklch(0.955 0.012 110)", line: "oklch(1 0 0 / 0.12)" }

function MiniScreen({ scheme, className }: { scheme: typeof LIGHT; className?: string }) {
  return (
    <div
      className={cn("w-36 rounded-xl p-3 shadow-lift ring-1 ring-black/5 sm:w-40", className)}
      style={{ backgroundColor: scheme.bg, color: scheme.fg }}
    >
      <div className="flex items-center gap-1.5">
        <LogoMark className="h-3.5" />
        <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: scheme.fg, opacity: 0.85 }} />
      </div>
      <div className="mt-3 space-y-1.5">
        <span className="block h-1.5 w-full rounded-full" style={{ backgroundColor: scheme.line }} />
        <span className="block h-1.5 w-4/5 rounded-full" style={{ backgroundColor: scheme.line }} />
      </div>
      <span className="mt-3 block h-5 w-16 rounded-md bg-brand" />
    </div>
  )
}

export function ThemeVignette() {
  return (
    <div className="relative flex h-full items-center justify-center py-2">
      <div className="relative">
        <MiniScreen scheme={LIGHT} className="-rotate-6" />
        <MiniScreen scheme={DARK} className="absolute top-5 left-16 rotate-3 sm:left-20" />
        <span className="absolute -top-3 -left-3 grid size-8 place-items-center rounded-full border bg-card shadow-soft">
          <Sun className="size-4" />
        </span>
        <span className="absolute -right-24 -bottom-7 grid size-8 place-items-center rounded-full border bg-card shadow-soft sm:-right-28">
          <Moon className="size-4" />
        </span>
      </div>
    </div>
  )
}
