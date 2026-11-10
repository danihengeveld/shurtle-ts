import type { ViewTransitionClass } from "react";

/*
 * Shared pieces for React's <ViewTransition>; the animations live in globals.css.
 */

/** Transition type for browsing a list (search, paging, page size) rather than changing it. */
export const BROWSE_LIST = "browse-list";

/** `className` when the list itself changed; still while it's only being browsed. */
export function listChange(className: string) {
  return {
    [BROWSE_LIST]: "none",
    default: className,
  } satisfies ViewTransitionClass;
}
