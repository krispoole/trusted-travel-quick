import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Location {
  id: string
  name: string
}

interface LocationState {
  locations: Location[]
  addLocation: (location: Location) => void
  removeLocation: (id: string) => void
}

// Stub locations store - will be connected to API later
export const useLocations = create<LocationState>()(
  persist(
    (set) => ({
      locations: [],
      addLocation: (location) =>
        set((state) => ({
          locations: [...state.locations, location],
        })),
      removeLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        })),
    }),
    {
      name: "locations-storage",
    },
  ),
)

// Stub city data - will be replaced with API
export const cities = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
].map((name) => ({
  id: name.toLowerCase().replace(/[^a-z]/g, ""),
  name,
}))

