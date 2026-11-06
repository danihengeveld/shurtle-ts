import { CreateLinkButton } from "@/components/create/create-link-provider"

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-pretty text-muted-foreground">Create short links, share them, and see how they&apos;re doing.</p>
      </div>
      <CreateLinkButton shortcut size="lg" className="h-11 self-start rounded-xl px-5 max-sm:w-full sm:self-auto">
        New link
      </CreateLinkButton>
    </header>
  )
}
