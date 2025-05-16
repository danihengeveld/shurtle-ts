"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, MoreHorizontal, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Shurtle } from "@/db/schema"
import { deleteShurtle } from "@/lib/actions"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ShurtlesTableProps {
  shurtles: Shurtle[]
  currentPage: number
  totalPages: number
  perPage: number
}

export function ShurtlesTable({ shurtles: initialShurtles, currentPage, totalPages, perPage }: ShurtlesTableProps) {
  const [shurtles, setShurtles] = useState(initialShurtles)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  const filteredShurtles = shurtles.filter(
    (shurtle) => shurtle.slug.includes(searchQuery) || shurtle.url.includes(searchQuery),
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${text}`)
  }

  const handleDelete = async (slug: string) => {
    if (confirm("Are you sure you want to delete this shurtle?")) {
      await deleteShurtle(slug)
      setShurtles(shurtles.filter((s) => s.slug !== slug))
    }
  }

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?page=${page}&perPage=${perPage}`)
  }

  const handlePerPageChange = (value: string) => {
    router.push(`${pathname}?page=1&perPage=${value}`)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of page range around current page
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4)
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2) // -2 represents ellipsis
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search shurtles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={perPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Destination URL</TableHead>
              <TableHead className="text-right">Hits</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Hit</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShurtles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No shurtles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredShurtles.map((shurtle) => (
                <TableRow key={shurtle.slug}>
                  <TableCell>
                    <div className="font-medium">{shurtle.slug}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{shurtle.url}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{shurtle.hits}</Badge>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(shurtle.createdAt, { addSuffix: true })}</TableCell>
                  <TableCell>
                    {shurtle.lastHitAt ? formatDistanceToNow(shurtle.lastHitAt, { addSuffix: true }) : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => copyToClipboard(shurtle.slug)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/${shurtle.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(shurtle.slug)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {getPageNumbers().map((pageNum, i) =>
              pageNum < 0 ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(pageNum)
                    }}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) handlePageChange(currentPage + 1)
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
