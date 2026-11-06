import { LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import styles from "./link-demo.module.css"

const STREAKS = [
  { width: "w-16 sm:w-24", offset: "ml-6" },
  { width: "w-24 sm:w-36", offset: "" },
  { width: "w-12 sm:w-20", offset: "ml-10" },
]

export function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="container-page pb-24 sm:pb-32">
      <div className="grid items-center gap-12 border-t border-border/70 pt-20 sm:pt-28 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          <h2
            id="cta-title"
            className="font-display text-[2.5rem] leading-[1] font-bold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            Make your next link seven characters{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.32em] -rotate-1 rounded-full bg-brand dark:bg-brand/35"
              />
              short.
            </span>
          </h2>
          <p className="mt-6 max-w-md text-lg/relaxed text-muted-foreground text-pretty">
            Sign in, paste, share. The turtle takes it from there, and it&rsquo;s quicker than it looks.
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 min-[25rem]:flex-row min-[25rem]:items-center">
            <Button asChild size="lg" variant="brand" className="group h-12 rounded-xl px-6 text-base">
              <Link href="/dashboard">
                Start shortening
                <ArrowRight className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
            >
              Already have links? Open your dashboard
            </Link>
          </div>
        </div>

        {/* The turtle, at full tilt. */}
        <div aria-hidden="true" className="flex items-center justify-center gap-3 lg:justify-end">
          <div className="flex flex-col items-end gap-3 sm:gap-4">
            {STREAKS.map((streak, i) => (
              <span key={i} className={cn(styles.speed, "h-1.5 rounded-full bg-brand-ink sm:h-2", streak.width, streak.offset)} />
            ))}
          </div>
          <LogoMark className="h-24 sm:h-32" />
        </div>
      </div>
    </section>
  )
}
