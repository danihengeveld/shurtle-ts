import { Hint } from "@/components/hint";
import { Skeleton } from "@/components/ui/skeleton";
import { busiest, shadeScale, type WeekHourClicks } from "@/lib/analytics";
import { cn } from "cn";
import { CalendarClockIcon } from "lucide-react";
import { formatHour, pluralize } from "../format";
import {
  CardPill,
  SectionCard,
  SectionEmpty,
  SectionSkeleton,
} from "./section-card";
import { SHADE_BACKGROUNDS, ShadeLegend } from "./shade-legend";

const TITLE = "When people click";
const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const hourName = formatHour;

/** Axis labels every 6 hours: "12a", "6a", "12p", "6p". */
function hourTick(hour: number) {
  return `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "a" : "p"}`;
}

const cell = "h-4 rounded-[3px] sm:h-6 lg:h-7";
const table =
  "w-full table-fixed border-separate border-spacing-[2px] sm:border-spacing-[3px]";

/**
 * Weekday × hour heatmap. It's a real table (weekdays are row headers, hours column headers), so
 * screen readers can move through it cell by cell; the colours are for the eye.
 */
export async function WeekHours({ data }: { data: Promise<WeekHourClicks[]> }) {
  const cells = await data;
  const clicks = new Map(
    cells.map((cell) => [`${cell.weekday}/${cell.hour}`, cell.clicks]),
  );
  const shade = shadeScale(clicks.values());
  const peak = busiest(cells);

  return (
    <SectionCard title={TITLE} aside={<CardPill>UTC</CardPill>}>
      {peak ? (
        <>
          <p className="mt-1 font-display text-lg font-semibold tracking-tight text-pretty">
            {peak.ties > 1
              ? "No clear busiest time yet"
              : `Busiest on ${WEEKDAYS[peak.top.weekday]}s around ${hourName(peak.top.hour)} UTC`}
          </p>
          <div className="-mx-0.5 mt-5 sm:-mx-1">
            <table className={table}>
              <caption className="sr-only">
                Clicks by weekday and hour, UTC
              </caption>
              <colgroup>
                <col className="w-8 sm:w-11" />
                {HOURS.map((hour) => (
                  <col key={hour} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <td />
                  {HOURS.map((hour) => (
                    <th
                      key={hour}
                      scope="col"
                      className="h-5 p-0 text-left align-bottom text-[10px] font-normal whitespace-nowrap text-muted-foreground tabular-nums"
                    >
                      {hour % 6 === 0 && (
                        <span aria-hidden>{hourTick(hour)}</span>
                      )}
                      <span className="sr-only">{hourName(hour)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((weekday, day) => (
                  <tr key={weekday}>
                    <th
                      scope="row"
                      className="p-0 pr-1 text-left text-[11px] font-normal text-muted-foreground"
                    >
                      <span aria-hidden>{weekday.slice(0, 3)}</span>
                      <span className="sr-only">{weekday}</span>
                    </th>
                    {HOURS.map((hour) => {
                      const count = clicks.get(`${day}/${hour}`) ?? 0;
                      return (
                        <td key={hour} className="p-0">
                          <Hint
                            content={`${weekday.slice(0, 3)} ${hourName(hour)} UTC · ${count === 0 ? "No clicks" : pluralize(count, "click")}`}
                          >
                            <div
                              className={cn(
                                cell,
                                SHADE_BACKGROUNDS[shade(count)],
                                count === 0 &&
                                  "ring-1 ring-border/60 ring-inset",
                              )}
                            >
                              <span className="sr-only">
                                {pluralize(count, "click")}
                              </span>
                            </div>
                          </Hint>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ShadeLegend className="mt-3" />
        </>
      ) : (
        <SectionEmpty icon={CalendarClockIcon} title="No clicks in this range">
          Once people click, this shows which days and hours are busiest.
        </SectionEmpty>
      )}
    </SectionCard>
  );
}

export function WeekHoursSkeleton() {
  return (
    <SectionSkeleton title={TITLE} aside={<CardPill>UTC</CardPill>}>
      <Skeleton className="mt-2 h-5 w-64 max-w-full" />
      <div className="-mx-0.5 mt-5 sm:-mx-1">
        <table aria-hidden className={table}>
          <colgroup>
            <col className="w-8 sm:w-11" />
            {HOURS.map((hour) => (
              <col key={hour} />
            ))}
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={25} className="h-5" />
            </tr>
            {WEEKDAYS.map((weekday) => (
              <tr key={weekday}>
                <td className="p-0 pr-1">
                  <Skeleton className="h-3 w-6" />
                </td>
                {HOURS.map((hour) => (
                  <td key={hour} className="p-0">
                    <Skeleton className={cn(cell, "opacity-60")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 h-4" />
    </SectionSkeleton>
  );
}
