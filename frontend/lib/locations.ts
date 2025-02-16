import { create } from "zustand"
import { persist } from "zustand/middleware"
import { auth, db } from "@/firebaseConfig"
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore"
import { Location, LocationState } from "@/lib/models/location.model"

export const useLocations = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      selectedLocations: [],
      isLoading: false,
      error: null,
      
      fetchLocations: async () => {
        if (get().isLoading || get().locations.length > 0) return;
        
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
          const availableLocations = newLocations.filter(
            (loc: Location) => !currentSelectedIds.includes(loc.id)
          );
          
          set({ locations: availableLocations, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch locations', 
            isLoading: false 
          });
          throw error;
        }
      },

      loadSelectedLocations: async () => {
        if (get().isLoading) return;
        
        try {
          const user = auth.currentUser;
          if (!user) return;

          set({ isLoading: true, error: null });
          const locationsRef = collection(db, 'users', user.uid, 'selectedLocations');
          const snapshot = await getDocs(locationsRef);
          
          const selectedLocations = snapshot.docs.map(doc => doc.data() as Location);
          
          set(state => {
            const selectedIds = new Set(selectedLocations.map(loc => loc.id));
            const availableLocations = state.locations.filter(loc => !selectedIds.has(loc.id));
            
            return {
              selectedLocations,
              locations: availableLocations,
              isLoading: false,
              error: null
            };
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      addLocation: async (location) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');

          // Add to Firestore
          const locationRef = doc(db, 'users', user.uid, 'selectedLocations', location.id.toString());
          await setDoc(locationRef, location);

          // Update local state
          set((state) => ({
            selectedLocations: [...state.selectedLocations, location],
            locations: state.locations.filter(loc => loc.id !== location.id)
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add location' });
        }
      },

      removeLocation: async (id) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');

          // Remove from Firestore
          const locationRef = doc(db, 'users', user.uid, 'selectedLocations', id.toString());
          await deleteDoc(locationRef);

          // Update local state
          set((state) => {
            const removedLocation = state.selectedLocations.find(loc => loc.id === id);
            if (!removedLocation) return state;

            return {
              selectedLocations: state.selectedLocations.filter(loc => loc.id !== id),
              locations: [...state.locations, removedLocation]
            };
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove location' });
        }
      },
    }),
    {
      name: "locations-storage",
      partialize: (state) => ({ selectedLocations: state.selectedLocations }),
    }
  )
)

export type { Location }

