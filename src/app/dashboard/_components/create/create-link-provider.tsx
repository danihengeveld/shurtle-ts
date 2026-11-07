"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { shouldIgnoreShortcut } from "@/lib/keyboard";
import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import { createContext, use, useEffect, useState } from "react";
import { CreateLinkDialog } from "./create-link-dialog";

type CreateLinkContextValue = {
  openCreate: (options?: { slug?: string }) => void;
};

const CreateLinkContext = createContext<CreateLinkContextValue | null>(null);

export function useCreateLink() {
  const context = use(CreateLinkContext);
  if (!context)
    throw new Error("useCreateLink must be used inside <CreateLinkProvider>");
  return context;
}

/**
 * Owns the "create a link" dialog so any button on the page (header, empty state, deep link) can
 * open it. Every opening starts a fresh flow (new form + action state); "Create another" does too.
 */
export function CreateLinkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [flow, setFlow] = useState<{
    open: boolean;
    id: number;
    slug?: string;
  }>({ open: false, id: 0 });

  function openCreate(options?: { slug?: string }) {
    setFlow((current) => ({
      open: true,
      id: current.id + 1,
      slug: options?.slug,
    }));
  }

  // Keyboard shortcut: "N" opens the dialog from anywhere on the dashboard.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "n" ||
        event.shiftKey ||
        shouldIgnoreShortcut(event)
      )
        return;
      event.preventDefault();
      setFlow((current) => ({
        open: true,
        id: current.id + 1,
        slug: undefined,
      }));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CreateLinkContext value={{ openCreate }}>
      {children}
      <CreateLinkDialog
        flowId={flow.id}
        open={flow.open}
        onOpenChange={(open) => setFlow((current) => ({ ...current, open }))}
        onCreateAnother={() =>
          setFlow((current) => ({
            open: true,
            id: current.id + 1,
            slug: undefined,
          }))
        }
        initialSlug={flow.slug}
      />
    </CreateLinkContext>
  );
}

/** Opens the create dialog. With `shortcut`, shows the "N" hint (desktop only). */
export function CreateLinkButton({
  children = "New link",
  shortcut = false,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  shortcut?: boolean;
}) {
  const { openCreate } = useCreateLink();
  return (
    <Button
      type="button"
      onClick={() => openCreate()}
      aria-keyshortcuts={shortcut ? "N" : undefined}
      className={cn("group/create", className)}
      {...props}
    >
      <PlusIcon
        aria-hidden
        className="transition-transform duration-300 group-hover/create:rotate-90"
      />
      {children}
      {shortcut && (
        // Tinted from the button's own text colour, so it reads on any button variant.
        <Kbd
          aria-hidden
          className="ml-1 hidden bg-current/15 font-mono text-[11px] text-current opacity-80 md:inline-flex"
        >
          N
        </Kbd>
      )}
    </Button>
  );
}
