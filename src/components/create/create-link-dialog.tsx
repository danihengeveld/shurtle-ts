"use client"

import type { CreateShurtleFormState } from "@/lib/actions"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import type { CreateLinkAction } from "./create-link-provider"
import { CreateLinkFlow } from "./create-link-flow"

/**
 * A centred dialog on larger screens and a bottom sheet on phones. Its body scrolls on its own,
 * so the form stays usable at 360 px wide with the on-screen keyboard open.
 */
export function CreateLinkDialog({
  flowId,
  open,
  onOpenChange,
  onCreateAnother,
  action,
  initialSlug,
  initialState,
}: {
  flowId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAnother: () => void
  action: CreateLinkAction
  initialSlug?: string
  initialState?: CreateShurtleFormState
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 dark:bg-black/60" />
        <DialogPrimitive.Content
          className={
            "fixed z-50 flex flex-col overflow-hidden border bg-popover text-popover-foreground shadow-lift outline-none " +
            // Phone: bottom sheet.
            "inset-x-0 bottom-0 max-h-[calc(100dvh-1.5rem)] rounded-t-3xl border-b-0 duration-300 ease-out-expo " +
            "data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom " +
            // ≥ sm: centred dialog.
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(48rem,calc(100dvh-4rem))] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border-b " +
            "sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-4"
          }
        >
          <CreateLinkFlow
            key={flowId}
            action={action}
            initialSlug={initialSlug}
            initialState={initialState}
            onCreateAnother={onCreateAnother}
            onDone={() => onOpenChange(false)}
          />
          <DialogPrimitive.Close className="absolute top-4 right-4 flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 max-sm:size-10">
            <XIcon aria-hidden className="size-[18px]" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
