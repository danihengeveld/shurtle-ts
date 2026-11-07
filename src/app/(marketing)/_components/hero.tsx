import { ExternalLink } from "@/components/layout/external-link";
import { GitHubIcon } from "@/components/layout/github-icon";
import { Button } from "@/components/ui/button";
import { siteInfo } from "@/lib/site";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LinkDemo } from "./link-demo";
import { ShellBackdrop } from "@/components/shell-backdrop";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      <ShellBackdrop className="[mask-image:radial-gradient(ellipse_55%_65%_at_78%_45%,black_10%,transparent_75%)] max-lg:[mask-image:radial-gradient(ellipse_90%_45%_at_50%_75%,black_10%,transparent_75%)]" />

      <div className="container-page grid items-center gap-x-12 gap-y-14 pt-12 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-24 lg:pb-28">
        <div className="max-w-xl motion-safe:animate-fade-up">
          {/* The analytics, where every visitor looks first: straight into the demo. */}
          <Link
            href="/demo"
            className="group inline-flex max-w-full items-center gap-2.5 rounded-full border bg-card/80 py-1 pr-3.5 pl-1 text-sm shadow-soft backdrop-blur-sm transition-[border-color,box-shadow] outline-none hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-foreground">
              Analytics
            </span>
            <span className="truncate font-medium">
              Every click, on the map
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
            />
          </Link>

          <h1
            id="hero-title"
            className="mt-5 font-display text-[2.75rem] leading-[0.98] font-bold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            The turtle that{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                aria-hidden="true"
                className="absolute -inset-x-[0.1em] inset-y-[0.04em] -z-10 -rotate-[1.5deg] rounded-[0.14em] bg-brand"
              />
              <span className="text-brand-foreground">outruns</span>
            </span>{" "}
            the hare.
          </h1>

          <p className="mt-6 max-w-[34rem] text-lg/relaxed text-pretty text-muted-foreground">
            Shurtle turns sprawling URLs into short links that redirect before a
            single page renders. Pick your own slug, set an expiry, see where
            every click comes from, and self-host the whole thing if you like.
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[25rem]:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-xl px-6 text-base"
            >
              <Link href="/dashboard">
                Start shortening
                <ArrowRight className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-6 text-base"
            >
              <ExternalLink href={siteInfo.repoUrl}>
                <GitHubIcon />
                View on GitHub
              </ExternalLink>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {[
              "Open source, MIT",
              "Self-hostable",
              "Analytics for every link",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-1 rounded-full bg-current opacity-60"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <LinkDemo className="mx-auto max-w-[29rem] motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] lg:mr-0" />
      </div>
    </section>
  );
}
