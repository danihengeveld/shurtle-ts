"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createShurtle, type CreateShurtleFormState } from "@/lib/actions"
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { startTransition, useActionState, useRef, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { SuccessCard } from "./success-card"

const initialState: CreateShurtleFormState = {}

export function CreateShurtleForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [showCustomSlug, setShowCustomSlug] = useState(false)
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

          <Collapsible open={showCustomSlug} onOpenChange={setShowCustomSlug}>
            <CollapsibleTrigger asChild>
              <Button
                id="toggle-custom-slug"
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
            </CollapsibleContent>
          </Collapsible>

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