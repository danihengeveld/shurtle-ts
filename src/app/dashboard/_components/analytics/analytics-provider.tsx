"use client";

import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, use, useTransition } from "react";

type AnalyticsContextValue = {
  /**
   * Go to another range or page of recent clicks inside a transition: the current numbers stay on
   * screen (dimmed by <AnalyticsBusyRegion>) until the new ones are ready, instead of skeletons.
   */
  navigate: (href: string, optimisticUpdate?: () => void) => void;
  isNavigating: boolean;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalyticsNavigation() {
  const context = use(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalyticsNavigation must be used inside <AnalyticsProvider>",
    );
  }
  return context;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();

  function navigate(href: string, optimisticUpdate?: () => void) {
    startNavigation(() => {
      // E.g. select the new range right away; reverts by itself if the navigation fails.
      optimisticUpdate?.();
      // Push: a range is worth going back to. Keep the scroll position: only the data changes.
      router.push(href, { scroll: false });
    });
  }

  return (
    <AnalyticsContext value={{ navigate, isNavigating }}>
      {children}
    </AnalyticsContext>
  );
}

/** Dims (and marks busy) the analytics while another range or page loads. */
export function AnalyticsBusyRegion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isNavigating } = useAnalyticsNavigation();
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

/** A real link (prefetch, middle-click, works without JS) whose plain clicks go through `navigate`. */
export function AnalyticsNavLink({
  href,
  onNavigate,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { navigate } = useAnalyticsNavigation();
  return (
    <Link
      {...props}
      href={href}
      scroll={false}
      onNavigate={(event) => {
        onNavigate?.(event);
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}
