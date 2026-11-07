import { buttonVariants } from "@/components/ui/button";
import { linksHref, type LinkListQuery } from "@/lib/link-list";
import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { LinksNavLink } from "./links-provider";

/** 1 … 4 5 6 … 12 */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const items: (number | "gap")[] = [1];
  if (start > 2) items.push("gap");
  for (let current = start; current <= end; current++) items.push(current);
  if (end < totalPages - 1) items.push("gap");
  items.push(totalPages);
  return items;
}

const pageButton = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "w-auto min-w-9 px-2.5 text-muted-foreground tabular-nums hover:text-foreground max-md:size-10",
);

export function LinksPagination({
  page,
  totalPages,
  perPage,
  query,
  status,
}: LinkListQuery & { totalPages: number }) {
  const href = (target: number) =>
    linksHref({ status, page: target, perPage, query }, "links");
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const step = (direction: "previous" | "next") => {
    const enabled = direction === "previous" ? hasPrevious : hasNext;
    const Icon = direction === "previous" ? ChevronLeftIcon : ChevronRightIcon;
    const label = direction === "previous" ? "Previous" : "Next";
    const className = cn(
      buttonVariants({ variant: "outline", size: "sm" }),
      "h-9 gap-1 rounded-lg bg-card max-md:h-10",
      direction === "previous" ? "pr-3 pl-2" : "pr-2 pl-3",
    );
    const content = (
      <>
        {direction === "previous" && <Icon aria-hidden />}
        <span>{label}</span>
        {direction === "next" && <Icon aria-hidden />}
      </>
    );

    return enabled ? (
      <LinksNavLink
        href={href(direction === "previous" ? page - 1 : page + 1)}
        rel={direction === "previous" ? "prev" : "next"}
        aria-label={`${label} page`}
        className={className}
      >
        {content}
      </LinksNavLink>
    ) : (
      // A link with no target: announced as a disabled link, and not focusable.
      <span
        role="link"
        aria-disabled="true"
        aria-label={`${label} page`}
        className={cn(className, "pointer-events-none opacity-45")}
      >
        {content}
      </span>
    );
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center gap-1.5 max-sm:w-full max-sm:justify-between"
    >
      {step("previous")}
      <ul className="hidden items-center gap-0.5 sm:flex">
        {pageItems(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="w-6 text-center text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  aria-label={`Page ${item}`}
                  className={cn(
                    pageButton,
                    "border bg-card font-semibold text-foreground shadow-xs hover:bg-card",
                  )}
                >
                  {item}
                </span>
              ) : (
                <LinksNavLink
                  href={href(item)}
                  aria-label={`Page ${item}`}
                  className={pageButton}
                >
                  {item}
                </LinksNavLink>
              )}
            </li>
          ),
        )}
      </ul>
      <span className="px-2 text-sm text-muted-foreground tabular-nums sm:hidden">
        <span className="sr-only">Page </span>
        {page} / {totalPages}
      </span>
      {step("next")}
    </nav>
  );
}
