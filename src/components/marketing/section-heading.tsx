import { cn } from "cn";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Left-aligned section intro: mono eyebrow, display h2, optional lede. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  children,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-4 font-display text-[2rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-5xl"
      >
        {title}
      </h2>
      {children && (
        <p className="mt-5 text-lg/relaxed text-pretty text-muted-foreground">
          {children}
        </p>
      )}
    </div>
  );
}
