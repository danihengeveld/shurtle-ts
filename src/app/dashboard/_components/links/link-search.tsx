"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import {
  DEFAULT_PER_PAGE,
  MAX_SEARCH_LENGTH,
  linksHref,
  linksPath,
  parseLinkListQuery,
  statusFromPath,
} from "@/lib/link-list";
import { cn } from "cn";
import { SearchIcon, XIcon } from "lucide-react";
import { shouldIgnoreShortcut } from "@/lib/keyboard";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLinks } from "./links-provider";

const DEBOUNCE_MS = 300;

/**
 * Server-side search via `?q=`. Typing updates the URL (debounced) inside a transition, so the
 * input stays responsive and the current results remain visible until the new ones arrive.
 * Without JavaScript it is a plain GET form. Lives in the dashboard layout, so it keeps focus and
 * what was typed across status switches; render inside <Suspense> (reads search params).
 */
export function LinkSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = statusFromPath(pathname);
  const { query, perPage } = parseLinkListQuery(
    status,
    Object.fromEntries(searchParams),
  );
  const { navigate, pending } = useLinks();
  const [value, setValue] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  const [requestedQuery, setRequestedQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The debounced call must use the status and page size at the time it fires, not when the user
  // typed: switching tabs mid-debounce would otherwise navigate back to the old tab.
  const latestSearch = useRef<(next: string) => void>(undefined);

  // The URL changed from elsewhere (e.g. "Clear search", back button): reflect it in the input,
  // but never clobber what the user is typing for a request that is still on its way.
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    if (query !== requestedQuery) {
      setValue(query);
      setRequestedQuery(query);
    }
  }

  useEffect(() => () => clearTimeout(debounce.current), []);

  // "/" focuses the search, like on GitHub or Linear.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || shouldIgnoreShortcut(event)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function search(next: string) {
    clearTimeout(debounce.current);
    const trimmed = next.trim().slice(0, MAX_SEARCH_LENGTH);
    if (trimmed === requestedQuery) return;
    setRequestedQuery(trimmed);
    navigate(linksHref({ status, query: trimmed, perPage }), {
      source: "search",
    });
  }

  useEffect(() => {
    latestSearch.current = search;
  });

  function onChange(next: string) {
    setValue(next);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => latestSearch.current?.(next),
      DEBOUNCE_MS,
    );
  }

  function clear() {
    setValue("");
    search("");
    inputRef.current?.focus();
  }

  // Only for searches: pagination and page-size changes dim the list but aren't "Searching…".
  const showSpinner = pending === "search" && requestedQuery === value.trim();

  return (
    <form
      role="search"
      action={linksPath(status)}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        search(value);
      }}
      className={cn("group relative", className)}
    >
      <label htmlFor="link-search" className="sr-only">
        Search links
      </label>
      <InputGroup className="h-10 rounded-xl bg-card has-[[data-slot=input-group-control]:focus-visible]:ring-ring/40">
        <InputGroupAddon>
          <SearchIcon aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id="link-search"
          name="q"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value) {
              event.preventDefault();
              clear();
            }
          }}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Search slugs and URLs"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          enterKeyHint="search"
          aria-keyshortcuts="/"
          className="h-full text-base placeholder:text-muted-foreground sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />
        <InputGroupAddon align="inline-end">
          {showSpinner ? (
            <span
              className="flex size-8 items-center justify-center"
              role="status"
            >
              <Spinner aria-hidden />
              <span className="sr-only">Searching…</span>
            </span>
          ) : value ? (
            <InputGroupButton
              size="icon-sm"
              onClick={clear}
              className="rounded-lg"
            >
              <XIcon aria-hidden />
              <span className="sr-only">Clear search</span>
            </InputGroupButton>
          ) : (
            <Kbd
              aria-hidden
              className="hidden md:inline-flex md:group-focus-within:hidden"
            >
              /
            </Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>
      {perPage !== DEFAULT_PER_PAGE && (
        <input type="hidden" name="perPage" value={perPage} />
      )}
    </form>
  );
}
