"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocations } from "@/lib/locations"

export function SelectedLocations() {
  const { locations, removeLocation } = useLocations()

  if (locations.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        No locations selected. Search above to add locations.
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {locations.map((location) => (
        <div key={location.id} className="flex items-center justify-between rounded-lg border p-4">
          <span>{location.name}</span>
          <Button variant="ghost" size="icon" onClick={() => removeLocation(location.id)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Remove {location.name}</span>
          </Button>
        </div>
      ))}
    </div>
  )
}

