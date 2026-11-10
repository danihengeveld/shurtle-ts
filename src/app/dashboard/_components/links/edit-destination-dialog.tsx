"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { displayShortUrl } from "@/lib/site";
import { setShurtleUrl } from "@/server/actions";
import { CircleAlertIcon, LinkIcon, PencilIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { startTransition, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { pluralize, splitUrl } from "../format";
import { SheetDialog } from "../sheet-dialog";

/** Mirrors URL_MAX_LENGTH in src/lib/schemas.ts (not imported to keep zod out of the client bundle). */
const URL_MAX_LENGTH = 2048;

/** What the dialog needs to know about a link. */
export type DestinationTarget = {
  id: string;
  slug: string;
  url: string;
  hits: number;
};

/**
 * "Edit destination": points a link somewhere else, keeping its slug and click history. Only
 * offered while the link holds its slug (live or renewable); the server checks that again. The
 * URL is validated on the server, like a new link's, so the rules live in one place.
 */
export function EditDestinationDialog({
  link,
  open,
  onOpenChange,
  returnFocus,
}: {
  link: DestinationTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes when the dialog closes (e.g. the menu button that opened it). */
  returnFocus: () => void;
}) {
  const [isBusy, setBusy] = useState(false);

  return (
    <SheetDialog
      open={open}
      onOpenChange={(next) => !isBusy && onOpenChange(next)}
      className="sm:max-w-md"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        returnFocus();
      }}
    >
      {/* Content unmounts while closed, so each opening starts from the current destination. */}
      <EditDestinationForm
        link={link}
        onBusyChange={setBusy}
        onDone={() => onOpenChange(false)}
      />
    </SheetDialog>
  );
}

function EditDestinationForm({
  link,
  onBusyChange,
  onDone,
}: {
  link: DestinationTarget;
  onBusyChange: (busy: boolean) => void;
  onDone: () => void;
}) {
  const [url, setUrl] = useState(link.url);
  const [error, setError] = useState<string>();
  const [isPending, startSave] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const shortUrl = displayShortUrl(link.slug);

  function fail(message: string) {
    setError(message);
    inputRef.current?.focus();
  }

  function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return fail("Enter the URL this link should go to.");
    if (trimmed.length > URL_MAX_LENGTH)
      return fail(`That URL is too long (max ${URL_MAX_LENGTH} characters).`);
    if (trimmed === link.url) return onDone();

    onBusyChange(true);
    startSave(async () => {
      let result;
      try {
        result = await setShurtleUrl(link.id, trimmed);
      } catch {
        result = {
          ok: false,
          error: "Something went wrong while saving. Please try again.",
        } as const;
      }
      onBusyChange(false);

      if (!result.ok) {
        fail(result.error);
        return;
      }
      // Updates after an `await` leave the transition unless re-wrapped; closing inside it keeps
      // the dialog up until the refreshed page commits, so focus doesn't jump ahead of it.
      startTransition(onDone);
      toast.success("Destination updated", {
        description: `${shortUrl} now goes to ${splitUrl(result.url).host}.`,
      });
    });
  }

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <header className="px-5 pt-6 pr-16 pb-5 sm:px-7 sm:pt-7">
          <div
            aria-hidden
            className="mb-4 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <PencilIcon className="size-5" />
          </div>
          <DialogPrimitive.Title className="font-display text-[1.375rem] leading-tight font-semibold tracking-tight">
            Change where{" "}
            <span className="font-mono text-[0.9em] font-medium break-all">
              /{link.slug}
            </span>{" "}
            goes
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
            It keeps its slug and its {pluralize(link.hits, "click")}. Visitors
            go to the new destination right away.
          </DialogPrimitive.Description>
        </header>

        <div className="px-5 pb-6 sm:px-7">
          <Field className="gap-2">
            <FieldLabel htmlFor="edit-destination-url">
              Destination URL
            </FieldLabel>
            <InputGroup className="h-11 rounded-xl bg-card has-[[data-slot=input-group-control]:focus-visible]:ring-ring/40">
              <InputGroupAddon className="pl-3.5">
                <LinkIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                ref={inputRef}
                id="edit-destination-url"
                name="url"
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(undefined);
                }}
                onFocus={(event) => event.currentTarget.select()}
                maxLength={URL_MAX_LENGTH}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? "edit-destination-error" : undefined}
                className="h-full text-base placeholder:text-muted-foreground/80 md:text-base"
              />
            </InputGroup>
            {error && (
              <FieldError
                id="edit-destination-error"
                className="flex items-start gap-1.5 text-[13px] leading-snug font-medium"
              >
                <CircleAlertIcon
                  aria-hidden
                  className="mt-px size-3.5 shrink-0"
                />
                {error}
              </FieldError>
            )}
          </Field>
        </div>
      </div>

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
          disabled={isPending}
          className="h-10 min-w-32 max-sm:flex-2 sm:h-9"
        >
          {isPending && <Spinner aria-hidden />}
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
