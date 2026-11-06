"use client"

import { DEFAULT_PER_PAGE, MAX_SEARCH_LENGTH, type PerPage } from "@/lib/pagination"
import { cn } from "cn"
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLinks } from "./links-provider"

const DEBOUNCE_MS = 300

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

/**
 * Server-side search via `?q=`. Typing updates the URL (debounced) inside a transition, so the
 * input stays responsive and the current results remain visible until the new ones arrive.
 * Without JavaScript it is a plain GET form.
 */
export function LinkSearch({ query, perPage, className }: { query: string; perPage: PerPage; className?: string }) {
  const { basePath, navigate, isNavigating } = useLinks()
  const [value, setValue] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)
  const [requestedQuery, setRequestedQuery] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  // The URL changed from elsewhere (e.g. "Clear search", back button): reflect it in the input,
  // but never clobber what the user is typing for a request that is still on its way.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if (query !== requestedQuery) {
      setValue(query)
      setRequestedQuery(query)
    }
  }

  useEffect(() => () => clearTimeout(debounce.current), [])

  // "/" focuses the search, like on GitHub or Linear.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return
      if (document.querySelector("[role=dialog], [role=alertdialog], [role=menu]")) return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function search(next: string) {
    clearTimeout(debounce.current)
    const trimmed = next.trim().slice(0, MAX_SEARCH_LENGTH)
    if (trimmed === requestedQuery) return
    setRequestedQuery(trimmed)
    navigate({ query: trimmed, perPage, page: 1 })
  }

  function onChange(next: string) {
    setValue(next)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(next), DEBOUNCE_MS)
  }

  function clear() {
    setValue("")
    search("")
    inputRef.current?.focus()
  }

  const showSpinner = isNavigating && requestedQuery === value.trim()

  return (
    <form
      role="search"
      action={basePath}
      method="get"
      onSubmit={(event) => {
        event.preventDefault()
        search(value)
      }}
      className={cn("group relative", className)}
    >
      <label htmlFor="link-search" className="sr-only">
        Search links
      </label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        id="link-search"
        name="q"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault()
            clear()
          }
        }}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Search slugs and URLs"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        enterKeyHint="search"
        aria-keyshortcuts="/"
        className={cn(
          "h-10 w-full rounded-xl border border-input bg-card pr-10 pl-9 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground sm:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {perPage !== DEFAULT_PER_PAGE && <input type="hidden" name="perPage" value={perPage} />}

      <div className="absolute inset-y-0 right-1 flex items-center">
        {showSpinner ? (
          <span className="flex size-8 items-center justify-center" role="status">
            <LoaderCircleIcon aria-hidden className="size-4 animate-spin text-muted-foreground" />
            <span className="sr-only">Searching…</span>
          </span>
        ) : value ? (
          <button
            type="button"
            onClick={clear}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <XIcon aria-hidden className="size-4" />
            <span className="sr-only">Clear search</span>
          </button>
        ) : (
          <kbd
            aria-hidden
            className="pointer-events-none mr-1.5 hidden h-5 min-w-5 items-center justify-center rounded-md border bg-muted px-1 font-mono text-[11px] text-muted-foreground group-focus-within:hidden md:inline-flex"
          >
            /
          </kbd>
        )}
      </div>
    </form>
  )
}
