"use client"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "cn"
import { CalendarIcon, ChevronDownIcon, ClockIcon } from "lucide-react"
import { useRef, useState } from "react"
import { addLocalDays, atLocalTime, formatExpiry, startOfLocalDay, toTimeValue } from "../dashboard/format"

export type ExpiryPreset = "never" | "1" | "7" | "30" | "custom"

/** `customDate` is the picked calendar day; `customTime` is the local time of day (`"HH:MM"`). */
export type ExpiryValue = { preset: ExpiryPreset; customDate?: Date; customTime: string }

const PRESETS: { value: ExpiryPreset; label: string; long: string }[] = [
  { value: "never", label: "Never", long: "Never expires" },
  { value: "1", label: "1 day", long: "Expires in 1 day" },
  { value: "7", label: "7 days", long: "Expires in 7 days" },
  { value: "30", label: "30 days", long: "Expires in 30 days" },
  { value: "custom", label: "Custom", long: "Custom date and time" },
]

/** Initial value: never expires, with the custom time defaulting to the current time of day. */
export function initialExpiry(expiresAt?: string): ExpiryValue {
  if (expiresAt) {
    const date = new Date(expiresAt)
    return { preset: "custom", customDate: date, customTime: toTimeValue(date) }
  }
  return { preset: "never", customTime: toTimeValue(new Date()) }
}

/**
 * The moment the link stops working, or null for "never" / an incomplete custom value. Presets
 * expire at the current time of day, N days from now (to the minute).
 */
export function expiryDate(value: ExpiryValue): Date | null {
  if (value.preset === "never") return null
  if (value.preset === "custom") return value.customDate ? atLocalTime(value.customDate, value.customTime) : null
  const now = new Date()
  return atLocalTime(addLocalDays(now, Number(value.preset)), toTimeValue(now))
}

/** ISO timestamp for the form, or "" when the link never expires. */
export function expiryIso(value: ExpiryValue) {
  return expiryDate(value)?.toISOString() ?? ""
}

export function describeExpiry(value: ExpiryValue) {
  if (value.preset === "never") return "Never expires"
  const date = expiryDate(value)
  if (!date) return value.customDate ? "No time picked" : "No date picked"
  return `Expires ${formatExpiry(date)}`
}

/** Client-side check for the custom option; presets are always valid. */
export function expiryIssue(value: ExpiryValue) {
  if (value.preset !== "custom") return undefined
  if (!value.customDate) return "Pick a date, or choose another option."
  const date = atLocalTime(value.customDate, value.customTime)
  if (!date) return "Pick a time."
  if (date.getTime() <= Date.now()) return "Pick a moment in the future."
  return undefined
}

const longDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

/** Shared look of the date button and the time field. */
const fieldClass = cn(
  "flex h-10 w-full items-center gap-2.5 rounded-xl border border-input bg-card px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30 max-sm:h-11",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 data-invalid:border-destructive",
)

export function ExpiryField({
  value,
  onChange,
  error,
  errorId,
}: {
  value: ExpiryValue
  onChange: (value: ExpiryValue) => void
  error?: string
  errorId: string
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  // Only a click/tap on "Custom" opens the calendar; arrowing through the options must not steal focus.
  const pointerSelect = useRef(false)
  const date = expiryDate(value)
  const today = startOfLocalDay(new Date())

  return (
    <fieldset aria-describedby={error ? `${errorId} expiry-hint` : "expiry-hint"} className="grid gap-2.5">
      <legend className="mb-2.5 text-sm font-medium">Expiration</legend>
      <div
        className={cn(
          "grid grid-cols-5 gap-1 rounded-xl bg-muted p-1 dark:bg-input/40",
          error && "ring-2 ring-destructive/50",
        )}
      >
        {PRESETS.map((preset) => (
          <label
            key={preset.value}
            onPointerDown={() => {
              pointerSelect.current = true
            }}
            className={cn(
              "relative flex h-9 cursor-pointer items-center justify-center rounded-lg px-1 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,box-shadow] select-none hover:text-foreground max-sm:h-10",
              "has-checked:bg-card has-checked:text-foreground has-checked:shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_var(--border)] dark:has-checked:bg-background/70",
              "has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
            )}
          >
            <input
              type="radio"
              name="expiryPreset"
              value={preset.value}
              checked={value.preset === preset.value}
              onChange={() => {
                onChange({ ...value, preset: preset.value })
                if (preset.value === "custom" && !value.customDate && pointerSelect.current) setPickerOpen(true)
                pointerSelect.current = false
              }}
              className="sr-only"
              aria-label={preset.long}
            />
            {preset.label}
          </label>
        ))}
      </div>

      {value.preset === "custom" && (
        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-invalid={Boolean(error) || undefined}
                className={cn(fieldClass, "cursor-pointer text-left", !value.customDate && "text-muted-foreground")}
              >
                <CalendarIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {value.customDate ? longDate.format(value.customDate) : "Pick a date…"}
                </span>
                <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">, open calendar</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-2xl p-0">
              <Calendar
                mode="single"
                selected={value.customDate}
                defaultMonth={value.customDate ?? today}
                startMonth={today}
                disabled={{ before: today }}
                onSelect={(day) => {
                  if (!day) return
                  onChange({ ...value, preset: "custom", customDate: day })
                  setPickerOpen(false)
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>

          {/* Native time input (as in the shadcn date + time picker): the platform's own keyboard and
              wheel UI, in the viewer's 12/24h convention. */}
          <label data-invalid={Boolean(error) || undefined} className={cn(fieldClass, "cursor-text")}>
            <ClockIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Expiry time</span>
            <input
              type="time"
              step={60}
              required
              value={value.customTime}
              onChange={(event) => onChange({ ...value, customTime: event.target.value })}
              aria-invalid={Boolean(error) || undefined}
              className="w-full min-w-0 appearance-none bg-transparent tabular-nums outline-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </label>
        </div>
      )}

      <p id="expiry-hint" className="text-[13px] leading-relaxed text-muted-foreground">
        {value.preset === "never" ? (
          "The link keeps working until you delete it."
        ) : date ? (
          <>
            Stops working on <span className="font-medium text-foreground">{formatExpiry(date)}</span>, your time.
          </>
        ) : (
          "Pick the date and time the link should stop working, in your time zone."
        )}
      </p>
      {error && (
        <p id={errorId} className="text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
