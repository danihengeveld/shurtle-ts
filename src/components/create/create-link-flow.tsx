"use client"

import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import type { CreateShurtleFormState } from "@/lib/actions"
import { displayShortUrl, shortUrl, siteInfo } from "@/lib/site"
import { CheckIcon, ExternalLinkIcon, PlusIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { useActionState } from "react"
import { CopyButton } from "../dashboard/copy-button"
import { formatExpiry, splitUrl } from "../dashboard/format"
import { CreateLinkForm } from "./create-link-form"
import type { CreateLinkAction } from "./create-link-provider"

const IDLE: CreateShurtleFormState = { status: "idle" }

export function CreateLinkFlow({
  action,
  initialSlug,
  initialState = IDLE,
  onCreateAnother,
  onDone,
}: {
  action: CreateLinkAction
  initialSlug?: string
  initialState?: CreateShurtleFormState
  onCreateAnother: () => void
  onDone: () => void
}) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  if (state.status === "success") {
    return (
      <CreateLinkSuccess
        data={state.data}
        onCreateAnother={onCreateAnother}
        onDone={onDone}
      />
    )
  }

  return (
    <>
      <header className="shrink-0 px-5 pt-6 pr-16 pb-5 sm:px-7 sm:pt-7">
        <DialogPrimitive.Title className="font-display text-[1.375rem] leading-tight font-semibold tracking-tight">
          {initialSlug ? "Claim your link" : "Create a short link"}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-1.5 text-sm text-muted-foreground">
          {initialSlug ? (
            <>
              <span className="font-mono text-foreground">
                {displayShortUrl(initialSlug)}
              </span>{" "}
              is free. Where should it point?
            </>
          ) : (
            "Paste a long URL and get a short one you can share anywhere."
          )}
        </DialogPrimitive.Description>
      </header>
      <CreateLinkForm
        state={state}
        formAction={formAction}
        isPending={isPending}
        initialSlug={initialSlug}
      />
    </>
  )
}

function CreateLinkSuccess({
  data,
  onCreateAnother,
  onDone,
}: {
  data: { slug: string; url: string; expiresAt: string | null }
  onCreateAnother: () => void
  onDone: () => void
}) {
  const destination = splitUrl(data.url)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative isolate overflow-hidden px-5 pt-8 pb-6 text-center sm:px-8 sm:pt-10">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 mask-[radial-gradient(70%_80%_at_50%_0%,black,transparent)]"
          >
            <div className="size-full shell-pattern opacity-80" />
          </div>
          <div
            aria-hidden
            className="mx-auto flex size-14 animate-in items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-soft duration-500 ease-out-expo fade-in-0 zoom-in-50"
          >
            <CheckIcon className="size-7" strokeWidth={2.5} />
          </div>
          <DialogPrimitive.Title className="mt-5 font-display text-2xl leading-tight font-semibold tracking-tight">
            Your link is ready
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm text-muted-foreground">
            Copy it and share it anywhere.
          </DialogPrimitive.Description>
          <p role="status" className="sr-only">
            Created {displayShortUrl(data.slug)}
          </p>
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="rounded-2xl border bg-card p-3 shadow-soft sm:p-4">
            <p className="px-2 pt-1 pb-3 text-center font-mono text-lg leading-snug font-medium wrap-anywhere sm:text-xl">
              <span className="text-muted-foreground">
                {siteInfo.baseUrl.host}/
              </span>
              <span className="text-brand-ink">{data.slug}</span>
            </p>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <CopyButton
                slug={data.slug}
                label
                variant="default"
                size="lg"
                className="h-11 rounded-xl"
                autoFocus
              />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 rounded-xl px-4"
              >
                <a
                  href={shortUrl(data.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon aria-hidden />
                  Open
                  <span className="sr-only">
                    {" "}
                    {displayShortUrl(data.slug)} in a new tab
                  </span>
                </a>
              </Button>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2.5 px-1 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">Redirects to</dt>
              <Hint content={data.url}>
                <dd className="min-w-0 truncate text-right">
                  <span className="font-medium">{destination.host}</span>
                  <span className="text-muted-foreground">
                    {destination.rest}
                  </span>
                </dd>
              </Hint>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">Expires</dt>
              <dd className="text-right">
                {data.expiresAt
                  ? formatExpiry(new Date(data.expiresAt))
                  : "Never"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t bg-muted/30 px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-7 sm:py-4 dark:bg-transparent">
        <Button
          type="button"
          variant="outline"
          onClick={onCreateAnother}
          className="h-10 max-sm:flex-1 sm:h-9"
        >
          <PlusIcon aria-hidden />
          Create another
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onDone}
          className="h-10 max-sm:flex-1 sm:h-9"
        >
          Done
        </Button>
      </div>
    </div>
  )
}
