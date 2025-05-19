"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useState } from "react"
import { CreateShurtleForm } from "./create-shurtle-form"

export function CreateShurtleDialog() {
  const [open] = useState(false)

  // Handle successful shurtle creation
  const handleSuccess = () => { }

  // Handle dialog open/close
  const handleOpenChange = () => { }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Shurtle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Shurtle</DialogTitle>
          <DialogDescription>Paste your long URL below and we&apos;ll create a short link for you.</DialogDescription>
        </DialogHeader>
        {/* Use key to force re-render the form when dialog reopens */}
        <CreateShurtleForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}