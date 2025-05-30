"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shurtle } from "@/db/schema"
import { deleteShurtle } from "@/lib/actions"
import { formatDistanceToNow } from "date-fns"
import { Copy, ExternalLink, MoreHorizontal, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"

interface ShurtlesTableProps {
  shurtles: Shurtle[]
  currentPage: number
  totalPages: number
  perPage: number
}

export function ShurtlesTable({ shurtles: initialShurtles, currentPage, totalPages, perPage }: ShurtlesTableProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [shurtles, setShurtles] = useState(initialShurtles)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [shurtleSlugToDelete, setShurtleSlugToDelete] = useState<string | null>(null)

  const filteredShurtles = shurtles.filter(
    (shurtle) => shurtle.slug.includes(searchQuery) || shurtle.url.includes(searchQuery)
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${text}`)
  }

  function handleDelete() {
    if (!shurtleSlugToDelete) return

    // Optimistically update the UI
    setShurtles(shurtles.filter((s) => s.slug !== shurtleSlugToDelete))

    startTransition(async () => {
      await deleteShurtle(shurtleSlugToDelete)
    })

    setShurtleSlugToDelete(null)
  }

  const handlePageChange = (page: number) => {
    router.replace(`${pathname}?page=${page}&perPage=${perPage}`)
  }

  const handlePerPageChange = (value: string) => {
    router.replace(`${pathname}?page=1&perPage=${value}`)
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
        <div className="relative flex-1 max-w-3xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-shurtles"
            type="search"
            placeholder="Search"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select value={perPage.toString()} onValueChange={handlePerPageChange} disabled={isPending}>
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
                <TableRow key={shurtle.slug} className={isPending ? "opacity-50" : ""}>
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
                        <Button variant="ghost" size="icon" disabled={isPending}>
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
                          <Link href={`/${shurtle.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={isPending}
                          onClick={() => {
                            setShurtleSlugToDelete(shurtle.slug)
                            setConfirmDialogOpen(true)
                          }}
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
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this shurtle?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. There is no guarantee that the slug will be available again
                after deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1 && !isPending) handlePageChange(currentPage - 1)
                }}
                className={currentPage <= 1 || isPending ? "pointer-events-none opacity-50" : ""}
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
                      if (!isPending) handlePageChange(pageNum)
                    }}
                    isActive={pageNum === currentPage}
                    className={isPending ? "pointer-events-none" : ""}
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
                  if (currentPage < totalPages && !isPending) handlePageChange(currentPage + 1)
                }}
                className={currentPage >= totalPages || isPending ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
