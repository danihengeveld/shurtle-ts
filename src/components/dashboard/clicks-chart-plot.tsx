"use client"

import { cn } from "cn"
import { useId, useState } from "react"
import { formatCount, formatUtcDay, pluralize } from "./format"

type Point = { date: string; clicks: number }

const WIDTH = 1000
const HEIGHT = 200

/** Round up to a "nice" axis maximum (1, 2, 2.5, 5 × 10ⁿ), with a little headroom. */
export function niceMax(max: number) {
  if (max <= 0) return 4
  const target = max * 1.1
  const magnitude = 10 ** Math.floor(Math.log10(target))
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * magnitude >= target) return Math.max(step * magnitude, 4)
  }
  return 10 * magnitude
}

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, but never overshoots the data. */
function monotonePath(points: [number, number][]) {
  const n = points.length
  if (n === 0) return ""
  if (n === 1) return `M${points[0][0]},${points[0][1]}`
  const dx: number[] = []
  const slopes: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0])
    slopes.push((points[i + 1][1] - points[i][1]) / dx[i])
  }
  const tangents = [slopes[0]]
  for (let i = 1; i < n - 1; i++) {
    tangents.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2)
  }
  tangents.push(slopes[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
      continue
    }
    const a = tangents[i] / slopes[i]
    const b = tangents[i + 1] / slopes[i]
    const h = a * a + b * b
    if (h > 9) {
      const t = 3 / Math.sqrt(h)
      tangents[i] = t * a * slopes[i]
      tangents[i + 1] = t * b * slopes[i]
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    d += `C${x0 + h},${y0 + tangents[i] * h} ${x1 - h},${y1 - tangents[i + 1] * h} ${x1},${y1}`
  }
  return d
}

const longDay = { weekday: "short", month: "short", day: "numeric" } as const

export function ClicksChartPlot({ data }: { data: Point[] }) {
  const id = useId()
  const [active, setActive] = useState<number | null>(null)
  const [keyboard, setKeyboard] = useState(false)

  const max = Math.max(0, ...data.map((point) => point.clicks))
  const yMax = niceMax(max)
  const isEmpty = max === 0
  const lastIndex = data.length - 1
  const x = (index: number) => (lastIndex <= 0 ? 0 : (index / lastIndex) * WIDTH)
  const y = (clicks: number) => HEIGHT - (clicks / yMax) * HEIGHT
  const points = data.map((point, index) => [x(index), y(point.clicks)] as [number, number])
  const line = monotonePath(points)
  const area = `${line}L${WIDTH},${HEIGHT}L0,${HEIGHT}Z`

  const shown = active ?? (isEmpty ? null : lastIndex)
  const activePoint = shown === null ? null : data[shown]
  const leftPct = shown === null ? 0 : (x(shown) / WIDTH) * 100
  const topPct = activePoint ? (y(activePoint.clicks) / HEIGHT) * 100 : 100
  const align = leftPct < 12 ? "start" : leftPct > 88 ? "end" : "center"

  function indexFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    return Math.round(ratio * lastIndex)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = active ?? lastIndex
    const next =
      event.key === "ArrowLeft"
        ? current - 1
        : event.key === "ArrowRight"
          ? current + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null
    if (next === null) return
    event.preventDefault()
    setKeyboard(true)
    setActive(Math.min(lastIndex, Math.max(0, next)))
  }

  const summary = isEmpty
    ? "No clicks in the last 30 days."
    : `${pluralize(data.reduce((sum, point) => sum + point.clicks, 0), "click")} in the last 30 days, peaking at ${pluralize(max, "click")} on ${formatUtcDay(data[data.findIndex((point) => point.clicks === max)].date, longDay)}.`

  return (
    <div className="relative">
      {/* Plot */}
      <div className="relative h-40 sm:h-48">
        {/* Grid: hairlines at 0, ½ and max; the max value labels the top line. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          <div className="relative border-t border-border">
            {!isEmpty && (
              <span className="absolute -top-2 left-0 -translate-y-full text-[11px] leading-none text-muted-foreground tabular-nums">
                {formatCount(yMax)}
              </span>
            )}
          </div>
          <div className="border-t border-border/70" />
          <div className="border-t border-border" />
        </div>

        <svg
          aria-hidden
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--chart-1)", stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: "var(--chart-1)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {!isEmpty && <path d={area} fill={`url(#${id}-fill)`} />}
          <path
            d={line}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className={cn(isEmpty && "opacity-40")}
            strokeDasharray={isEmpty ? "4 4" : undefined}
          />
        </svg>

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-card px-4 py-2 text-center">
              <p className="text-sm font-medium">No clicks yet</p>
              <p className="mt-0.5 max-w-60 text-xs text-pretty text-muted-foreground">
                Share one of your links. Every click will show up here.
              </p>
            </div>
          </div>
        )}

        {/* Crosshair, marker and tooltip (HTML, so they don't stretch with the SVG). */}
        {activePoint && shown !== null && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {active !== null && (
              <div className="absolute inset-y-0 w-px bg-foreground/15" style={{ left: `${leftPct}%` }} />
            )}
            <div
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1 ring-[3px] ring-card"
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
            />
            {active !== null && (
              <div
                className="absolute z-10 rounded-lg border bg-popover px-2.5 py-1.5 whitespace-nowrap text-popover-foreground shadow-lift"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  translate: `${align === "start" ? "-12px" : align === "end" ? "calc(-100% + 12px)" : "-50%"} calc(-100% - 12px)`,
                }}
              >
                <p className="text-sm font-semibold tabular-nums">{pluralize(activePoint.clicks, "click")}</p>
                <p className="text-[11px] text-muted-foreground">{formatUtcDay(activePoint.date, longDay)}</p>
              </div>
            )}
          </div>
        )}

        {/* Interaction layer: pointer + keyboard (arrow keys, Home / End). */}
        {!isEmpty && (
          <div
            role="group"
            tabIndex={0}
            aria-label="Daily clicks chart. Use the left and right arrow keys to read each day."
            aria-describedby={`${id}-summary`}
            onPointerMove={(event) => {
              setKeyboard(false)
              setActive(indexFromPointer(event))
            }}
            onPointerDown={(event) => setActive(indexFromPointer(event))}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            className="absolute inset-0 cursor-crosshair touch-pan-y rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-card"
          />
        )}
      </div>

      {/* X axis: first day, middle, today. */}
      <div aria-hidden className="mt-2.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{data.length > 0 && formatUtcDay(data[0].date)}</span>
        <span className="max-sm:hidden">{data.length > 2 && formatUtcDay(data[Math.floor(lastIndex / 2)].date)}</span>
        <span>Today</span>
      </div>

      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {keyboard && activePoint && active !== null
          ? `${formatUtcDay(activePoint.date, longDay)}: ${pluralize(activePoint.clicks, "click")}`
          : ""}
      </p>
      {/* sr-only goes on a wrapper: a <caption> escapes the clip of an sr-only table in some browsers. */}
      <div className="sr-only">
        <table>
          <caption>Clicks per day (UTC), last 30 days</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <th scope="row">{formatUtcDay(point.date, { ...longDay, year: "numeric" })}</th>
                <td>{point.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
