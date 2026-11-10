"use client";

import { BROWSE_LIST, listChange } from "@/components/view-transitions";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  ViewTransition,
} from "react";

/** What started a list navigation, so each control can show its own pending state. */
type NavigationSource = "search" | "list";

type NavigateOptions = {
  /** `replace` (default) for refinements like search; `push` for pages the user may want to go back to. */
  history?: "replace" | "push";
  /** Scroll to the top, or to the hash target when the href has one. Default: false. */
  scroll?: boolean;
  /** Default: `list`. */
  source?: NavigationSource;
};

type LinksContextValue = {
  /**
   * Navigate to another page / search / page size of the list inside a transition, so the current
   * list stays visible (dimmed by <LinksBusyRegion>) until the new one is ready. Switching status is
   * a route change instead, which shows the status route's `loading.tsx`.
   */
  navigate: (href: string, options?: NavigateOptions) => void;
  isNavigating: boolean;
  /** The source of the navigation in flight, if any. */
  pending: NavigationSource | null;
  /** Ids of links with a delete in flight (optimistic). */
  deleting: ReadonlySet<string>;
  /** Must be called inside a transition. */
  markDeleting: (id: string) => void;
};

const LinksContext = createContext<LinksContextValue | null>(null);

export function useLinks() {
  const context = use(LinksContext);
  if (!context) throw new Error("useLinks must be used inside <LinksProvider>");
  return context;
}

const NO_IDS: ReadonlySet<string> = new Set();

/** Lives in the dashboard layout, so the search box (layout) and the list (page) share it. */
export function LinksProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [source, setSource] = useState<NavigationSource>("list");
  const [deleting, markDeleting] = useOptimistic(
    NO_IDS,
    (current, id: string) => new Set(current).add(id),
  );
  const restoreFocus = useRef(false);

  function navigate(
    href: string,
    {
      history = "replace",
      scroll = false,
      source = "list",
    }: NavigateOptions = {},
  ) {
    setSource(source);
    // The control that started this (a pagination link, "Clear search"…) may not exist on the next
    // page; remember to put focus somewhere sensible if it disappears.
    restoreFocus.current =
      document.getElementById("links")?.contains(document.activeElement) ??
      false;
    startNavigation(() => {
      // Browsing the list, not changing it: rows don't animate in or out (see RowTransition).
      router[history](href, { scroll, transitionTypes: [BROWSE_LIST] });
    });
  }

  useEffect(() => {
    if (isNavigating || !restoreFocus.current) return;
    restoreFocus.current = false;
    if (!document.activeElement || document.activeElement === document.body) {
      document.getElementById("links-heading")?.focus({ preventScroll: true });
    }
  }, [isNavigating]);

  return (
    <LinksContext
      value={{
        navigate,
        isNavigating,
        pending: isNavigating ? source : null,
        deleting,
        markDeleting,
      }}
    >
      {children}
    </LinksContext>
  );
}

/**
 * A real link (prefetch, middle-click, works without JS) whose plain clicks go through `navigate`,
 * so the list dims while the next page loads instead of showing no feedback at all.
 */
export function LinksNavLink({
  href,
  onNavigate,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { navigate } = useLinks();
  return (
    <Link
      {...props}
      href={href}
      // Only runs for client-side navigations: modified clicks (new tab/window), downloads and
      // other targets keep their native behaviour.
      onNavigate={(event) => {
        onNavigate?.(event);
        event.preventDefault();
        navigate(href, { history: "push", scroll: href.includes("#") });
      }}
    />
  );
}

/** Wraps the list body: dims it (and marks it busy) while a search / page change is loading. */
export function LinksBusyRegion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isNavigating } = useLinks();
  return (
    <div
      aria-busy={isNavigating || undefined}
      data-busy={isNavigating || undefined}
      className={cn(
        "transition-opacity duration-200 data-busy:opacity-60 data-busy:delay-150",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A plain click anywhere on a row that isn't one of its controls opens `href`. Mouse and touch
 * only: keyboard and screen reader users get the row's real link (the slug). Clicks inside the
 * row's portalled menus and dialogs bubble here through React, so only clicks on the row's own
 * DOM count.
 */
function useRowClick(href: string) {
  const router = useRouter();
  return (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as Element;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !event.currentTarget.contains(target) ||
      target.closest("a, button, input, select, textarea, [role='button']") ||
      // Selecting text (a URL to copy) isn't a click.
      Boolean(window.getSelection()?.toString())
    ) {
      return;
    }
    router.push(href);
  };
}

/** A table row that opens `href` on click, and dims and becomes inert while its delete is in flight. */
export function LinkTableRow({
  id,
  href,
  className,
  children,
}: {
  id: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { deleting } = useLinks();
  const onClick = useRowClick(href);
  const isDeleting = deleting.has(id);
  return (
    <RowTransition>
      <tr
        data-deleting={isDeleting || undefined}
        inert={isDeleting}
        onClick={onClick}
        className={cn("cursor-pointer", className)}
      >
        {children}
      </tr>
    </RowTransition>
  );
}

/**
 * A link joining the list rises in, one leaving fades out, and the rows around them glide to make
 * room. Only when the list itself changed (created, deleted, renewed, expired), not while browsing
 * it; a whole list arriving (another tab, the first load) sits in LinksPanel's boundary, so its
 * rows don't animate one by one.
 */
function RowTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={listChange("vt-row-enter")}
      exit={listChange("vt-row-exit")}
      update={listChange("vt-row-move")}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

export function LinkListItem({
  id,
  href,
  className,
  children,
}: {
  id: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { deleting } = useLinks();
  const onClick = useRowClick(href);
  const isDeleting = deleting.has(id);
  return (
    <RowTransition>
      <li
        data-deleting={isDeleting || undefined}
        inert={isDeleting}
        onClick={onClick}
        className={cn("cursor-pointer", className)}
      >
        {children}
      </li>
    </RowTransition>
  );
}
