import { Logo } from "@/components/logo";
import { siteInfo } from "@/lib/site";
import { ArrowUpRight } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { ExternalLink } from "./external-link";
import { GitHubIcon } from "./github-icon";

/** The year changes rarely; cache it so the footer stays part of the static shell. */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

const linkClasses =
  "group inline-flex min-h-10 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-8";

export function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="container-page py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link
              href="/"
              className="-ml-1 inline-flex rounded-lg p-1 transition-opacity hover:opacity-80"
            >
              <Logo
                markClassName="h-6"
                className="[&>span:last-child]:text-xl"
              />
            </Link>
            <p className="mt-3 text-sm/relaxed text-pretty text-muted-foreground">
              {siteInfo.tagline} An open source URL shortener that anyone can
              run.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:flex sm:items-center sm:gap-x-6">
              <li>
                <Link href="/dashboard" className={linkClasses}>
                  Dashboard
                </Link>
              </li>
              <li>
                <ExternalLink href={siteInfo.repoUrl} className={linkClasses}>
                  <GitHubIcon className="size-3.5" />
                  Source
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href={siteInfo.releasesUrl}
                  className={linkClasses}
                >
                  Releases
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 opacity-60 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
                  />
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href={siteInfo.author.url}
                  className={linkClasses}
                >
                  Author
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 opacity-60 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
                  />
                </ExternalLink>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; <CurrentYear /> {siteInfo.author.name}. Open source under the{" "}
            <ExternalLink
              href={`${siteInfo.repoUrl}/blob/main/LICENSE`}
              className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
            >
              MIT License
            </ExternalLink>
            .
          </p>
          <ExternalLink
            href={siteInfo.releasesUrl}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 py-1 pr-2.5 pl-2 font-mono text-[0.6875rem] transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-brand-ink"
            />
            <span className="sr-only">Version </span>v{siteInfo.version}
          </ExternalLink>
        </div>
      </div>
    </footer>
  );
}
