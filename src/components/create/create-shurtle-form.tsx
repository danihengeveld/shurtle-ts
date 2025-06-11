"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createShurtle, type CreateShurtleFormState } from "@/lib/actions"
import { format } from "date-fns"
import { AlertCircle, ChevronDown, ChevronDownIcon, ChevronUp, Loader2 } from "lucide-react"
import { startTransition, useActionState, useRef, useState } from "react"
import { Calendar } from "../ui/calendar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { SuccessCard } from "./success-card"

const initialState: CreateShurtleFormState = {}

export function CreateShurtleForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [expirationDatePickerOpen, setExpirationDatePickerOpen] = useState(false)
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [state, formAction, isPending] = useActionState(createShurtle, initialState)

  function handleSubmit(formData: FormData) {
    startTransition(() => formAction(formData))
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {state.success ? (
        <SuccessCard data={state.data!} />
      ) : (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          {state.errors?._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url-input">
              URL to shorten <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url-input"
              name="url"
              type="url"
              placeholder="https://example.com/very/long/url/that/needs/shortening"
              required
              autoFocus
              aria-invalid={!!state.errors?.url}
              aria-describedby={state.errors?.url ? "url-error" : undefined}
            />
            {state.errors?.url && (
              <p id="url-error" className="text-sm text-destructive">
                {state.errors.url[0]}
              </p>
            )}
          </div>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                id="toggle-advanced-options-btn"
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-muted-foreground"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide advanced options
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />I want to customize my Shurtle (optional)
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-slug-input">Custom slug</Label>
                  <Input
                    id="custom-slug-input"
                    name="slug"
                    placeholder="my-custom-slug"
                    aria-invalid={!!state.errors?.slug}
                    aria-describedby={state.errors?.slug ? "slug-error" : undefined}
                  />
                  {state.errors?.slug ? (
                    <p id="slug-error" className="text-sm text-destructive">
                      {state.errors.slug[0]}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Only letters, numbers, underscores, and hyphens are allowed.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="open-expiration-date-picker-btn">
                    Expiration date
                  </Label>
                  <Popover open={expirationDatePickerOpen} onOpenChange={setExpirationDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="open-expiration-date-picker-btn"
                        className="w-48 justify-between font-normal"
                        aria-invalid={!!state.errors?.expiresAt}
                        aria-describedby={state.errors?.expiresAt ? "expiresAt-error" : undefined}
                      >
                        {expirationDate ? format(expirationDate, "PP") : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          date?.setHours(23, 59, 59, 999) // Set to end of day
                          setExpirationDate(date)
                          setExpirationDatePickerOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {state.errors?.expiresAt ? (
                    <p id="expiresAt-error" className="text-sm text-destructive">
                      {state.errors.expiresAt[0]}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      When selected, the Shurtle will expire at the end of the day (in your timezone).
                    </p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          {expirationDate && (
            <input
              type="hidden"
              name="expiresAt"
              value={expirationDate.toISOString()}
            />
          )}
          <div className="flex justify-end pt-4">
            <Button id="create-shurtle-btn" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Shurtle
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}