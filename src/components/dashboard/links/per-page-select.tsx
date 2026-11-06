"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PER_PAGE_OPTIONS, type PerPage } from "@/lib/pagination"
import { useLinks } from "./links-provider"

export function PerPageSelect({
  perPage,
  query,
}: {
  perPage: PerPage
  query: string
}) {
  const { navigate } = useLinks()

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span id="per-page-label" className="whitespace-nowrap">
        <span className="sm:hidden">Per page</span>
        <span className="max-sm:hidden">Rows per page</span>
      </span>
      <Select
        value={String(perPage)}
        onValueChange={(value) =>
          navigate({ perPage: Number(value) as PerPage, query, page: 1 })
        }
      >
        <SelectTrigger
          aria-labelledby="per-page-label"
          className="w-[4.5rem] rounded-lg bg-card text-foreground tabular-nums max-md:data-[size=default]:h-10"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[4.5rem]">
          {PER_PAGE_OPTIONS.map((option) => (
            <SelectItem
              key={option}
              value={String(option)}
              className="tabular-nums"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
