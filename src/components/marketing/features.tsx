import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"
import {
  ClicksVignette,
  ExpiryVignette,
  ProxyVignette,
  RateLimitVignette,
  SlugVignette,
  ThemeVignette,
} from "./vignettes"

interface FeatureCardProps {
  title: string
  children: React.ReactNode
  vignette: React.ReactNode
  className?: string
}

function FeatureCard({ title, children, vignette, className }: FeatureCardProps) {
  return (
    <li className={cn("flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft", className)}>
      <div
        aria-hidden="true"
        className="relative flex min-h-52 flex-1 items-center justify-center overflow-hidden border-b bg-muted/45 px-5 py-9 sm:px-8"
      >
        {vignette}
      </div>
      <div className="p-6 sm:p-7">
        <h3 className="font-display text-xl font-semibold tracking-[-0.025em]">{title}</h3>
        <p className="mt-2 text-[0.9375rem]/relaxed text-muted-foreground text-pretty">{children}</p>
      </div>
    </li>
  )
}

export function Features() {
  return (
    <section aria-labelledby="features-title" className="container-page pt-6 pb-20 sm:pt-10 sm:pb-28">
      <SectionHeading id="features-title" eyebrow="Inside the shell" title="Everything a link needs. Nothing it doesn’t.">
        A small, sharp feature set: quick for the people clicking, calm for the people sharing.
      </SectionHeading>

      <ul className="mt-12 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2 lg:grid-cols-6">
        <FeatureCard className="md:col-span-2 lg:col-span-4" title="Your slug, or ours." vignette={<SlugVignette />}>
          Claim a custom slug that people can remember, or let Shurtle roll a random seven-character one for you.
          Paste a link without <code className="font-mono text-[0.875em]">https://</code> and it gets fixed up.
        </FeatureCard>
        <FeatureCard className="lg:col-span-2" title="Links with a shelf life." vignette={<ExpiryVignette />}>
          Give a link an expiry date and it stops resolving once that day ends. A weekly cleanup clears the leftovers.
        </FeatureCard>
        <FeatureCard className="lg:col-span-2" title="Redirects before render." vignette={<ProxyVignette />}>
          Short links resolve in the Next.js proxy before any page code runs. Visits are logged afterwards, so they
          never slow the hop down.
        </FeatureCard>
        <FeatureCard className="md:col-span-2 lg:col-span-4" title="Every click, counted." vignette={<ClicksVignette />}>
          Each redirect bumps a counter. Your dashboard shows clicks per link, when the last one landed, and a chart
          of the past 30 days.
        </FeatureCard>
        <FeatureCard className="lg:col-span-3" title="A bouncer at the door." vignette={<RateLimitVignette />}>
          Rate limits on opening and creating links keep bots and runaway scripts from hammering your shurtles.
        </FeatureCard>
        <FeatureCard className="lg:col-span-3" title="Easy on the eyes." vignette={<ThemeVignette />}>
          Light, dark, or whatever your system prefers. Every screen is tuned for both, contrast included.
        </FeatureCard>
      </ul>
    </section>
  )
}
