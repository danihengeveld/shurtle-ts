import { ShellBackdrop } from "@/components/shell-backdrop";
import { cn } from "cn";

/*
 * Shared layout of the full-page status screens (404, error, expired link, slow down): text and
 * actions on the left, a piece of turtle art on the right, over the faded shell lattice.
 */

const DEFAULT_BACKDROP =
  "[mask-image:radial-gradient(ellipse_55%_70%_at_75%_50%,black_10%,transparent_75%)] max-lg:[mask-image:radial-gradient(ellipse_100%_50%_at_50%_85%,black_10%,transparent_75%)]";

/** Classes for the large call-to-action buttons (`<Button size="lg">`). */
export const statusCta = "h-12 rounded-xl px-6 text-base";

/** The page section and two-column grid; `children` are the columns (usually <StatusText> + art). */
export function StatusPage({
  backdropClassName = DEFAULT_BACKDROP,
  className,
  prelude,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  backdropClassName?: string;
  /** Rendered before the backdrop, e.g. an inline script. */
  prelude?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative isolate flex flex-1 items-center overflow-hidden",
        className,
      )}
      {...props}
    >
      {prelude}
      <ShellBackdrop className={backdropClassName} />
      <div className="container-page grid items-center gap-x-12 gap-y-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {children}
      </div>
    </section>
  );
}

/** The text column: eyebrow with a diamond marker, the page's h1, a lede, actions and an optional footer. */
export function StatusText({
  eyebrow,
  markerClassName,
  title,
  children,
  actions,
  footer,
}: {
  eyebrow: React.ReactNode;
  /** Background colour class of the diamond marker, e.g. `bg-destructive`. */
  markerClassName: string;
  title: React.ReactNode;
  /** The lede paragraph's content. */
  children: React.ReactNode;
  actions: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        <span
          aria-hidden="true"
          className={cn("size-2 rotate-45 rounded-[2px]", markerClassName)}
        />
        {eyebrow}
      </p>
      <h1 className="mt-5 font-display text-[2.5rem] leading-[1.02] font-bold tracking-[-0.04em] text-balance sm:text-6xl">
        {title}
      </h1>
      <p className="mt-6 max-w-lg text-lg/relaxed text-pretty text-muted-foreground">
        {children}
      </p>
      <div className="mt-9 flex flex-col gap-3 min-[25rem]:flex-row">
        {actions}
      </div>
      {footer}
    </div>
  );
}
