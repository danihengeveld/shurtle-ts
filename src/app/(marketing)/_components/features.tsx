import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "./section-heading";
import {
  AnalyticsVignette,
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
  className?: string;
}

const card = "overflow-hidden rounded-3xl border bg-card shadow-soft";
const stage =
  "relative flex items-center justify-center overflow-hidden bg-muted/45";
const cardTitle = "font-display font-semibold tracking-[-0.025em]";
const cardCopy = "text-[0.9375rem]/relaxed text-pretty text-muted-foreground";

function FeatureCard({
  title,
  children,
  vignette,
  className,
}: FeatureCardProps) {
  return (
    <li className={cn(card, "flex flex-col", className)}>
      <div
        aria-hidden="true"
        className={cn(stage, "min-h-52 flex-1 border-b px-5 py-9 sm:px-8")}
      >
        {vignette}
      </div>
      <div className="p-6 sm:p-7">
        <h3 className={cn(cardTitle, "text-xl")}>{title}</h3>
        <p className={cn(cardCopy, "mt-2")}>{children}</p>
      </div>
    </li>
  );
}

/** The headline feature: a full-width card, words beside the picture, with a way into the demo. */
function AnalyticsCard({ className }: { className?: string }) {
  return (
    <li
      className={cn(
        card,
        "grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
        className,
      )}
    >
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          <span
            aria-hidden="true"
            className="size-2 rotate-45 rounded-[2px] bg-brand-ink"
          />
          Link analytics
        </p>
        <h3 className={cn(cardTitle, "mt-4 text-2xl text-balance sm:text-3xl")}>
          Every click, counted.
        </h3>
        <p className={cn(cardCopy, "mt-3")}>
          Every link gets its own page: clicks over time, the countries and
          cities they came from, the busiest hours, which sites send people and
          what they use.
        </p>
        <ul className="mt-5 space-y-2 text-sm">
          {[
            "Bots and link previews don’t count",
            "No IP addresses or fingerprints stored",
            "From the last 24 hours to all time",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand-ink"
                strokeWidth={2.5}
              />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-7">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="group h-11 rounded-xl px-5"
          >
            <Link href="/demo">
              Explore the demo
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          stage,
          "border-t px-5 py-8 max-lg:order-first max-lg:border-t-0 max-lg:border-b sm:px-10 lg:border-t-0 lg:border-l",
        )}
      >
        <AnalyticsVignette />
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
        <AnalyticsCard className="md:col-span-2 lg:col-span-6" />
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
          className="lg:col-span-2"
          title="A bouncer at the door."
          vignette={<RateLimitVignette />}
        >
          Rate limits on opening and creating links keep bots and runaway
          scripts from hammering your shurtles.
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-2"
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
