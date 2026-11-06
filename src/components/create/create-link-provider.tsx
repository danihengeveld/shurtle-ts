"use client"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { createShurtle, type CreateShurtleFormState } from "@/lib/actions"
import { cn } from "cn"
import { PlusIcon } from "lucide-react"
import { createContext, use, useEffect, useState } from "react"
import { CreateLinkDialog } from "./create-link-dialog"

export type CreateLinkAction = (
  state: CreateShurtleFormState,
  formData: FormData,
) => Promise<CreateShurtleFormState>

type CreateLinkContextValue = {
  openCreate: (options?: { slug?: string }) => void
}

const CreateLinkContext = createContext<CreateLinkContextValue | null>(null)

export function useCreateLink() {
  const context = use(CreateLinkContext)
  if (!context)
    throw new Error("useCreateLink must be used inside <CreateLinkProvider>")
  return context
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

/**
 * Owns the "create a link" dialog so any button on the page (header, empty state, deep link) can
 * open it. Every opening starts a fresh flow (new form + action state); "Create another" does too.
 */
export function CreateLinkProvider({
  children,
  action = createShurtle,
  defaultOpen = false,
  defaultSlug,
  initialState,
}: {
  children: React.ReactNode
  action?: CreateLinkAction
  /** Preview / testing only. */
  defaultOpen?: boolean
  defaultSlug?: string
  initialState?: CreateShurtleFormState
}) {
  const [flow, setFlow] = useState({
    open: defaultOpen,
    id: 0,
    slug: defaultSlug,
  })

  function openCreate(options?: { slug?: string }) {
    setFlow((current) => ({
      open: true,
      id: current.id + 1,
      slug: options?.slug,
    }))
  }

  // Keyboard shortcut: "N" opens the dialog from anywhere on the dashboard.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "n" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      if (event.repeat || isTypingTarget(event.target)) return
      if (
        document.querySelector(
          "[role=dialog], [role=alertdialog], [role=menu], [role=listbox]",
        )
      )
        return
      event.preventDefault()
      setFlow((current) => ({
        open: true,
        id: current.id + 1,
        slug: undefined,
      }))
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <CreateLinkContext value={{ openCreate }}>
      {children}
      <CreateLinkDialog
        flowId={flow.id}
        open={flow.open}
        onOpenChange={(open) => setFlow((current) => ({ ...current, open }))}
        onCreateAnother={() =>
          setFlow((current) => ({
            open: true,
            id: current.id + 1,
            slug: undefined,
          }))
        }
        action={action}
        initialSlug={flow.slug}
        initialState={flow.id === 0 ? initialState : undefined}
      />
    </CreateLinkContext>
  )
}

/** Opens the create dialog. With `shortcut`, shows the "N" hint (desktop only). */
export function CreateLinkButton({
  children = "New link",
  shortcut = false,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  shortcut?: boolean
}) {
  const { openCreate } = useCreateLink()
  return (
    <Button
      type="button"
      onClick={() => openCreate()}
      aria-keyshortcuts={shortcut ? "N" : undefined}
      className={cn("group/create", className)}
      {...props}
    >
      <PlusIcon
        aria-hidden
        className="transition-transform duration-300 group-hover/create:rotate-90"
      />
      {children}
      {shortcut && (
        // Tinted from the button's own text colour, so it reads on any button variant.
        <Kbd
          aria-hidden
          className="ml-1 hidden bg-current/15 font-mono text-[11px] text-current opacity-80 md:inline-flex"
        >
          N
        </Kbd>
      )}
    </Button>
  )
}
