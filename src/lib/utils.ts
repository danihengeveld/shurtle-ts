import { clsx, type ClassValue } from "cn";
import { extendTailwindMerge } from "cn/config";

const twMerge = extendTailwindMerge<"bg-shell">({
  extend: {
    // `bg-shell` (globals.css) is a mask-based motif, not a background colour, so it must not be
    // merged away by a later `bg-*` colour class.
    classGroups: { "bg-shell": ["bg-shell"] },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
