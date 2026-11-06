"use client" // Error boundaries must be Client Components

import { Logo } from "@/components/logo"
import { ErrorView, errorDigest } from "@/components/marketing/error-view"
import { siteInfo } from "@/lib/site"
import { useEffect, useSyncExternalStore } from "react"
import "./globals.css"

/*
 * Replaces the root layout when it fails, so none of its providers, fonts or theme handling exist
 * here. Styles come from globals.css; fonts fall back to the system stack; the theme is re-derived
 * from what next-themes stored (`theme` in localStorage) and the OS preference.
 */

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme"),d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches),e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}`

function readIsDark() {
  try {
    const stored = localStorage.getItem("theme")
    return stored === "dark" || (stored !== "light" && matchMedia("(prefers-color-scheme: dark)").matches)
  } catch {
    return false
  }
}

function subscribeToScheme(onChange: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)")
  media.addEventListener("change", onChange)
  window.addEventListener("storage", onChange)
  return () => {
    media.removeEventListener("change", onChange)
    window.removeEventListener("storage", onChange)
  }
}

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const dark = useSyncExternalStore(subscribeToScheme, readIsDark, () => false)

  useEffect(() => {
    console.error(error)
  }, [error])

  // Plain anchors: a full page load is the most reliable way out of a broken root layout.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  const homeLink = <a href="/">Back to home</a>

  return (
    <html
      lang="en"
      className={dark ? "dark" : undefined}
      style={{ colorScheme: dark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <head>
        <title>{`Something went wrong · ${siteInfo.name}`}</title>
        <script
          // Applies the theme before first paint when this page is server-rendered.
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <header className="border-b border-border/70">
          <div className="container-page flex h-16 items-center">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload escapes a broken root layout */}
            <a href="/" className="-ml-1.5 flex h-10 items-center rounded-lg px-1.5">
              <Logo />
            </a>
          </div>
        </header>
        <main id="main" className="flex flex-1 flex-col">
          <ErrorView retry={retry} digest={errorDigest(error)} homeLink={homeLink} />
        </main>
      </body>
    </html>
  )
}
