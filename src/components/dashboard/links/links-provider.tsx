"use client"

import { deleteShurtle, type DeleteShurtleResult } from "@/lib/actions"
import type { DashboardQuery } from "@/lib/pagination"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { linksHref } from "./href"
import { createContext, use, useOptimistic, useTransition } from "react"

type DeleteAction = (slug: string) => Promise<DeleteShurtleResult>

type LinksContextValue = {
  /** Base path of the list (the real dashboard, or the preview harness). */
  basePath: string
  /** Navigate to another page / search of the list, keeping the current UI until it is ready. */
  navigate: (query: Partial<DashboardQuery>) => void
  isNavigating: boolean
  /** Slugs with a delete in flight (optimistic). */
  deleting: ReadonlySet<string>
  /** Must be called inside a transition. */
  markDeleting: (slug: string) => void
  deleteAction: DeleteAction
}

const LinksContext = createContext<LinksContextValue | null>(null)

export function useLinks() {
  const context = use(LinksContext)
  if (!context) throw new Error("useLinks must be used inside <LinksProvider>")
  return context
}

const NO_SLUGS: ReadonlySet<string> = new Set()

export function LinksProvider({
  basePath = "/dashboard",
  deleteAction = deleteShurtle,
  children,
}: {
  basePath?: string
  deleteAction?: DeleteAction
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isNavigating, startNavigation] = useTransition()
  const [deleting, markDeleting] = useOptimistic(NO_SLUGS, (current, slug: string) => new Set(current).add(slug))

  function navigate(query: Partial<DashboardQuery>) {
    startNavigation(() => {
      router.replace(linksHref(basePath, query), { scroll: false })
    })
  }

  return (
    <LinksContext value={{ basePath, navigate, isNavigating, deleting, markDeleting, deleteAction }}>
      {children}
    </LinksContext>
  )
}

/** Wraps the list body: dims it (and marks it busy) while a search / page change is loading. */
export function LinksBusyRegion({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isNavigating } = useLinks()
  return (
    <div
      aria-busy={isNavigating || undefined}
      data-busy={isNavigating || undefined}
      className={cn("transition-opacity duration-200 data-busy:opacity-60 data-busy:delay-150", className)}
    >
      {children}
    </div>
  )
}

/** A table row that dims and becomes inert while its delete is in flight. */
export function LinkTableRow({ slug, className, children }: { slug: string; className?: string; children: React.ReactNode }) {
  const { deleting } = useLinks()
  const isDeleting = deleting.has(slug)
  return (
    <tr data-deleting={isDeleting || undefined} inert={isDeleting} className={className}>
      {children}
    </tr>
  )
}

export function LinkListItem({ slug, className, children }: { slug: string; className?: string; children: React.ReactNode }) {
  const { deleting } = useLinks()
  const isDeleting = deleting.has(slug)
  return (
    <li data-deleting={isDeleting || undefined} inert={isDeleting} className={className}>
      {children}
    </li>
  )
}
