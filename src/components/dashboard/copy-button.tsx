"use client"

import { Button } from "@/components/ui/button"
import { displayShortUrl, shortUrl } from "@/lib/site"
import { cn } from "cn"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

async function writeToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for insecure contexts / older browsers / denied permissions.
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.append(textarea)
      textarea.select()
      const ok = document.execCommand("copy")
      textarea.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Copies a short link, toasts the outcome and reports `copied` for ~1.5 s. */
export function useCopyShortLink(slug: string) {
  const [copied, setCopied] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  async function copy() {
    const ok = await writeToClipboard(shortUrl(slug))
    if (!ok) {
      toast.error("Couldn't copy the link", {
        description: `Copy it manually: ${shortUrl(slug)}`,
      })
      return
    }
    clearTimeout(timeout.current)
    setCopied(true)
    timeout.current = setTimeout(() => setCopied(false), 1500)
    toast.success("Link copied", { description: displayShortUrl(slug) })
  }

  return { copied, copy }
}

export function CopyButton({
  slug,
  className,
  size = "icon-sm",
  variant = "ghost",
  label = false,
  autoFocus,
}: {
  slug: string
  className?: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
  /** Show a visible "Copy" / "Copied" label next to the icon. */
  label?: boolean
  autoFocus?: boolean
}) {
  const { copied, copy } = useCopyShortLink(slug)
  const Icon = copied ? CheckIcon : CopyIcon

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      autoFocus={autoFocus}
      aria-label={
        label
          ? undefined
          : copied
            ? `Copied ${displayShortUrl(slug)}`
            : `Copy ${displayShortUrl(slug)}`
      }
      className={cn(
        !label && "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "transition-transform",
          copied && "scale-110 text-success",
        )}
        aria-hidden
      />
      {label && <span>{copied ? "Copied" : "Copy link"}</span>}
    </Button>
  )
}
