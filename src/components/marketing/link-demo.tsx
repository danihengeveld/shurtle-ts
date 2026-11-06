import { LogoMark } from "@/components/logo"
import { siteInfo } from "@/lib/site"
import { cn } from "cn"
import { CalendarClock, Check, Copy, MousePointerClick } from "lucide-react"
import styles from "./link-demo.module.css"

const LONG_URL = {
  scheme: "https://",
  host: "www.example.com",
  path: "/collections/summer-2026/linen-overshirt-sand",
  query:
    "?variant=44821&utm_source=newsletter&utm_medium=email&utm_campaign=september_drop",
}
const LONG_URL_LENGTH = Object.values(LONG_URL).join("").length
const SLUG = "x7Kp2qR"

const labelClasses =
  "mb-2 flex items-baseline justify-between text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase"

/**
 * The hero's signature visual: a long URL collapsing into a short link. Purely decorative — the
 * caption and the surrounding copy say the same thing in text.
 */
export function LinkDemo({ className }: { className?: string }) {
  const host = siteInfo.baseUrl.host
  const shortLength = `${host}/${SLUG}`.length

  return (
    <figure className={cn("relative w-full", className)}>
      <div aria-hidden="true" className="relative select-none">
        {/* Lime slab peeking out behind the card. */}
        <div className="absolute inset-0 translate-x-1.5 translate-y-2.5 rotate-[1.75deg] rounded-[1.75rem] bg-brand sm:translate-x-4 sm:translate-y-4 sm:rotate-[2.5deg]" />

        <div className="relative rounded-[1.75rem] border bg-card p-4 shadow-lift sm:p-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <LogoMark className="h-[1.125rem]" />
              New shurtle
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              Ready
            </span>
          </div>

          <div className="mt-5">
            <div className={labelClasses}>
              <span>Destination</span>
              <span className="font-mono tracking-normal normal-case">
                {LONG_URL_LENGTH} chars
              </span>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-background px-3.5 py-3">
              <div className={cn(styles.scan, "absolute inset-0")} />
              <p
                className={cn(
                  "relative font-mono text-[0.75rem]/relaxed break-all sm:text-[0.8125rem]/relaxed",
                )}
              >
                <span className="text-muted-foreground">{LONG_URL.scheme}</span>
                <span className="text-foreground">{LONG_URL.host}</span>
                <span className="text-muted-foreground">{LONG_URL.path}</span>
                <span className="text-muted-foreground">{LONG_URL.query}</span>
              </p>
            </div>
          </div>

          {/* Connector: the turtle, carrying the link at speed. */}
          <div className="my-3.5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col items-end gap-[3px]">
                <span
                  className={cn(
                    styles.speed,
                    "h-0.5 w-3 rounded-full bg-brand-ink/70",
                  )}
                />
                <span
                  className={cn(
                    styles.speed,
                    "h-0.5 w-5 rounded-full bg-brand-ink",
                  )}
                />
                <span
                  className={cn(
                    styles.speed,
                    "h-0.5 w-2.5 rounded-full bg-brand-ink/70",
                  )}
                />
              </div>
              <LogoMark className="h-5" />
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div>
            <div className={labelClasses}>
              <span>Short link</span>
              <span className="font-mono tracking-normal normal-case">
                {shortLength} chars
              </span>
            </div>
            <div className="relative flex items-center gap-2 rounded-xl border-2 border-foreground bg-background py-1.5 pr-1.5 pl-3.5 dark:border-brand">
              <p className="min-w-0 flex-1 truncate font-mono text-[0.9375rem] sm:text-lg">
                <span className="text-muted-foreground">{host}/</span>
                <span
                  className={cn(styles.slug, "font-semibold text-foreground")}
                >
                  {SLUG}
                </span>
                <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] animate-blink rounded-full bg-brand-ink" />
              </p>
              <div className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground sm:size-10">
                <Copy className={cn(styles.copy, "absolute size-4")} />
                <Check
                  className={cn(styles.copied, "absolute size-4")}
                  strokeWidth={2.5}
                />
              </div>

              <div
                className={cn(
                  styles.toast,
                  "absolute -top-2.5 right-0 -translate-y-full",
                )}
              >
                <div className="flex items-center gap-1.5 rounded-full bg-foreground py-1.5 pr-3 pl-2 text-xs font-medium text-background shadow-lift">
                  <span className="grid size-4 place-items-center rounded-full bg-brand text-brand-foreground">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  Copied to clipboard
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              No expiry
            </span>
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="size-3.5" />0 clicks
            </span>
            <span className="ml-auto font-mono">just now</span>
          </div>
        </div>
      </div>

      <figcaption className="mt-8 text-center text-sm text-muted-foreground sm:mt-9">
        <span className="font-mono font-medium text-foreground">
          {LONG_URL_LENGTH}
        </span>{" "}
        characters in,{" "}
        <span className="font-mono font-medium text-foreground">
          {shortLength}
        </span>{" "}
        out. Same destination.
      </figcaption>
    </figure>
  )
}
