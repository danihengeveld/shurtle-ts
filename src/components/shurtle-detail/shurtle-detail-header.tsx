"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SerializedShurtle } from "@/app/shurtle/[slug]/page"
import { deleteShurtle } from "@/lib/actions"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowLeft, Copy, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

interface ShurtleDetailHeaderProps {
  shurtle: SerializedShurtle
}

export function ShurtleDetailHeader({ shurtle }: ShurtleDetailHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${shurtle.slug}`)
    toast.success("Copied to clipboard", {
      description: "The shortened URL has been copied to your clipboard.",
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteShurtle(shurtle.slug)
      toast.success("Shurtle deleted successfully", {
        description: "The shurtle has been deleted and will no longer be accessible."
      })
      router.push('/dashboard')
    })
    setConfirmDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <CardTitle className="text-2xl">{shurtle.slug}</CardTitle>
                <p className="text-muted-foreground">Shurtle Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Destination URL</p>
              <Link
                href={shurtle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
              >
                {shurtle.url}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </Link>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Hits</p>
              <Badge variant="secondary" className="text-lg px-3 py-1">{shurtle.hits}</Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm" title={format(new Date(shurtle.createdAt), "PPpp")}>
                {formatDistanceToNow(new Date(shurtle.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {shurtle.expiresAt ? 'Expires' : 'Status'}
              </p>
              <p className="text-sm">
                {shurtle.expiresAt 
                  ? formatDistanceToNow(new Date(shurtle.expiresAt), { addSuffix: true })
                  : "Never expires"
                }
              </p>
            </div>
          </div>
          
          {shurtle.lastHitAt && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Last hit: {formatDistanceToNow(new Date(shurtle.lastHitAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this shurtle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The shortened URL will no longer work and all analytics data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}