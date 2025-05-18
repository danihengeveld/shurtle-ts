"use client"

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface SuccessCardProps {
  data: {
    slug: string
    url: string
  }
  onCreateAnother?: () => void
}

export function SuccessCard({ data, onCreateAnother }: SuccessCardProps) {
  const shortUrl = `${window.location.origin}/${data.slug}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl)
    toast.message("Copied to clipboard", {
      description: "The shortened URL has been copied to your clipboard.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-5 w-5" />
        <h3 className="text-lg font-medium">Shurtle Created Successfully!</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="short-url">Shortened URL</Label>
          <div className="flex gap-2">
            <Input id="short-url" value={shortUrl} readOnly className="bg-muted/50" />
            <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="original-url">Original URL</Label>
          <div className="flex gap-2">
            <Input id="original-url" value={data.url} readOnly className="bg-muted/50" />
            <Button variant="outline" size="icon" asChild title="Visit original URL">
              <a href={data.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Visit original URL</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCreateAnother && (
          <Button variant="outline" onClick={onCreateAnother}>
            Create Another
          </Button>
        )}
        <DialogClose asChild>
          <Button>Done</Button>
        </DialogClose>
      </div>
    </div>
  )
}
