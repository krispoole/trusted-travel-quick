import { LocationSearch } from "@/components/location-search"
import { SelectedLocations } from "@/components/selected-locations"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Location Search</h1>
        <p className="text-sm text-muted-foreground">Search and select your trusted travel locations</p>
      </div>
      <LocationSearch />
      <SelectedLocations />
    </div>
  )
}

