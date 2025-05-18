import { CreateShurtleDialog } from "../create/create-shurtle-dialog"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Shurtles</h1>
        <p className="text-muted-foreground mt-1">Manage and track your shortened URLs</p>
      </div>
      <div>
        <CreateShurtleDialog />
      </div>
    </div>
  )
}
