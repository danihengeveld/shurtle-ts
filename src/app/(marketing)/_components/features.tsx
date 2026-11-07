import { cn } from "cn";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "./section-heading";
import {
  ClicksVignette,
  ExpiryVignette,
  ProxyVignette,
  RateLimitVignette,
  SlugVignette,
  ThemeVignette,
} from "./vignettes";

interface FeatureCardProps {
  title: string;
  children: React.ReactNode;
  vignette: React.ReactNode;
  /** A link below the description. */
  action?: React.ReactNode;
  className?: string;
}

function FeatureCard({
  title,
  children,
  vignette,
  action,
  className,
}: FeatureCardProps) {
  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="relative flex min-h-52 flex-1 items-center justify-center overflow-hidden border-b bg-muted/45 px-5 py-9 sm:px-8"
      >
        {vignette}
      </div>
      <div className="p-6 sm:p-7">
        <h3 className="font-display text-xl font-semibold tracking-[-0.025em]">
          {title}
        </h3>
        <p className="mt-2 text-[0.9375rem]/relaxed text-pretty text-muted-foreground">
          {children}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </li>
  );
}

export function Features() {
  return (
    <section
      aria-labelledby="features-title"
      className="container-page pt-6 pb-20 sm:pt-10 sm:pb-28"
    >
      <SectionHeading
        id="features-title"
        eyebrow="Inside the shell"
        title="Everything a link needs. Nothing it doesn’t."
      >
        A small, sharp feature set: quick for the people clicking, calm for the
        people sharing.
      </SectionHeading>

      <ul className="mt-12 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2 lg:grid-cols-6">
        <FeatureCard
          className="md:col-span-2 lg:col-span-4"
          title="Your slug, or ours."
          vignette={<SlugVignette />}
        >
          Claim a custom slug that people can remember, or let Shurtle roll a
          random seven-character one for you. Paste a link without{" "}
          <code className="font-mono text-[0.875em]">https://</code> and it gets
          fixed up.
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-2"
          title="Links with a shelf life."
          vignette={<ExpiryVignette />}
        >
          Give a link an expiry date and time and it stops resolving right then.
          Changed your mind? Renew it within 24 hours and it&rsquo;s back, slug
          and clicks and all.
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-2"
          title="Redirects before render."
          vignette={<ProxyVignette />}
        >
          Short links resolve in the Next.js proxy before any page code runs.
          Visits are logged afterwards, so they never slow the hop down.
        </FeatureCard>
        <FeatureCard
          className="md:col-span-2 lg:col-span-4"
          title="Every click, counted."
          vignette={<ClicksVignette />}
          action={
            <Link
              href="/demo"
              className="group inline-flex items-center gap-1 rounded-sm text-sm font-medium text-brand-ink underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              See a link&rsquo;s page with sample data
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
              />
            </Link>
          }
        >
          Every link gets its own page: clicks over time, a world map of where
          they came from, the busiest hours, which sites send people and what
          they use. Bots and link previews don&rsquo;t count.
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-3"
          title="A bouncer at the door."
          vignette={<RateLimitVignette />}
        >
          Rate limits on opening and creating links keep bots and runaway
          scripts from hammering your shurtles.
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-3"
          title="Easy on the eyes."
          vignette={<ThemeVignette />}
        >
          Light, dark, or whatever your system prefers. Every screen is tuned
          for both, contrast included.
        </FeatureCard>
      </ul>
    </section>
  );
}
