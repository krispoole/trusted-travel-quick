import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LocationState, Location } from "@/lib/types/common/location.type"
import { LocationService } from "@/lib/services/location.service"
import { auth } from "@/config/firebase.config"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/config/firebase.config"

export const useLocations = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      selectedLocations: [],
      isLoading: false,
      error: null,
      
      loadSelectedLocations: async () => {
        if (get().isLoading) return;
        
        try {
          const user = auth.currentUser;
          if (!user) return;

          set({ isLoading: true, error: null });
          const locationsRef = collection(db, 'users', user.uid, 'selectedLocations');
          const snapshot = await getDocs(locationsRef);
          
          const selectedLocations = snapshot.docs.map(doc => doc.data() as Location);
          
          set(state => ({
            selectedLocations,
            isLoading: false,
            error: null
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchLocations: async () => {
        if (get().isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const locations = await LocationService.fetchLocations();
          
          set({ locations, isLoading: false, error: null });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch locations' 
          });
        }
      },

      addLocation: async (location) => {
        try {
          await LocationService.addLocation(location)
          set((state) => ({
            selectedLocations: [...state.selectedLocations, location],
            locations: state.locations
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add location' })
          throw error
        }
      },

      removeLocation: async (id) => {
        try {
          await LocationService.removeLocation(id)
          set((state) => ({
            selectedLocations: state.selectedLocations.filter(loc => loc.id !== id),
            locations: state.locations
          }))
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