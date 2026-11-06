import { ExternalLink } from "@/components/layout/external-link";
import { GitHubIcon } from "@/components/layout/github-icon";
import { Button } from "@/components/ui/button";
import { siteInfo } from "@/lib/site";
import { ArrowUpRight } from "lucide-react";
import { ShellBackdrop } from "./shell-backdrop";

const STACK = [
  "Next.js",
  "React",
  "Drizzle",
  "Neon Postgres",
  "Upstash Redis",
  "Clerk",
  "Tailwind CSS",
];

export function OpenSource() {
  const repo = siteInfo.repoUrl.replace(/^https:\/\//, "");

  return (
    <section
      aria-labelledby="oss-title"
      className="container-page py-20 sm:py-28"
    >
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16 lg:px-16 dark:bg-card dark:text-card-foreground dark:ring-1 dark:ring-border">
        <ShellBackdrop
          latticeClassName="bg-brand/25 dark:bg-brand/15"
          className="[mask-image:radial-gradient(ellipse_70%_90%_at_100%_0%,black,transparent_70%)]"
        />

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.12em] uppercase opacity-75">
              <span
                aria-hidden="true"
                className="size-2 rotate-45 rounded-[2px] bg-brand"
              />
              Open source · MIT
            </p>
            <h2
              id="oss-title"
              className="mt-4 font-display text-[2rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-5xl"
            >
              Read every line. Run&nbsp;your&nbsp;own.
            </h2>
            <p className="mt-5 max-w-lg text-lg/relaxed text-pretty opacity-80">
              Shurtle is MIT licensed from shell to tail. Fork it, put it on
              your own domain, and bring your own database, Redis and Clerk
              keys.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[25rem]:flex-row">
              <Button
                asChild
                variant="brand"
                size="lg"
                className="h-12 rounded-xl px-6 text-base"
              >
                <ExternalLink href={siteInfo.repoUrl}>
                  <GitHubIcon />
                  View source
                </ExternalLink>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 rounded-xl border border-current/20 px-6 text-base text-current hover:bg-current/8 hover:text-current dark:hover:bg-current/8"
              >
                <ExternalLink href={siteInfo.releasesUrl}>
                  Release notes
                  <ArrowUpRight className="opacity-70" />
                </ExternalLink>
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl bg-black/25 ring-1 ring-white/10 dark:bg-black/35">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[0.6875rem] opacity-70">
                <span>~/code</span>
                <span>zsh</span>
              </div>
              <pre className="px-4 py-4 font-mono text-[0.8125rem]/[1.85] [overflow-wrap:anywhere] whitespace-pre-wrap sm:px-5">
                <code>
                  <span className="text-brand select-none">$ </span>git clone
                  https://{repo}.git{"\n"}
                  <span className="text-brand select-none">$ </span>cd
                  shurtle-ts && pnpm install{"\n"}
                  <span className="opacity-70">
                    # add Postgres, Upstash and Clerk keys to .env.local
                  </span>
                  {"\n"}
                  <span className="text-brand select-none">$ </span>pnpm dev
                </code>
              </pre>
            </div>
            <ul aria-label="Built with" className="mt-6 flex flex-wrap gap-2">
              {STACK.map((name) => (
                <li
                  key={name}
                  className="rounded-full border border-current/15 px-3 py-1 text-xs font-medium opacity-85"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
