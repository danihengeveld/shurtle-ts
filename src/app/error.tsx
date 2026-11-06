"use client" // Error boundaries must be Client Components

import { ErrorView, errorDigest } from "@/components/marketing/error-view"
import { siteInfo } from "@/lib/site"
import Link from "next/link"
import { useEffect } from "react"

export default function RootError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <title>{`Something went wrong · ${siteInfo.name}`}</title>
      <ErrorView
        retry={retry}
        digest={errorDigest(error)}
        homeLink={<Link href="/">Back to home</Link>}
      />
    </>
  )
}
