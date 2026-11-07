import { Skeleton } from "@/components/ui/skeleton";
import {
  bucketKey,
  type AnalyticsWindow,
  type Bucket,
  type ClicksOverTime as ClicksOverTimeData,
} from "@/lib/analytics";
import { ClicksOverTimePlot } from "./clicks-over-time-plot";
import { CardPill, SectionCard, SectionSkeleton } from "./section-card";

const TITLE = "Clicks over time";

function pillText(bucket: Bucket) {
  return `${bucket === "hour" ? "Hourly" : "Daily"} · UTC`;
}

export async function ClicksOverTime({
  data,
  window,
  createdAt,
}: {
  data: Promise<ClicksOverTimeData>;
  window: AnalyticsWindow;
  createdAt: Date;
}) {
  const { series } = await data;
  return (
    <SectionCard
      title={TITLE}
      aside={<CardPill>{pillText(window.bucket)}</CardPill>}
    >
      <div className="mt-6">
        <ClicksOverTimePlot
          series={series}
          bucket={window.bucket}
          range={window.range}
          createdBucket={bucketKey(createdAt, window.bucket)}
        />
      </div>
    </SectionCard>
  );
}

export function ClicksOverTimeSkeleton({ bucket }: { bucket: Bucket }) {
  return (
    <SectionSkeleton
      title={TITLE}
      aside={<CardPill>{pillText(bucket)}</CardPill>}
    >
      {/* Same height as the plot (chart + 24px x-axis) so nothing shifts when it streams in. */}
      <div className="mt-6 flex h-56 flex-col sm:h-64">
        <div className="relative mt-2 ml-9 flex flex-1 flex-col justify-between">
          <div className="border-t" />
          <div className="border-t" />
          <div className="border-t" />
          <Skeleton className="absolute inset-x-0 bottom-0 h-2/3 rounded-none rounded-t-lg opacity-60 [clip-path:polygon(0_80%,8%_62%,16%_70%,26%_45%,36%_55%,46%_30%,56%_42%,66%_20%,76%_36%,86%_14%,100%_28%,100%_100%,0_100%)]" />
        </div>
        <div className="ml-9 flex h-6 items-center justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </SectionSkeleton>
  );
}
