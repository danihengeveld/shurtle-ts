"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

const noopSubscribe = () => () => {};

/** How long the new theme takes to spread across the page. */
const REVEAL_MS = 550;

/**
 * Switches the theme with the new one spreading out from `origin` in a growing circle, where the
 * browser supports view transitions and motion is welcome; otherwise it just switches.
 */
function revealTheme(origin: HTMLElement | null, change: () => void) {
  if (
    !origin ||
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    change();
    return;
  }

  const { left, top, width, height } = origin.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  // Far enough to cover the farthest corner of the viewport.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  // Scopes the reveal's CSS (globals.css) to this transition, not React's.
  root.dataset.themeReveal = "";
  // The new theme has to be on the page before the browser captures it: flushSync applies it now.
  const transition = document.startViewTransition(() => flushSync(change));
  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: REVEAL_MS,
          // Even growth: a sharp ease-out covers the screen early, then seems to stall.
          easing: "cubic-bezier(0.45, 0, 0.25, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  transition.finished.finally(() => {
    delete root.dataset.themeReveal;
  });
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const trigger = useRef<HTMLButtonElement>(null);
  // The theme picked in the menu, applied once the menu has closed: otherwise the closing menu ends
  // up in the reveal's snapshot and vanishes in one frame when it ends.
  const picked = useRef<string | null>(null);
  // next-themes only knows the stored choice on the client; render a neutral state until hydrated.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const current = hydrated
    ? (THEMES.find((t) => t.value === theme) ?? THEMES[2])
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
          aria-label={current ? `Theme: ${current.label}` : "Theme"}
        >
          {current ? (
            <current.Icon className="size-[1.125rem]" />
          ) : (
            <>
              {/* Before hydration, follow the class next-themes put on <html>. */}
              <Sun className="size-[1.125rem] dark:hidden" />
              <Moon className="hidden size-[1.125rem] dark:block" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-xl p-1.5"
        // Runs after the menu's exit animation, as focus goes back to the toggle.
        onCloseAutoFocus={() => {
          const value = picked.current;
          picked.current = null;
          if (value) revealTheme(trigger.current, () => setTheme(value));
        }}
      >
        <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={hydrated ? theme : undefined}
          onValueChange={(value) => {
            picked.current = value === theme ? null : value;
          }}
        >
          {THEMES.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="h-9 rounded-lg"
            >
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
