import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LocationState, Location } from "@/lib/types/common/location.type" 
import { LocationService } from "@/lib/services/location.service"
import { auth, db } from "@/config/firebase.config"
import { collection, getDocs, doc, getDoc, query, where, onSnapshot, setDoc, deleteDoc } from "firebase/firestore"
import { Timestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// Add caching mechanism
const locationCache = new Map<string, {
  data: Location,
  timestamp: number
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedLocation = async (locationId: string) => {
  const cached = locationCache.get(locationId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const locationRef = doc(db, 'locations', locationId);
  const locationSnap = await getDoc(locationRef);
  
  if (!locationSnap.exists()) return null;

  const locationData = convertFirestoreLocation({
    id: locationId,
    ...locationSnap.data()
  });

  locationCache.set(locationId, {
    data: locationData,
    timestamp: now
  });

  return locationData;
};

const convertFirestoreLocation = (data: any): Location => {
  console.log('Converting location data:', data); // Debug log

  // Handle Timestamp conversion
  const convertTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) return timestamp;
    if (timestamp.seconds && timestamp.nanoseconds) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds);
    }
    return null;
  };

  return {
    id: data.id,
    name: data.name,
    shortName: data.shortName || '',
    address: data.address || '',
    city: data.city,
    state: data.state,
    postalCode: data.postalCode || '',
    countryCode: data.countryCode || '',
    operational: data.operational ?? true,
    // Convert timestamps properly
    lastChecked: convertTimestamp(data.lastChecked),
    lastAppointmentFound: convertTimestamp(data.lastAppointmentFound)
  };
};

export const useLocations = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      selectedLocations: [],
      isLoading: false,
      error: null,
      
      loadSelectedLocations: async () => {
        const user = auth.currentUser;
        if (!user || get().isLoading) return;
        
        try {
          set({ isLoading: true, error: null });
          
          // Query userLocations collection filtered by current user
          const userLocationsRef = collection(db, 'userLocations');
          const userLocationsQuery = query(userLocationsRef, where('userId', '==', user.uid));
          const userLocationsSnapshot = await getDocs(userLocationsQuery);
          
          // Get all location IDs selected by the user
          const locationIds = userLocationsSnapshot.docs.map(doc => doc.data().locationId);
          
          // Clear selected locations if user has none
          if (locationIds.length === 0) {
            set({ selectedLocations: [], isLoading: false, error: null });
            return;
          }
          
          // Fetch full location details for each selected location
          const selectedLocationsPromises = locationIds.map(async (locationId) => {
            const locationRef = doc(db, 'locations', locationId);
            const locationSnap = await getDoc(locationRef);
            if (!locationSnap.exists()) return null;
            
            return convertFirestoreLocation({
              id: locationId,
              ...locationSnap.data()
            });
          });
          
          const selectedLocations = (await Promise.all(selectedLocationsPromises))
            .filter((loc): loc is Location => loc !== null);
          
          set({ 
            selectedLocations,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Error loading selected locations:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to load locations' 
          });
        }
      },

      fetchLocations: async () => {
        if (get().isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const locations = await LocationService.fetchLocations();
          
          // Filter out locations that are already selected
          const selectedLocationIds = new Set(get().selectedLocations.map(loc => loc.id));
          const availableLocations = locations.filter(loc => !selectedLocationIds.has(loc.id));
          
          set({ locations: availableLocations, isLoading: false, error: null });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch locations' 
          });
        }
      },

      addLocation: async (location: Location) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('Authentication required');

          // First check if location exists in locations collection
          const locationRef = doc(db, 'locations', location.id);
          const locationSnap = await getDoc(locationRef);
          
          // Only create the location if it doesn't exist
          if (!locationSnap.exists()) {
            await setDoc(locationRef, {
              name: location.name,
              shortName: location.shortName,
              address: location.address,
              city: location.city,
              state: location.state,
              postalCode: location.postalCode,
              countryCode: location.countryCode,
              operational: location.operational,
              lastChecked: null,
              lastAppointmentFound: null
            });
          }

          // Create user-specific location relationship
          const userLocationRef = doc(db, 'userLocations', `${user.uid}_${location.id}`);
          await setDoc(userLocationRef, {
            userId: user.uid,
            locationId: location.id,
            selectedAt: Timestamp.now()
          });
          
          set(state => ({
            selectedLocations: [...state.selectedLocations, location],
            locations: state.locations.filter(loc => loc.id !== location.id),
            error: null
          }));
        } catch (error) {
          console.error('Error adding location:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to add location' });
          throw error;
        }
      },

      removeLocation: async (locationId: string) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('Authentication required');

          // Remove only the user's relationship with the location
          const userLocationRef = doc(db, 'userLocations', `${user.uid}_${locationId}`);
          await deleteDoc(userLocationRef);
          
          set(state => {
            const removedLocation = state.selectedLocations.find(loc => loc.id === locationId);
            if (!removedLocation) return state;

            return {
              selectedLocations: state.selectedLocations.filter(loc => loc.id !== locationId),
              locations: [...state.locations, removedLocation]
            };
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove location' });
          throw error;
        }
      },

      // Add real-time updates for selected locations
      subscribeToSelectedLocations: () => {
        const user = auth.currentUser;
        if (!user) return;

        // Subscribe to userLocations collection for the current user
        const userLocationsRef = collection(db, 'userLocations');
        const userLocationsQuery = query(userLocationsRef, where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(userLocationsQuery, async (snapshot) => {
          const changes = snapshot.docChanges();
          
          for (const change of changes) {
            if (change.type === 'modified') {
              const userLocation = change.doc.data();
              const locationData = await getCachedLocation(userLocation.locationId);
              if (locationData) {
                set((state) => ({
                  selectedLocations: state.selectedLocations.map(loc =>
                    loc.id === userLocation.locationId ? locationData : loc
                  )
                }));
              }
            }
          }
        });

        return unsubscribe;
      },

      initializeAuthListener: () => {
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            // User logged in - load their locations
            try {
              await get().loadSelectedLocations()
              await get().fetchLocations()
            } catch (error) {
              console.error('Error loading locations after auth change:', error)
              set({ error: 'Failed to load locations' })
            }
          } else {
            // User logged out - clear locations
            get().clearLocations()
          }
        })

        // Return unsubscribe function
        return unsubscribe
      },

      // Update clearLocations to be more thorough
      clearLocations: () => {
        locationCache.clear() // Clear the cache
        set({ 
          locations: [], 
          selectedLocations: [], 
          isLoading: false, 
          error: null 
        })
      }
    }),
    {
      name: "locations-storage",
      // Don't persist any data - always load fresh from Firestore
      partialize: () => ({}),
    }
  )
) 