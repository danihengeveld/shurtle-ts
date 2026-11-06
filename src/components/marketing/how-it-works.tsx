import { siteInfo } from "@/lib/site";
import { Check, ShieldCheck } from "lucide-react";
import { SectionHeading } from "./section-heading";

const chip =
  "inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium shadow-xs";

export function HowItWorks() {
  const steps = [
    {
      title: "Sign in",
      body: "Create an account or sign in. Clerk handles the details, and your links stay tied to you.",
      detail: (
        <span className={chip}>
          <ShieldCheck className="size-3.5 text-brand-ink" />
          Secured by Clerk
        </span>
      ),
    },
    {
      title: "Paste and tweak",
      body: "Drop in the destination. Keep the generated slug or type your own, and add an expiry date if the link has a deadline.",
      detail: (
        <span className={chip}>
          <span className="truncate font-mono">
            <span className="text-muted-foreground">
              {siteInfo.baseUrl.host}/
            </span>
            launch-party
          </span>
        </span>
      ),
    },
    {
      title: "Share it anywhere",
      body: "Copy the short link and send it off. Clicks start counting the moment someone follows it.",
      detail: (
        <span className={chip}>
          <span className="grid size-4 place-items-center rounded-full bg-brand text-brand-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
          Copied to clipboard
        </span>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="how-title"
      className="border-y border-border/70 bg-muted/35"
    >
      <div className="container-page grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="From sprawl to shurtle in three moves."
          className="lg:sticky lg:top-28 lg:self-start"
        >
          No setup, no settings to wade through. If you can paste, you can
          shurtle.
        </SectionHeading>

        <ol className="relative">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-5 pb-12 last:pb-0 sm:gap-x-7"
            >
              {/* Track connecting the steps. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-12 bottom-1 left-[1.375rem] w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--border)_0_6px,transparent_6px_11px)] dark:bg-[repeating-linear-gradient(to_bottom,oklch(1_0_0/0.18)_0_6px,transparent_6px_11px)]"
                />
              )}
              <span
                aria-hidden="true"
                className={
                  i === steps.length - 1
                    ? "grid size-11 place-items-center rounded-full bg-brand font-mono text-sm font-semibold text-brand-foreground"
                    : "grid size-11 place-items-center rounded-full border-2 border-foreground/80 bg-background font-mono text-sm font-semibold"
                }
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pt-2">
                <h3 className="font-display text-2xl font-semibold tracking-[-0.025em]">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 max-w-md text-[0.9375rem]/relaxed text-pretty text-muted-foreground">
                  {step.body}
                </p>
                <div aria-hidden="true" className="mt-4">
                  {step.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
