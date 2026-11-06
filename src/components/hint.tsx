"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Supplementary detail on hover / keyboard focus (full URLs, exact dates), replacing `title`
 * attributes, which keyboard and touch users never see. `children` must be a single element that
 * accepts a ref; without `content` (e.g. before hydration) it renders the child as is.
 *
 * Only for extra detail: the essential information must already be in the element itself.
 */
export function Hint({
  content,
  side = "top",
  children,
}: {
  content: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  children: React.ReactElement;
}) {
  if (!content) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-sm break-all">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
