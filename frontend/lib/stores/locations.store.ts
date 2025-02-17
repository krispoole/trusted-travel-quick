import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LocationState, Location } from "@/lib/types/location.type"
import { LocationService } from "@/lib/services/location.service"

export const useLocations = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      selectedLocations: [],
      isLoading: false,
      error: null,
      
      fetchLocations: async () => {
        if (get().isLoading || get().locations.length > 0) return
        
        try {
          set({ isLoading: true, error: null })
          const newLocations = await LocationService.fetchLocations()
          const currentSelectedIds = get().selectedLocations.map(loc => loc.id)
          const availableLocations = newLocations.filter(
            (loc: Location) => !currentSelectedIds.includes(loc.id)
          )
          
          set({ locations: availableLocations, isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch locations', 
            isLoading: false 
          })
          throw error
        }
      },

      loadSelectedLocations: async () => {
        if (get().isLoading) return
        
        try {
          set({ isLoading: true, error: null })
          const selectedLocations = await LocationService.getSelectedLocations()
          
          set(state => {
            const selectedIds = new Set(selectedLocations.map(loc => loc.id))
            const availableLocations = state.locations.filter(loc => !selectedIds.has(loc.id))
            
            return {
              selectedLocations,
              locations: availableLocations,
              isLoading: false,
              error: null
            }
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      addLocation: async (location) => {
        try {
          await LocationService.addLocation(location)
          set((state) => ({
            selectedLocations: [...state.selectedLocations, location],
            locations: state.locations.filter(loc => loc.id !== location.id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add location' })
          throw error
        }
      },

      removeLocation: async (id) => {
        try {
          await LocationService.removeLocation(id)
          set((state) => {
            const removedLocation = state.selectedLocations.find(loc => loc.id === id)
            if (!removedLocation) return state

            return {
              selectedLocations: state.selectedLocations.filter(loc => loc.id !== id),
              locations: [...state.locations, removedLocation]
            }
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove location' })
          throw error
        }
      },
    }),
    {
      name: "locations-storage",
      partialize: (state) => ({ selectedLocations: state.selectedLocations }),
    }
  )
) 