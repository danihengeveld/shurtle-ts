import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Shurtles</h1>
        <p className="text-muted-foreground mt-1">Manage and track your shortened URLs</p>
      </div>
      <div>
        <Button asChild>
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Shurtle
          </Link>
        </Button>
      </div>
    </div>
  )
}
