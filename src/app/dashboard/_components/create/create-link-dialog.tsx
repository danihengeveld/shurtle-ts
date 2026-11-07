"use client";

import { SheetDialog } from "../sheet-dialog";
import { CreateLinkFlow } from "./create-link-flow";

export function CreateLinkDialog({
  flowId,
  open,
  onOpenChange,
  onCreateAnother,
  initialSlug,
}: {
  flowId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAnother: () => void;
  initialSlug?: string;
}) {
  return (
    <SheetDialog open={open} onOpenChange={onOpenChange}>
      <CreateLinkFlow
        key={flowId}
        initialSlug={initialSlug}
        onCreateAnother={onCreateAnother}
        onDone={() => onOpenChange(false)}
      />
    </SheetDialog>
  );
}
