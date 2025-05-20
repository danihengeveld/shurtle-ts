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
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Shurtle</DialogTitle>
          <DialogDescription>Paste your long URL below and we&apos;ll create a short link for you.</DialogDescription>
        </DialogHeader>
        <CreateShurtleForm />
      </DialogContent>
    </Dialog>
  )
}