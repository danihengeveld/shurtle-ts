"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createShurtle, type CreateShurtleFormState } from "@/lib/actions"
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { useActionState, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { DialogClose } from "../ui/dialog"
import { SuccessCard } from "./success-card"

const initialState: CreateShurtleFormState = {}

interface CreateShurtleFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  ref?: React.Ref<HTMLFormElement>
}

export function CreateShurtleForm({ onCancel, onSuccess, ref }: CreateShurtleFormProps) {
  const [showCustomSlug, setShowCustomSlug] = useState(false)
  const [state, formAction, isPending] = useActionState(createShurtle, initialState)

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {state.success ? (
        <SuccessCard data={state.data!} />
      ) : (
        <form ref={ref} action={formAction} className="space-y-4">
          {state.errors?._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">
              URL to shorten <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com/very/long/url/that/needs/shortening"
              required
              aria-invalid={!!state.errors?.url}
              aria-describedby={state.errors?.url ? "url-error" : undefined}
            />
            {state.errors?.url && (
              <p id="url-error" className="text-sm text-destructive">
                {state.errors.url[0]}
              </p>
            )}
          </div>

          <Collapsible open={showCustomSlug} onOpenChange={setShowCustomSlug}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-muted-foreground"
              >
                {showCustomSlug ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide custom slug options
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />I want to customize my slug (optional)
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Custom slug</Label>
                <Input
                  id="slug"
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
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <DialogClose asChild>
                <Button variant="outline" type="button" onClick={onCancel}>
                  Cancel
                </Button>
              </DialogClose>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Shurtle
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}