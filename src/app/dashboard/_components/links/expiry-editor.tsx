"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RENEWAL_WINDOW_MS, linkLifecycle } from "@/lib/link-lifecycle";
import { displayShortUrl } from "@/lib/site";
import { setShurtleExpiry } from "@/server/actions";
import { cn } from "cn";
import {
  CalendarClockIcon,
  CircleAlertIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  createContext,
  startTransition,
  use,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  ExpiryField,
  expiryIso,
  expiryIssue,
  initialExpiry,
  type ExpiryValue,
} from "../create/expiry-field";
import { ExpiryBadge, RenewalRing } from "../expiry-badge";
import {
  formatExpiry,
  formatRelative,
  formatTimeLeft,
  getExpiryStatus,
  pluralize,
  toTimeValue,
} from "../format";
import { SheetDialog } from "../sheet-dialog";
import { useNow } from "../time";

/*
 * Giving a link a new expiry: "Renew" for a link that expired less than 24 hours ago (it comes
 * back with the same slug and click history), "Change expiry" for a live one. One dialog serves
 * every trigger on the page (row buttons, menus, the expiry pill).
 */

/** What the dialog needs to know about a link. */
export type ExpiryTarget = {
  id: string;
  slug: string;
  expiresAt: Date | string | null;
  archived: boolean;
  hits: number;
};

type ExpiryEditorContextValue = {
  /** Opens the dialog for `link`; focus returns to `trigger` (or the list heading if it's gone). */
  openExpiryEditor: (link: ExpiryTarget, trigger: HTMLElement | null) => void;
};

const ExpiryEditorContext = createContext<ExpiryEditorContextValue | null>(
  null,
);

function useExpiryEditor() {
  const context = use(ExpiryEditorContext);
  if (!context)
    throw new Error(
      "useExpiryEditor must be used inside <ExpiryEditorProvider>",
    );
  return context;
}

function toDate(value: Date | string | null) {
  return value === null ? null : new Date(value);
}

/** Wraps a list of links. Render inside <ServerNowProvider> (the dialog shows live times). */
export function ExpiryEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<ExpiryTarget | null>(null);
  const [open, setOpen] = useState(false);
  // A fresh form (and default choice) each time the dialog opens.
  const [session, setSession] = useState(0);
  const [isBusy, setBusy] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);

  function openExpiryEditor(link: ExpiryTarget, element: HTMLElement | null) {
    trigger.current = element;
    setTarget(link);
    setSession((current) => current + 1);
    setOpen(true);
  }

  return (
    <ExpiryEditorContext value={{ openExpiryEditor }}>
      {children}
      {target && (
        <SheetDialog
          open={open}
          onOpenChange={(next) => !isBusy && setOpen(next)}
          className="sm:max-w-md"
          onCloseAutoFocus={(event) => {
            // Back to the control that opened it. A renewed link leaves the "Just expired" group,
            // taking its button along: keep keyboard and screen reader users in the list instead.
            event.preventDefault();
            if (trigger.current?.isConnected) trigger.current.focus();
            else document.getElementById("links-heading")?.focus();
          }}
        >
          <ExpiryEditorForm
            key={session}
            link={target}
            onBusyChange={setBusy}
            onDone={() => setOpen(false)}
          />
        </SheetDialog>
      )}
    </ExpiryEditorContext>
  );
}

function ExpiryEditorForm({
  link,
  onBusyChange,
  onDone,
}: {
  link: ExpiryTarget;
  onBusyChange: (busy: boolean) => void;
  onDone: () => void;
}) {
  const { now } = useNow();
  const expiresAt = toDate(link.expiresAt);
  const lifecycle = linkLifecycle({ expiresAt, archived: link.archived }, now);
  // Decided once: the window can run out while the dialog is open, which shouldn't turn a
  // "Renew" dialog into a "Change expiry" one.
  const [renew] = useState(() => lifecycle.state === "renewable");
  const [expiry, setExpiry] = useState<ExpiryValue>(() =>
    renew || !expiresAt
      ? {
          preset: renew ? "7" : "never",
          customTime: toTimeValue(new Date()),
        }
      : initialExpiry(expiresAt.toISOString()),
  );
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isPending, startSave] = useTransition();

  const windowOver = renew && lifecycle.state !== "renewable";
  const shortUrl = displayShortUrl(link.slug);

  function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = expiryIssue(expiry);
    if (issue) {
      setFieldError(issue);
      return;
    }
    const iso = expiryIso(expiry);

    onBusyChange(true);
    startSave(async () => {
      let result;
      try {
        result = await setShurtleExpiry(link.id, iso);
      } catch {
        result = {
          ok: false,
          error: "Something went wrong while saving. Please try again.",
        } as const;
      }
      onBusyChange(false);

      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      // Updates after an `await` leave the transition unless re-wrapped; closing inside it keeps
      // the dialog up until the refreshed list commits, so focus doesn't jump ahead of it.
      startTransition(onDone);
      const next = toDate(result.expiresAt);
      if (renew) {
        toast.success(`${shortUrl} is live again`, {
          description: next
            ? `It now expires ${formatExpiry(next)}.`
            : "It no longer expires.",
        });
      } else {
        toast.success("Expiry updated", {
          description: next
            ? `${shortUrl} now expires ${formatExpiry(next)}.`
            : `${shortUrl} no longer expires.`,
        });
      }
    });
  }

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <header className="px-5 pt-6 pr-16 pb-5 sm:px-7 sm:pt-7">
          <div
            aria-hidden
            className={cn(
              "mb-4 flex size-10 items-center justify-center rounded-full",
              renew
                ? "bg-brand-soft text-brand-ink dark:bg-brand-soft/60"
                : "bg-muted text-muted-foreground",
            )}
          >
            {renew ? (
              <RotateCcwIcon className="size-5" />
            ) : (
              <CalendarClockIcon className="size-5" />
            )}
          </div>
          <DialogPrimitive.Title className="font-display text-[1.375rem] leading-tight font-semibold tracking-tight">
            {renew ? "Renew " : "Change when "}
            <span className="font-mono text-[0.9em] font-medium break-all">
              /{link.slug}
            </span>
            {renew ? "" : " expires"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
            {renew && expiresAt ? (
              <>
                It stopped working {formatRelative(expiresAt, now)}. Renew it to
                bring it back with the same slug and its{" "}
                {pluralize(link.hits, "click")}.
              </>
            ) : expiresAt ? (
              <>It expires {formatExpiry(expiresAt)}.</>
            ) : (
              "It never expires."
            )}
          </DialogPrimitive.Description>

          {renew && (
            <RenewalCountdown
              releasesAt={
                lifecycle.state === "renewable" ? lifecycle.releasesAt : null
              }
              now={now}
              slug={link.slug}
            />
          )}
        </header>

        <div className="px-5 pb-6 sm:px-7">
          <ExpiryField
            value={expiry}
            onChange={(next) => {
              setExpiry(next);
              setFieldError(undefined);
            }}
            error={fieldError}
            errorId="expiry-editor-error"
          />
        </div>
      </div>

      {formError && (
        <p
          role="alert"
          className="mx-5 mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-[13px] leading-snug font-medium text-destructive sm:mx-7"
        >
          <CircleAlertIcon aria-hidden className="mt-px size-4 shrink-0" />
          {formError}
        </p>
      )}

      <div className="flex shrink-0 items-center gap-2 border-t bg-muted/30 px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-7 sm:py-4 dark:bg-transparent">
        <DialogPrimitive.Close asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            className="h-10 max-sm:flex-1 sm:h-9"
          >
            Cancel
          </Button>
        </DialogPrimitive.Close>
        <Button
          type="submit"
          disabled={isPending || windowOver}
          aria-disabled={isPending || windowOver}
          className="h-10 min-w-32 max-sm:flex-2 sm:h-9"
        >
          {isPending ? (
            <Spinner aria-hidden />
          ) : renew ? (
            <RotateCcwIcon aria-hidden />
          ) : null}
          {renew
            ? isPending
              ? "Renewing…"
              : "Renew link"
            : isPending
              ? "Saving…"
              : "Save"}
        </Button>
      </div>
    </form>
  );
}

/** How long the owner has left, ticking down; or why renewing is no longer possible. */
function RenewalCountdown({
  releasesAt,
  now,
  slug,
}: {
  releasesAt: Date | null;
  now: number;
  slug: string;
}) {
  if (!releasesAt) {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl border bg-muted/60 px-3.5 py-3 text-[13px] leading-snug">
        <CircleAlertIcon
          aria-hidden
          className="mt-px size-4 shrink-0 text-muted-foreground"
        />
        <span>
          Its 24 hours to renew just ran out, so{" "}
          <span className="font-mono">/{slug}</span> is now free for anyone to
          claim.
        </span>
      </p>
    );
  }
  const left = releasesAt.getTime() - now;
  return (
    <p className="mt-4 flex items-center gap-2.5 rounded-xl border border-brand-ink/20 bg-brand-soft/50 px-3.5 py-3 text-[13px] leading-snug dark:bg-brand-soft/25">
      <RenewalRing
        fraction={left / RENEWAL_WINDOW_MS}
        className="size-4 text-brand-ink"
      />
      <span>
        <span className="font-mono">/{slug}</span> stays yours for{" "}
        <span className="font-semibold tabular-nums">
          {formatTimeLeft(left)}
        </span>{" "}
        more. After that, anyone can claim it.
      </span>
    </p>
  );
}

/** "Renew" for a renewable link; renders nothing once its window is over. */
export function RenewButton({
  link,
  className,
}: {
  link: ExpiryTarget;
  className?: string;
}) {
  const { openExpiryEditor } = useExpiryEditor();
  const { now } = useNow();
  const { state } = linkLifecycle(
    { expiresAt: toDate(link.expiresAt), archived: link.archived },
    now,
  );
  if (state !== "renewable") return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={(event) => openExpiryEditor(link, event.currentTarget)}
      className={cn("rounded-lg", className)}
    >
      <RotateCcwIcon aria-hidden />
      Renew
      <span className="sr-only"> {displayShortUrl(link.slug)}</span>
    </Button>
  );
}

/** Opens the dialog from a menu item (which has no element to return focus to once it closes). */
export function useOpenExpiryEditor(link: ExpiryTarget) {
  const { openExpiryEditor } = useExpiryEditor();
  return (trigger: HTMLElement | null) => openExpiryEditor(link, trigger);
}

/**
 * The link's expiry pill. While a live link expires within a week, the pill is also a button that
 * opens "Change expiry": the warning comes with its fix.
 */
export function LinkExpiry({
  link,
  compact = false,
}: {
  link: ExpiryTarget;
  compact?: boolean;
}) {
  const { openExpiryEditor } = useExpiryEditor();
  const { now } = useNow();
  const expiresAt = toDate(link.expiresAt);
  const badge = (
    <ExpiryBadge
      expiresAt={link.expiresAt}
      archived={link.archived}
      compact={compact}
    />
  );

  const extendable =
    linkLifecycle({ expiresAt, archived: link.archived }, now).state ===
      "live" && getExpiryStatus(expiresAt, now).kind === "soon";
  if (!extendable) return badge;

  return (
    <button
      type="button"
      onClick={(event) => openExpiryEditor(link, event.currentTarget)}
      className="cursor-pointer rounded-full transition-[filter,box-shadow] outline-none hover:brightness-[0.97] focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:brightness-110"
    >
      {badge}
      <span className="sr-only">
        : change expiry of {displayShortUrl(link.slug)}
      </span>
    </button>
  );
}
