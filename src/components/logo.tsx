import { cn } from "@/lib/utils"

/**
 * The Shurtle turtle, drawn as a single rounded stroke so it stays crisp from favicon size up to
 * hero size. The stroke follows `currentColor`; the shell can carry a lime fill as the brand accent.
 */
export const TURTLE_PATH =
  // back leg (free end) → foot → belly
  "M11.2 28.2 L7.3 32.6 C6.3 33.8 6.9 35.6 8.6 35.6 H13.4 C15.2 35.6 16.6 34.7 17.8 33 C18.7 31.7 19.6 30.4 21.4 30.4 H33.2" +
  // front leg → foot → neck front → head
  " C34.3 30.4 34.6 31.3 34 32.2 L32.9 33.8 C32.2 34.8 32.8 35.6 33.9 35.6 H38.2 C41.2 35.6 42.4 32.5 44.3 29.6" +
  " C46.2 26.7 48.4 24.6 52 23 C56.3 21.1 61.7 18.8 61.7 12.6 A6.9 6.9 0 0 0 48.2 10.4" +
  // neck back → base line → tail → shell
  " C47.3 13.4 46.6 16.4 45.4 19.4 C44.3 22.2 42.3 23.4 38.8 23.4 H2.8" +
  " C5.4 23.4 6.9 22.3 8.3 20.1 L13.4 11.6 C15.9 7.4 19.2 4.6 24.3 4.6 H28.6 C33.4 4.6 36.3 7 38.6 10.9 L42.6 18.2"

export const SHELL_PATH =
  "M5.8 23.4 C6.9 22.6 7.6 21.4 8.3 20.1 L13.4 11.6 C15.9 7.4 19.2 4.6 24.3 4.6 H28.6 C33.4 4.6 36.3 7 38.6 10.9 L42.6 18.2 C41.9 20.5 40.8 23.4 38.8 23.4 Z"

interface LogoMarkProps extends React.ComponentProps<"svg"> {
  /** Fill the shell with the lime brand accent. */
  accent?: boolean
  /** Accessible name. Omit when the mark is decorative (e.g. next to the wordmark). */
  title?: string
}

export function LogoMark({ accent = true, title, className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 2 64 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-8 w-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
      {accent && <path d={SHELL_PATH} className="fill-brand" stroke="none" />}
      <path d={TURTLE_PATH} />
      <circle cx="54.6" cy="12.8" r="1.55" fill="currentColor" stroke="none" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  /** Classes for the mark; its height sets the overall size (default `h-7`). */
  markClassName?: string
  /** Classes for the wordmark, e.g. to hide it visually on very narrow screens (keep it for SR). */
  wordmarkClassName?: string
  accent?: boolean
}

/** Mark + wordmark. The wordmark carries the accessible name; the mark is decorative. */
export function Logo({ className, markClassName, wordmarkClassName, accent = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <LogoMark accent={accent} className={cn("h-7", markClassName)} />
      <span
        className={cn("font-display text-[1.375rem] leading-none font-bold tracking-[-0.03em]", wordmarkClassName)}
      >
        Shurtle
      </span>
    </span>
  )
}
