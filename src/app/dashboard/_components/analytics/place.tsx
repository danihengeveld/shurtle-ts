import type { ClickPlace } from "@/lib/analytics";
import { countryName, flagEmoji } from "@/lib/countries";
import { cn } from "cn";
import { GlobeIcon } from "lucide-react";

/** "Amsterdam, Netherlands", "Netherlands", or null when nothing is known. */
export function placeText({ country, city }: Omit<ClickPlace, "region">) {
  const name = country ? countryName(country) : null;
  if (city && name) return `${city}, ${name}`;
  return city ?? name;
}

/** A country's flag, or a globe when it isn't known. Decorative: the name always comes with it. */
export function Flag({
  country,
  className,
}: {
  country: string | null;
  className?: string;
}) {
  const flag = country ? flagEmoji(country) : null;
  // Same box for both, so rows line up whether they show a flag or the globe.
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex w-[1.25em] shrink-0 justify-center leading-none",
        className,
      )}
    >
      {flag ?? <GlobeIcon className="size-[1.1em] text-muted-foreground" />}
    </span>
  );
}
