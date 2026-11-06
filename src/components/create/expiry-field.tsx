"use client"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import { useRef, useState } from "react"
import { addLocalDays, endOfLocalDay, startOfLocalDay } from "../dashboard/format"

export type ExpiryPreset = "never" | "1" | "7" | "30" | "custom"

export type ExpiryValue = { preset: ExpiryPreset; customDate?: Date }

const PRESETS: { value: ExpiryPreset; label: string; long: string }[] = [
  { value: "never", label: "Never", long: "Never expires" },
  { value: "1", label: "1 day", long: "Expires in 1 day" },
  { value: "7", label: "7 days", long: "Expires in 7 days" },
  { value: "30", label: "30 days", long: "Expires in 30 days" },
  { value: "custom", label: "Custom", long: "Custom date" },
]

/** Last day the link works (local calendar day), or null for "never" / no date picked yet. */
export function expiryDay(value: ExpiryValue): Date | null {
  if (value.preset === "never") return null
  if (value.preset === "custom") return value.customDate ?? null
  return addLocalDays(new Date(), Number(value.preset))
}

/** ISO timestamp for the form: the end of the chosen day in the viewer's time zone. */
export function expiryIso(value: ExpiryValue) {
  const day = expiryDay(value)
  return day ? endOfLocalDay(day).toISOString() : ""
}

const longDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

export function describeExpiry(value: ExpiryValue) {
  const day = expiryDay(value)
  if (value.preset === "never") return "Never expires"
  if (!day) return "No date picked"
  return `Expires after ${longDate.format(day)}`
}

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
  const day = expiryDay(value)
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
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-invalid={Boolean(error) || undefined}
              className={cn(
                "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-input bg-card px-3 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-invalid:border-destructive",
                !value.customDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon aria-hidden className="size-4 text-muted-foreground" />
              <span className="flex-1">{value.customDate ? longDate.format(value.customDate) : "Pick the last day…"}</span>
              <ChevronDownIcon aria-hidden className="size-4 text-muted-foreground" />
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
              onSelect={(date) => {
                if (!date) return
                onChange({ preset: "custom", customDate: date })
                setPickerOpen(false)
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      )}

      <p id="expiry-hint" className="text-[13px] leading-relaxed text-muted-foreground">
        {value.preset === "never" ? (
          "The link keeps working until you delete it."
        ) : day ? (
          <>
            Works until the end of <span className="font-medium text-foreground">{longDate.format(day)}</span>, in your
            time zone.
          </>
        ) : (
          "Pick the last day the link should work. It stops at midnight, your time."
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
