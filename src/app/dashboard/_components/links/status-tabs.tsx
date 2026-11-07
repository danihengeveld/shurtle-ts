"use client";

import { Badge } from "@/components/ui/badge";
import {
  linksHref,
  parseLinkListQuery,
  statusFromPath,
  type LinkStatus,
} from "@/lib/link-list";
import { cn } from "cn";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { formatCount } from "../format";

const OPTIONS: { value: LinkStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

/**
 * Active / Expired. Each status is its own route, so these are plain links: switching shows that
 * route's `loading.tsx` while the list loads, and keeps the search and page size (back to page 1).
 * Render inside <Suspense> (reads search params).
 */
export function StatusTabs({
  counts,
  className,
}: {
  counts: Record<LinkStatus, number>;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = statusFromPath(pathname);
  const { query, perPage } = parseLinkListQuery(
    current,
    Object.fromEntries(searchParams),
  );

  return (
    <nav
      aria-label="Link status"
      className={cn(
        "inline-flex h-10 w-fit items-center rounded-xl bg-muted p-1 dark:bg-input/40",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={linksHref({ status: option.value, query, perPage })}
            scroll={false}
            aria-current={active ? "page" : undefined}
            data-active={active || undefined}
            // text-muted-foreground: shadcn's default inactive color (foreground/60) misses AA contrast on paper.
            className="group/tab inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-active:bg-background data-active:text-foreground data-active:shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_var(--border)] dark:data-active:border-input dark:data-active:bg-input/30"
          >
            {option.label}
            <Badge
              variant="secondary"
              className="h-5 min-w-5 rounded-full px-1.5 text-muted-foreground tabular-nums group-data-active/tab:text-foreground"
            >
              {formatCount(counts[option.value])}
              <span className="sr-only">
                {" "}
                {counts[option.value] === 1 ? "link" : "links"}
              </span>
            </Badge>
          </Link>
        );
      })}
    </nav>
  );
}
