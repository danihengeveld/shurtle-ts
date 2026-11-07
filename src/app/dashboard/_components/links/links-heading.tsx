export function LinksHeading({
  tabs,
  children,
}: {
  tabs?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:min-h-10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h2
          id="links-heading"
          tabIndex={-1}
          className="font-display text-xl font-semibold tracking-tight outline-none sm:text-[1.375rem]"
        >
          Links
        </h2>
        {tabs}
      </div>
      {children}
    </div>
  );
}
