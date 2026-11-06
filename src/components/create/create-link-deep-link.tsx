"use client"

import { isValidSlug } from "@/lib/slugs"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useEffectEvent } from "react"
import { useCreateLink } from "./create-link-provider"

/**
 * `?new=<slug>` (e.g. from the 404 page's "claim this slug" CTA) opens the create dialog with the
 * slug prefilled, then removes the parameter so a refresh doesn't reopen it.
 * Render inside <Suspense> (it reads search params).
 */
export function CreateLinkDeepLink() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { openCreate } = useCreateLink()
  const requested = searchParams.get("new")

  const handleRequest = useEffectEvent((value: string) => {
    const slug = value.trim()
    if (isValidSlug(slug)) openCreate({ slug })

    const remaining = new URLSearchParams(searchParams.toString())
    remaining.delete("new")
    const query = remaining.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  })

  useEffect(() => {
    if (requested !== null) handleRequest(requested)
  }, [requested])

  return null
}
