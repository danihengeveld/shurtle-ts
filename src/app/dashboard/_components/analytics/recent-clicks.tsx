import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RECENT_CLICKS_PER_PAGE,
  analyticsHref,
  type AnalyticsRange,
  type RecentClick,
  type RecentClicks as RecentClicksData,
} from "@/lib/analytics";
import { cn } from "cn";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  SearchXIcon,
  SmartphoneIcon,
  TabletIcon,
  type LucideIcon,
} from "lucide-react";
import { formatCount } from "../format";
import { AgoTime } from "../time";
import { AnalyticsNavLink } from "./analytics-provider";
import { Flag, placeText } from "./place";
import {
  CardPill,
  SectionCard,
  SectionEmpty,
  SectionSkeleton,
} from "./section-card";

const TITLE = "Recent clicks";

const DEVICES: Record<
  NonNullable<RecentClick["device"]>,
  { icon: LucideIcon; name: string }
> = {
  mobile: { icon: SmartphoneIcon, name: "Phone" },
  tablet: { icon: TabletIcon, name: "Tablet" },
  desktop: { icon: MonitorIcon, name: "Desktop" },
  other: { icon: MonitorSmartphoneIcon, name: "Other device" },
};

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function Place({ click }: { click: RecentClick }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Flag country={click.country} />
      <span className="truncate">
        {placeText(click) ?? <Muted>Unknown location</Muted>}
      </span>
    </span>
  );
}

/** Referring site, "Direct", or "Unknown" for visits recorded before sources were. */
function Source({ click }: { click: RecentClick }) {
  if (click.device === null) return <Muted>Unknown</Muted>;
  if (click.referrer === null) return <Muted>Direct</Muted>;
  return <span className="truncate">{click.referrer}</span>;
}

function Device({
  click,
  className,
}: {
  click: RecentClick;
  className?: string;
}) {
  if (click.device === null) {
    return (
      <span
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          className,
        )}
      >
        <CircleHelpIcon aria-hidden className="size-4 shrink-0" />
        Unknown
      </span>
    );
  }
  const { icon: Icon, name } = DEVICES[click.device];
  const software = [click.browser, click.os].filter(Boolean).join(" · ");
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      {software ? (
        <>
          <span className="sr-only">{name}, </span>
          <span className="truncate">{software}</span>
        </>
      ) : (
        <span className="truncate">{name}</span>
      )}
    </span>
  );
}

const edge =
  "first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5 lg:first:pl-6 lg:last:pr-6";

function ClicksTable({
  clicks,
  first,
  last,
  total,
}: {
  clicks: RecentClick[];
  first: number;
  last: number;
  total: number;
}) {
  return (
    <Table className="hidden table-fixed md:table">
      <TableCaption className="sr-only">
        Recent clicks, newest first: {formatCount(first)} to {formatCount(last)}{" "}
        of {formatCount(total)}.
      </TableCaption>
      <colgroup>
        <col className="w-[22%]" />
        <col className="w-[30%]" />
        <col className="w-[22%]" />
        <col />
      </colgroup>
      <TableHeader className="bg-muted/45 dark:bg-muted/30">
        <TableRow className="border-t hover:bg-transparent">
          {["Time", "Location", "Source", "Device"].map((heading) => (
            <TableHead
              key={heading}
              scope="col"
              className={`px-3 text-xs text-muted-foreground ${edge}`}
            >
              {heading}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {clicks.map((click) => (
          <TableRow
            key={click.id}
            className="hover:bg-muted/40 dark:hover:bg-muted/25"
          >
            <TableCell className={`h-12 px-3 text-muted-foreground ${edge}`}>
              <AgoTime date={click.at} />
            </TableCell>
            <TableCell className={`px-3 ${edge}`}>
              <Place click={click} />
            </TableCell>
            <TableCell className={`px-3 ${edge}`}>
              <span className="flex min-w-0">
                <Source click={click} />
              </span>
            </TableCell>
            <TableCell className={`px-3 ${edge}`}>
              <Device click={click} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Stacked rows for phones (< md). */
function ClicksList({ clicks }: { clicks: RecentClick[] }) {
  return (
    <ItemGroup
      aria-label="Recent clicks, newest first"
      className="divide-y border-t md:hidden"
    >
      {clicks.map((click) => (
        <Item
          key={click.id}
          role="listitem"
          size="sm"
          className="flex-nowrap rounded-none px-4 sm:px-5"
        >
          <ItemMedia className="self-start! pt-0.5 text-base">
            <Flag country={click.country} />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle className="w-full min-w-0 font-normal">
              <span className="truncate">
                {placeText(click) ?? <Muted>Unknown location</Muted>}
              </span>
            </ItemTitle>
            <ItemDescription className="flex min-w-0 items-center gap-2 text-xs">
              {/* Browser · OS is short and always fits; a long referrer is what gets cut. */}
              <Device click={click} className="shrink-0" />
              <span
                aria-hidden
                className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60"
              />
              <span className="flex min-w-0 text-foreground">
                <span className="sr-only">from </span>
                <Source click={click} />
              </span>
            </ItemDescription>
          </ItemContent>
          <ItemActions className="self-start text-xs text-muted-foreground">
            <AgoTime date={click.at} />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

function PageButton({
  href,
  label,
  direction,
}: {
  /** Null when there's no page that way. */
  href: string | null;
  label: string;
  direction: "newer" | "older";
}) {
  const Icon = direction === "newer" ? ChevronLeftIcon : ChevronRightIcon;
  const content = (
    <>
      {direction === "newer" && <Icon aria-hidden />}
      {label}
      {direction === "older" && <Icon aria-hidden />}
    </>
  );
  return (
    <PaginationItem>
      {href ? (
        <Button asChild variant="outline" size="sm" className="max-sm:h-9">
          <AnalyticsNavLink href={href}>
            {content}
            <span className="sr-only"> clicks</span>
          </AnalyticsNavLink>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled className="max-sm:h-9">
          {content}
        </Button>
      )}
    </PaginationItem>
  );
}

export async function RecentClicks({
  data,
  range,
  basePath,
}: {
  data: Promise<RecentClicksData>;
  range: AnalyticsRange;
  /** The page's path, for the pagination links. */
  basePath: string;
}) {
  const { clicks, total, page, pageCount } = await data;
  const first = (page - 1) * RECENT_CLICKS_PER_PAGE + 1;
  const last = first + clicks.length - 1;

  if (total === 0) {
    return (
      <SectionCard title={TITLE}>
        <SectionEmpty
          icon={MousePointerClickIcon}
          title="No clicks in this range"
          className="min-h-40"
        >
          Every click on the link shows up here, newest first.
        </SectionEmpty>
      </SectionCard>
    );
  }

  if (clicks.length === 0) {
    return (
      <SectionCard title={TITLE}>
        <SectionEmpty
          icon={SearchXIcon}
          title="This page is empty"
          className="min-h-40"
        >
          There{" "}
          {pageCount === 1
            ? "is only 1 page"
            : `are only ${formatCount(pageCount)} pages`}{" "}
          of clicks in this range.
        </SectionEmpty>
        <Button asChild variant="outline" size="sm" className="mx-auto mb-2">
          <AnalyticsNavLink href={analyticsHref(basePath, { range })}>
            Back to the newest
          </AnalyticsNavLink>
        </Button>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={TITLE}
      aside={<CardPill>Newest first</CardPill>}
      bleed
      contentClassName="mt-4"
    >
      <ClicksTable clicks={clicks} first={first} last={last} total={total} />
      <ClicksList clicks={clicks} />

      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5 lg:px-6">
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">
            {formatCount(first)}–{formatCount(last)}
          </span>{" "}
          of {formatCount(total)}
        </p>
        {pageCount > 1 && (
          <Pagination
            aria-label="Recent clicks pages"
            className="mx-0 w-auto justify-end"
          >
            <PaginationContent className="gap-2">
              <PageButton
                direction="newer"
                label="Newer"
                href={
                  page > 1
                    ? analyticsHref(basePath, { range, page: page - 1 })
                    : null
                }
              />
              <PageButton
                direction="older"
                label="Older"
                href={
                  page < pageCount
                    ? analyticsHref(basePath, { range, page: page + 1 })
                    : null
                }
              />
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </SectionCard>
  );
}

export function RecentClicksSkeleton() {
  return (
    <SectionSkeleton title={TITLE} bleed>
      <div className="mt-4">
        <div className="hidden h-10 border-y bg-muted/45 md:block dark:bg-muted/30" />
        <div className="divide-y border-b max-md:border-t">
          {Array.from({ length: RECENT_CLICKS_PER_PAGE }, (_, index) => (
            <div
              key={index}
              className="flex h-16 items-center gap-6 px-4 sm:px-5 md:h-12 lg:px-6"
            >
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="hidden h-3.5 w-24 md:block" />
              <Skeleton className="hidden h-3.5 w-28 md:block" />
            </div>
          ))}
        </div>
        <div className="h-14" />
      </div>
    </SectionSkeleton>
  );
}
