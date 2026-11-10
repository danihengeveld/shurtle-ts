import type { Shade } from "@/lib/analytics";
import { cn } from "cn";

/** Static class names, so Tailwind sees every one of them. Index = shade. */
export const SHADE_BACKGROUNDS = [
  "bg-scale-0",
  "bg-scale-1",
  "bg-scale-2",
  "bg-scale-3",
  "bg-scale-4",
  "bg-scale-5",
] as const satisfies Record<Shade, string>;

/**
 * "No clicks ▢ · Fewer ▤▤▤▤▤ More". For the eye only: the heatmap says the same in words (a
 * table).
 */
export function ShadeLegend({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-scale-0 ring-1 ring-border ring-inset" />
        No clicks
      </span>
      <span className="flex items-center gap-2">
        Fewer
        <span className="flex gap-0.5">
          {SHADE_BACKGROUNDS.slice(1).map((background) => (
            <span
              key={background}
              className={cn(
                "h-2.5 w-5 first:rounded-l-[3px] last:rounded-r-[3px]",
                background,
              )}
            />
          ))}
        </span>
        More
      </span>
    </div>
  );
}
