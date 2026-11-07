import { Skeleton } from "@/components/ui/skeleton";
import type { SourceClicks } from "@/lib/analytics";
import {
  CornerDownRightIcon,
  EllipsisIcon,
  GlobeIcon,
  UnplugIcon,
} from "lucide-react";
import { BarList, type BarItem } from "./bar-list";
import { SectionCard, SectionEmpty, SectionSkeleton } from "./section-card";

const TITLE = "Sources";
const icon = "size-3.5 shrink-0 text-muted-foreground";

function toItem(source: SourceClicks): BarItem {
  switch (source.kind) {
    case "site":
      return {
        key: `site:${source.referrer}`,
        clicks: source.clicks,
        label: (
          <>
            <GlobeIcon aria-hidden className={icon} />
            <span className="truncate">{source.referrer}</span>
          </>
        ),
      };
    case "direct":
      return {
        key: "direct",
        clicks: source.clicks,
        label: (
          <>
            <CornerDownRightIcon aria-hidden className={icon} />
            <span className="truncate">Direct</span>
          </>
        ),
      };
    case "other":
      return {
        key: "other",
        clicks: source.clicks,
        muted: true,
        label: (
          <>
            <EllipsisIcon aria-hidden className={icon} />
            <span className="truncate">Other sources</span>
          </>
        ),
      };
    case "unknown":
      return {
        key: "unknown",
        clicks: source.clicks,
        muted: true,
        label: <span className="truncate pl-5.5">Unknown</span>,
      };
  }
}

/** Which sites sent people, with direct visits as one source of their own. */
export async function Sources({ data }: { data: Promise<SourceClicks[]> }) {
  const sources = await data;
  const items = sources.map(toItem);
  // Other and unknown go last, whatever their counts: they aren't a single source.
  const ordered = [
    ...items.filter((item) => !item.muted),
    ...items.filter((item) => item.muted),
  ];
  // Shares of these rows' own total: they come from one query, so they always add up.
  const total = sources.reduce((sum, source) => sum + source.clicks, 0);

  return (
    <SectionCard title={TITLE}>
      {ordered.length === 0 ? (
        <SectionEmpty icon={UnplugIcon} title="No clicks in this range">
          The sites that send people here will show up once they do.
        </SectionEmpty>
      ) : (
        <>
          <BarList
            items={ordered}
            total={total}
            label="Clicks by source"
            noun={{ one: "source", other: "sources" }}
            className="mt-4"
          />
          {sources.some((source) => source.kind === "direct") && (
            <p className="mt-4 text-xs text-pretty text-muted-foreground">
              Direct: no referring site. Typed or pasted, bookmarked, or opened
              from an app or a site that doesn&apos;t say.
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}

export function SourcesSkeleton() {
  return (
    <SectionSkeleton title={TITLE}>
      <div className="mt-4 space-y-0.5">
        {[100, 64, 45, 30, 22, 14].map((width) => (
          <div key={width} className="flex h-9 items-center gap-3 px-2.5">
            <Skeleton className="h-3.5" style={{ width: `${width * 0.6}%` }} />
            <Skeleton className="ml-auto h-3.5 w-8" />
          </div>
        ))}
      </div>
    </SectionSkeleton>
  );
}
