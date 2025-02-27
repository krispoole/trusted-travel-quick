"use client"

import {useLocations} from "@/lib/stores/locations.store"
import {LocationCard} from "../location-card/location-card"

export function SelectedLocations() {
  const {selectedLocations} = useLocations()

  if (selectedLocations.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        No locations selected. Search above to add locations.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {selectedLocations.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  )
}