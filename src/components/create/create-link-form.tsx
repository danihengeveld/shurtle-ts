"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import type { CreateShurtleFormState } from "@/lib/actions";
import { siteInfo } from "@/lib/site";
import { SLUG_MAX_LENGTH, SLUG_PATTERN, isReservedSlug } from "@/lib/slugs";
import { cn } from "cn";
import {
  CircleAlertIcon,
  ChevronDownIcon,
  LinkIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import {
  Collapsible as CollapsiblePrimitive,
  Dialog as DialogPrimitive,
} from "radix-ui";
import { startTransition, useEffect, useRef, useState } from "react";
import { splitUrl } from "../dashboard/format";
import {
  ExpiryField,
  describeExpiry,
  expiryIso,
  expiryIssue,
  initialExpiry,
  type ExpiryValue,
} from "./expiry-field";

/** Mirrors URL_MAX_LENGTH in src/lib/schemas.ts (not imported to keep zod out of the client bundle). */
const URL_MAX_LENGTH = 2048;

type FieldName = "url" | "slug" | "expiresAt";
type FieldErrors = Partial<Record<FieldName, string>>;

function slugIssue(slug: string) {
  if (!slug) return undefined;
  if (slug.length > SLUG_MAX_LENGTH)
    return `Keep it to ${SLUG_MAX_LENGTH} characters or fewer.`;
  if (!SLUG_PATTERN.test(slug))
    return "Use only letters, numbers, hyphens (-) and underscores (_).";
  if (isReservedSlug(slug))
    return `“${slug}” is reserved by ${siteInfo.name}. Please choose another one.`;
  return undefined;
}

function validate(url: string, slug: string, expiry: ExpiryValue): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = url.trim();
  if (!trimmed) errors.url = "Enter the URL you want to shorten.";
  else if (trimmed.length > URL_MAX_LENGTH)
    errors.url = `That URL is too long (max ${URL_MAX_LENGTH} characters).`;
  const slugError = slugIssue(slug.trim());
  if (slugError) errors.slug = slugError;
  const expiryError = expiryIssue(expiry);
  if (expiryError) errors.expiresAt = expiryError;
  return errors;
}

function withoutError(errors: FieldErrors, field: FieldName): FieldErrors {
  return { ...errors, [field]: undefined };
}

/** Shurtle sizing on top of shadcn's InputGroup: a taller, rounder field on the card surface. */
const groupClass =
  "h-11 rounded-xl bg-card has-[[data-slot=input-group-control]:focus-visible]:ring-ring/40";

/**
 * FieldError with an icon. Not a live region (`role="alert"` by default): errors are tied to their
 * input via aria-describedby and focus moves to the first invalid field on submit, while the slug
 * re-validates on every keystroke and would otherwise interrupt screen readers constantly.
 */
function FormError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <FieldError
      id={id}
      role={undefined}
      className="flex items-start gap-1.5 text-[13px] leading-snug font-medium"
    >
      <CircleAlertIcon aria-hidden className="mt-px size-3.5 shrink-0" />
      {children}
    </FieldError>
  );
}

export function CreateLinkForm({
  state,
  formAction,
  isPending,
  initialSlug,
}: {
  state: CreateShurtleFormState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  initialSlug?: string;
}) {
  const initialFields = state.status === "error" ? state.fields : undefined;
  const [url, setUrl] = useState(initialFields?.url ?? "");
  const [slug, setSlug] = useState(initialFields?.slug ?? initialSlug ?? "");
  const [expiry, setExpiry] = useState<ExpiryValue>(() =>
    initialExpiry(initialFields?.expiresAt),
  );
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(
      initialSlug ||
      initialFields?.slug ||
      initialFields?.expiresAt ||
      hasAdvancedError(state),
    ),
  );
  const [seenState, setSeenState] = useState(state);
  const urlRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);

  // A new server response with slug/expiry errors: make sure those fields are visible.
  if (state !== seenState) {
    setSeenState(state);
    if (hasAdvancedError(state)) setAdvancedOpen(true);
  }

  // Move focus to the first invalid field after a failed submit.
  useEffect(() => {
    if (state.status !== "error") return;
    if (state.errors.url) urlRef.current?.focus();
    else if (state.errors.slug) slugRef.current?.focus();
  }, [state]);

  const expiresAt = expiryIso(expiry);
  const values = { url, slug, expiresAt };

  /** Client errors win; server errors show until the user edits that field. */
  function errorFor(field: FieldName) {
    if (clientErrors[field]) return clientErrors[field];
    if (state.status === "error" && state.fields[field] === values[field])
      return state.errors[field]?.[0];
    return undefined;
  }

  const liveSlugError = slugIssue(slug.trim());
  const errors = {
    url: errorFor("url"),
    slug: liveSlugError ?? errorFor("slug"),
    expiresAt: errorFor("expiresAt"),
  };
  const formError =
    state.status === "error" ? state.errors.form?.[0] : undefined;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const found = validate(url, slug, expiry);
    setClientErrors(found);
    if (found.url) return urlRef.current?.focus();
    if (found.slug || found.expiresAt) {
      setAdvancedOpen(true);
      if (found.slug) requestAnimationFrame(() => slugRef.current?.focus());
      return;
    }

    // Built from state rather than the DOM: values survive the collapsed section and failed submits.
    const formData = new FormData();
    formData.set("url", url.trim());
    formData.set("slug", slug.trim());
    // Recomputed at submit time: presets count from the moment the link is created.
    formData.set("expiresAt", expiryIso(expiry));
    startTransition(() => formAction(formData));
  }

  const destination = url.trim()
    ? splitUrl(
        /^[a-z][a-z\d+.-]*:\/\//i.test(url.trim())
          ? url.trim()
          : `https://${url.trim()}`,
      )
    : null;
  const summary = [
    slug.trim() ? `/${slug.trim()}` : "Random slug",
    describeExpiry(expiry),
  ].join(" · ");

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-7">
        <div className="grid gap-6">
          {formError && (
            <Alert
              variant="destructive"
              className="rounded-xl border-destructive/30 bg-destructive/5"
            >
              <CircleAlertIcon aria-hidden />
              <AlertTitle>We couldn&apos;t create that link</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Field className="gap-2">
            <FieldLabel htmlFor="create-url">Destination URL</FieldLabel>
            <InputGroup className={groupClass}>
              <InputGroupAddon className="pl-3.5">
                <LinkIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                ref={urlRef}
                id="create-url"
                name="url"
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder="example.com/a/very/long/link"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (clientErrors.url)
                    setClientErrors((current) => withoutError(current, "url"));
                }}
                maxLength={URL_MAX_LENGTH}
                aria-invalid={Boolean(errors.url) || undefined}
                aria-describedby={errors.url ? "create-url-error" : undefined}
                className="h-full text-base placeholder:text-muted-foreground/80 md:text-base"
              />
            </InputGroup>
            <FormError id="create-url-error">{errors.url}</FormError>
          </Field>

          <LinkPreview
            slug={slug.trim()}
            slugValid={!liveSlugError}
            destination={destination}
          />

          <CollapsiblePrimitive.Root
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            className="-mt-1"
          >
            <CollapsiblePrimitive.Trigger
              type="button"
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input px-3.5 py-2.5 text-left transition-colors outline-none hover:border-solid hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-solid max-sm:min-h-12"
            >
              <SlidersHorizontalIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Customize</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {summary}
                </span>
              </span>
              <ChevronDownIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </CollapsiblePrimitive.Trigger>

            {/* Force-mounted so the fields keep their values (and stay in sync) while collapsed. */}
            <CollapsiblePrimitive.Content
              forceMount
              className="grid gap-6 pt-5 data-[state=closed]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1"
            >
              <Field className="gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <FieldLabel htmlFor="create-slug">
                    Custom slug{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FieldLabel>
                  <span
                    aria-hidden
                    className={cn(
                      "font-mono text-[11px] text-muted-foreground tabular-nums",
                      slug.length > SLUG_MAX_LENGTH && "text-destructive",
                    )}
                  >
                    {slug.length}/{SLUG_MAX_LENGTH}
                  </span>
                </div>
                <InputGroup className={cn(groupClass, "overflow-hidden")}>
                  <InputGroupAddon
                    aria-hidden
                    className="h-full self-stretch border-r bg-muted/60 pr-2.5 pl-3.5 font-mono font-normal dark:bg-transparent"
                  >
                    {siteInfo.baseUrl.host}/
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={slugRef}
                    id="create-slug"
                    name="slug"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="my-link"
                    value={slug}
                    onChange={(event) => {
                      setSlug(event.target.value);
                      if (clientErrors.slug)
                        setClientErrors((current) =>
                          withoutError(current, "slug"),
                        );
                    }}
                    aria-invalid={Boolean(errors.slug) || undefined}
                    aria-describedby={
                      errors.slug
                        ? "create-slug-error create-slug-hint"
                        : "create-slug-hint"
                    }
                    className="h-full px-2.5 font-mono text-base placeholder:text-muted-foreground/70 sm:text-sm"
                  />
                </InputGroup>
                <FormError id="create-slug-error">{errors.slug}</FormError>
                <FieldDescription id="create-slug-hint" className="text-[13px]">
                  Letters, numbers, - and _. Leave empty for a random one.
                </FieldDescription>
              </Field>

              <ExpiryField
                value={expiry}
                onChange={(next) => {
                  setExpiry(next);
                  if (clientErrors.expiresAt)
                    setClientErrors((current) =>
                      withoutError(current, "expiresAt"),
                    );
                }}
                error={errors.expiresAt}
                errorId="create-expiry-error"
              />
            </CollapsiblePrimitive.Content>
          </CollapsiblePrimitive.Root>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t bg-muted/30 px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-7 sm:py-4 dark:bg-transparent">
        <DialogPrimitive.Close asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-10 max-sm:flex-1 sm:h-9"
          >
            Cancel
          </Button>
        </DialogPrimitive.Close>
        <Button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className="h-10 min-w-32 max-sm:flex-2 sm:h-9"
        >
          {isPending && <Spinner aria-hidden />}
          {isPending ? "Creating…" : "Create link"}
        </Button>
      </div>
    </form>
  );
}

function hasAdvancedError(state: CreateShurtleFormState) {
  return (
    state.status === "error" &&
    Boolean(state.errors.slug || state.errors.expiresAt)
  );
}

function LinkPreview({
  slug,
  slugValid,
  destination,
}: {
  slug: string;
  slugValid: boolean;
  destination: { host: string; rest: string } | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground dark:bg-brand-soft dark:text-foreground">
      <p className="text-[11px] font-medium tracking-wide uppercase opacity-70">
        Preview
      </p>
      <p className="mt-1 truncate font-mono text-[15px] leading-6 sm:text-base">
        <span className="opacity-70">{siteInfo.baseUrl.host}/</span>
        {slug ? (
          <span
            className={cn(
              "font-semibold",
              slugValid
                ? "text-brand dark:text-brand-ink"
                : "line-through opacity-70",
            )}
          >
            {slug}
          </span>
        ) : (
          <span className="italic opacity-55">auto-generated</span>
        )}
      </p>
      <p className="mt-0.5 truncate text-xs opacity-70">
        {destination ? (
          <>
            <span aria-hidden>→ </span>
            <span className="sr-only">Redirects to </span>
            {destination.host}
            {destination.rest}
          </>
        ) : (
          "Redirects to your destination URL"
        )}
      </p>
    </div>
  );
}
