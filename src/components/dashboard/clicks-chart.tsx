import { Skeleton } from "@/components/ui/skeleton"
import { ClicksChartPlot } from "./clicks-chart-plot"
import { formatCount } from "./format"

const card = "flex flex-col rounded-2xl border bg-card p-4 shadow-soft sm:p-5 lg:p-6"

function ChartHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[13px] font-medium text-muted-foreground">Clicks · last 30 days</h3>
        {children}
      </div>
      <p className="mt-0.5 hidden rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground sm:block">Daily · UTC</p>
    </div>
  )
}

export function ClicksChart({ daily }: { daily: { date: string; clicks: number }[] }) {
  const total = daily.reduce((sum, day) => sum + day.clicks, 0)

  return (
    <section aria-label="Clicks in the last 30 days" className={card}>
      <ChartHeader>
        <p className="mt-2 font-display text-[2rem] leading-none font-semibold tracking-tight tabular-nums">
          {formatCount(total)}
        </p>
      </ChartHeader>
      <div className="mt-auto pt-8">
        <ClicksChartPlot data={daily} />
      </div>
    </section>
  )
}

export function ClicksChartSkeleton() {
  return (
    <div aria-hidden className={card}>
      <ChartHeader>
        <Skeleton className="mt-2 h-8 w-20" />
      </ChartHeader>
      <div className="mt-auto pt-8">
        <div className="relative flex h-40 flex-col justify-between sm:h-48">
          <div className="border-t" />
          <div className="border-t border-border/70" />
          <div className="border-t" />
          <Skeleton className="absolute inset-x-0 bottom-0 h-2/3 rounded-none rounded-t-lg opacity-60 [clip-path:polygon(0_70%,10%_55%,22%_62%,35%_40%,48%_48%,60%_25%,72%_38%,85%_15%,100%_30%,100%_100%,0_100%)]" />
        </div>
        <div className="mt-2.5 flex h-[16.5px] items-center justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  )
}
