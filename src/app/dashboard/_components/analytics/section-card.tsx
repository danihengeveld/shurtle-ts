import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

/** shadcn's Card, sized like the dashboard's cards: rounder, soft shadow, tighter on phones. */
const card = "min-w-0 gap-0 rounded-2xl py-4 shadow-soft sm:py-5 lg:py-6";
const inset = "px-4 sm:px-5 lg:px-6";

/** The small "Hourly · UTC" style label in a card's corner. */
export function CardPill({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
      {children}
    </p>
  );
}

function Header({
  title,
  aside,
  heading,
}: {
  title: string;
  aside?: React.ReactNode;
  heading: boolean;
}) {
  return (
    <CardHeader className={cn(inset, "gap-0")}>
      <CardTitle
        // CardTitle is a div: keep the page outline (h1 link → h2 sections) for screen readers.
        role={heading ? "heading" : undefined}
        aria-level={heading ? 2 : undefined}
        className="text-[13px] leading-5 font-medium text-muted-foreground"
      >
        {title}
      </CardTitle>
      {aside && <CardAction>{aside}</CardAction>}
    </CardHeader>
  );
}

/**
 * A titled card for one part of the analytics; `aside` sits opposite the title. Content that
 * should run to the card's edges (a table) passes `bleed`.
 */
export function SectionCard({
  title,
  aside,
  bleed = false,
  className,
  contentClassName,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  bleed?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(card, bleed && "pb-0!", className)}>
      <Header title={title} aside={aside} heading />
      <CardContent
        className={cn(
          !bleed && inset,
          "flex flex-1 flex-col",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

/** shadcn's Empty, sized for inside a card: what a section shows when it has nothing to show. */
export function SectionEmpty({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("min-h-48 gap-4 p-6 md:p-8", className)}>
      <EmptyHeader className="gap-1.5">
        <EmptyMedia
          variant="icon"
          className="size-10 rounded-xl text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
        >
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium">{title}</EmptyTitle>
        {children && (
          <EmptyDescription className="text-[13px] text-pretty">
            {children}
          </EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );
}

/** A section's loading state: the same card and title, so nothing moves when the data arrives. */
export function SectionSkeleton({
  title,
  aside,
  bleed = false,
  className,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  bleed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card aria-hidden className={cn(card, bleed && "pb-0!", className)}>
      <Header title={title} aside={aside} heading={false} />
      <CardContent className={cn(!bleed && inset, "flex flex-1 flex-col")}>
        {children}
      </CardContent>
    </Card>
  );
}
