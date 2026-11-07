import { Skeleton } from "@/components/ui/skeleton";
import type { SourceClicks } from "@/lib/analytics";
import { CornerDownRightIcon, GlobeIcon, UnplugIcon } from "lucide-react";
import { BarList, type BarItem } from "./bar-list";
import { SectionCard, SectionEmpty, SectionSkeleton } from "./section-card";

const TITLE = "Sources";

function toItem(source: SourceClicks): BarItem {
  switch (source.kind) {
    case "site":
      return {
        key: `site:${source.referrer}`,
        clicks: source.clicks,
        label: (
          <>
            <GlobeIcon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
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
            <CornerDownRightIcon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="truncate">Direct</span>
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
export async function Sources({
  data,
  total,
}: {
  data: Promise<SourceClicks[]>;
  /** All clicks in the range, for each source's share. */
  total: Promise<number>;
}) {
  const [sources, clicks] = await Promise.all([data, total]);
  const items = sources.map(toItem);
  // Unknown goes last, whatever its count: it isn't a source.
  const ordered = [
    ...items.filter((item) => !item.muted),
    ...items.filter((item) => item.muted),
  ];

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
            total={clicks}
            label="Clicks by source"
            noun="sources"
            className="mt-4"
          />
          {sources.some((source) => source.kind === "direct") && (
            <p className="mt-auto pt-4 text-xs text-pretty text-muted-foreground">
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
