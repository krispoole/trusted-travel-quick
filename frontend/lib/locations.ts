import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Location {
  id: number
  name: string
  shortName: string
  address: string
  addressAdditional?: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  phoneNumber?: string
  phoneExtension?: string
  locationType?: string
  operational: boolean
}

interface LocationState {
  locations: Location[]
  selectedLocations: Location[]
  isLoading: boolean
  error: string | null
  fetchLocations: () => Promise<void>
  addLocation: (location: Location) => void
  removeLocation: (id: number) => void
}

export const useLocations = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      selectedLocations: [],
      isLoading: false,
      error: null,
      fetchLocations: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            'https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry'
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const newLocations = await response.json();
          const currentSelectedIds = get().selectedLocations.map(loc => loc.id);
          
          // Filter out already selected locations
          const availableLocations = newLocations.filter(
            (loc: Location) => !currentSelectedIds.includes(loc.id)
          );
          
          set({ locations: availableLocations, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch locations', 
            isLoading: false 
          });
        }
      },
      addLocation: (location) =>
        set((state) => {
          // Remove the location from the available locations list
          const newLocations = state.locations.filter(loc => loc.id !== location.id);
          return {
            selectedLocations: [...state.selectedLocations, location],
            locations: newLocations
          };
        }),
      removeLocation: (id) =>
        set((state) => {
          // Get the location being removed
          const removedLocation = state.selectedLocations.find(loc => loc.id === id);
          if (!removedLocation) return state;

          // Add it back to available locations
          return {
            selectedLocations: state.selectedLocations.filter(loc => loc.id !== id),
            locations: [...state.locations, removedLocation]
          };
        }),
    }),
    {
      name: "locations-storage",
      partialize: (state) => ({ selectedLocations: state.selectedLocations }),
    }
  )
)

