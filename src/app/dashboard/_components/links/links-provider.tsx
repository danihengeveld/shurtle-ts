"use client";

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
  /** Slugs with a delete in flight (optimistic). */
  deleting: ReadonlySet<string>;
  /** Must be called inside a transition. */
  markDeleting: (slug: string) => void;
};

const LinksContext = createContext<LinksContextValue | null>(null);

export function useLinks() {
  const context = use(LinksContext);
  if (!context) throw new Error("useLinks must be used inside <LinksProvider>");
  return context;
}

const NO_SLUGS: ReadonlySet<string> = new Set();

/** Lives in the dashboard layout, so the search box (layout) and the list (page) share it. */
export function LinksProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [source, setSource] = useState<NavigationSource>("list");
  const [deleting, markDeleting] = useOptimistic(
    NO_SLUGS,
    (current, slug: string) => new Set(current).add(slug),
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
      router[history](href, { scroll });
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

/** A table row that dims and becomes inert while its delete is in flight. */
export function LinkTableRow({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { deleting } = useLinks();
  const isDeleting = deleting.has(slug);
  return (
    <tr
      data-deleting={isDeleting || undefined}
      inert={isDeleting}
      className={className}
    >
      {children}
    </tr>
  );
}

export function LinkListItem({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { deleting } = useLinks();
  const isDeleting = deleting.has(slug);
  return (
    <li
      data-deleting={isDeleting || undefined}
      inert={isDeleting}
      className={className}
    >
      {children}
    </li>
  );
}
