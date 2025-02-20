"use client"

import { X } from "lucide-react"
import { Button } from "@/components/base/button"
import { useLocations } from "@/lib/stores/locations.store"
import { useToast } from "@/components/base/use-toast"

export function SelectedLocations() {
  const { selectedLocations, removeLocation } = useLocations()
  const { toast } = useToast()

  const handleRemove = async (id: number, name: string) => {
    try {
      await removeLocation(id)
      toast({
        title: "Location removed",
        description: `${name} has been removed from your selected locations.`
      })
    } catch (error) {
      toast({
        title: "Error removing location",
        description: error instanceof Error ? error.message : "Failed to remove location",
        variant: "destructive"
      })
    }
  }

  if (selectedLocations.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        No locations selected. Search above to add locations.
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {selectedLocations.map((location) => (
        <div key={location.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium">{location.name}</div>
            <div className="text-sm text-muted-foreground">
              {location.city}, {location.state}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleRemove(location.id, location.name)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove {location.name}</span>
          </Button>
        </div>
      ))}
    </div>
  )
}