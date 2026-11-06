"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LinkStatus } from "@/lib/pagination"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { formatCount } from "../format"
import { useLinks } from "./links-provider"

const OPTIONS: { value: LinkStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
]

/**
 * Tabs root for the links list. The list itself is server-rendered and passed in as `children`
 * (inside a `TabsContent` for the current status); switching navigates, keeping the search and page
 * size and going back to page 1. The selected tab updates immediately while the list loads.
 */
export function StatusTabs({ status, className, children }: { status: LinkStatus; className?: string; children: React.ReactNode }) {
  const { navigate } = useLinks()
  const [selected, setSelected] = useState(status)
  const [seenStatus, setSeenStatus] = useState(status)
  if (status !== seenStatus) {
    // Navigated (tab, back/forward, link): follow the URL.
    setSeenStatus(status)
    setSelected(status)
  }

  return (
    <Tabs
      value={selected}
      onValueChange={(value) => {
        const next = value as LinkStatus
        setSelected(next)
        navigate({ status: next, page: 1 })
      }}
      className={cn("block", className)}
    >
      {children}
    </Tabs>
  )
}

export function StatusTabsList({ counts, className }: { counts: Record<LinkStatus, number>; className?: string }) {
  return (
    <TabsList aria-label="Link status" className={cn("h-10 rounded-xl p-1 dark:bg-input/40", className)}>
      {OPTIONS.map((option) => (
        <TabsTrigger
          key={option.value}
          value={option.value}
          // text-muted-foreground: shadcn's default inactive color (foreground/60) misses AA contrast on paper.
          className="group/trigger h-8 rounded-lg px-3 text-muted-foreground data-[state=active]:shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_var(--border)]"
        >
          {option.label}
          <Badge
            variant="secondary"
            className="h-5 min-w-5 rounded-full px-1.5 tabular-nums text-muted-foreground group-data-[state=active]/trigger:text-foreground"
          >
            {formatCount(counts[option.value])}
            <span className="sr-only"> {counts[option.value] === 1 ? "link" : "links"}</span>
          </Badge>
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
