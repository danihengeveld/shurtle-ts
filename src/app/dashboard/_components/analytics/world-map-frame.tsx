"use client";

import { percentOf } from "@/lib/analytics";
import { countryName } from "@/lib/countries";
import { cn } from "cn";
import { useRef, useState } from "react";
import { pluralize } from "../format";
import { Flag } from "./place";

type Hovered = { code: string; x: number; y: number };

/** Keeps the tooltip inside the map: half its width from either edge. */
const EDGE = 88;

/**
 * Pointer layer over the server-rendered map: shows the country under the pointer (or finger) with
 * its clicks. Mouse and touch only; the country list beside the map is the keyboard and screen
 * reader equivalent, so the ~175 shapes aren't tab stops.
 */
export function WorldMapFrame({
  clicks,
  total,
  className,
  children,
}: {
  /** Clicks per ISO alpha-2 code. */
  clicks: Record<string, number>;
  total: number;
  className?: string;
  children: React.ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Hovered | null>(null);

  function track(event: React.PointerEvent) {
    const shape = (event.target as Element).closest("[data-country]");
    const bounds = frame.current?.getBoundingClientRect();
    if (!shape || !bounds) {
      setHovered(null);
      return;
    }
    const code = shape.getAttribute("data-country")!;
    setHovered({
      code,
      x: Math.min(
        Math.max(event.clientX - bounds.left, EDGE),
        bounds.width - EDGE,
      ),
      y: event.clientY - bounds.top,
    });
  }

  const count = hovered ? (clicks[hovered.code] ?? 0) : 0;

  return (
    <div
      ref={frame}
      onPointerMove={track}
      onPointerDown={track}
      // A finger lifts right after tapping: keep that country shown until the next tap (outside
      // a country clears it). A mouse leaving the map clears it at once.
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") setHovered(null);
      }}
      // Scrolling the page with a finger that started on the map.
      onPointerCancel={() => setHovered(null)}
      className={cn("relative", className)}
    >
      {children}
      {hovered && (
        <div
          aria-hidden
          style={{ left: hovered.x, top: hovered.y }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl"
        >
          <p className="flex items-center gap-1.5 font-medium">
            <Flag country={hovered.code} />
            {countryName(hovered.code)}
          </p>
          <p className="mt-0.5 text-muted-foreground tabular-nums">
            {count === 0 ? (
              "No clicks"
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {pluralize(count, "click")}
                </span>{" "}
                · {percentOf(count, total)}%
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
