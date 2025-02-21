import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LocationState, Location } from "@/lib/types/common/location.type" 
import { LocationService } from "@/lib/services/location.service"
import { auth, db } from "@/config/firebase.config"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, increment, arrayRemove, onSnapshot, writeBatch } from "firebase/firestore"
import { Timestamp } from "firebase/firestore"

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

  const activeLocationRef = doc(db, 'activeLocations', locationId);
  const activeLocationSnap = await getDoc(activeLocationRef);
  
  if (!activeLocationSnap.exists()) return null;

  const locationData = convertFirestoreLocation({
    id: locationId,
    ...activeLocationSnap.data()
  });

  locationCache.set(locationId, {
    data: locationData,
    timestamp: now
  });

  return locationData;
}

// Add retry mechanism for failed operations
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError;
}

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
    city: data.city,
    state: data.state,
    shortName: data.shortName || '',
    address: data.address || '',
    postalCode: data.postalCode || '',
    countryCode: data.countryCode || '',
    operational: data.operational ?? true,
    // Convert timestamps properly
    lastChecked: convertTimestamp(data.lastChecked),
    lastAppointmentFound: convertTimestamp(data.lastAppointmentFound),
    subscriberCount: data.subscriberCount || 0,
    subscribers: data.subscribers || []
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
        if (get().isLoading) return;
        
        try {
          const user = auth.currentUser;
          if (!user) return;

          set({ isLoading: true, error: null });
          
          // Get user's selected location IDs and their data
          const userLocationsRef = collection(db, 'users', user.uid, 'selectedLocations');
          const userLocationsSnapshot = await getDocs(userLocationsRef);
          
          // Create a map of user's selected locations
          const userLocationsMap = new Map(
            userLocationsSnapshot.docs.map(doc => [
              doc.id,
              { id: doc.id, ...doc.data() }
            ])
          );

          // Fetch full location data from activeLocations collection
          const selectedLocations = await Promise.all(
            Array.from(userLocationsMap.keys()).map(async (locationId) => {
              try {
                const activeLocationRef = doc(db, 'activeLocations', locationId);
                const activeLocationSnap = await getDoc(activeLocationRef);
                
                if (!activeLocationSnap.exists()) {
                  console.warn(`Location ${locationId} not found in activeLocations`);
                  return null;
                }

                // Merge data from both collections, prioritizing activeLocations for timestamps
                const activeLocationData = activeLocationSnap.data();
                const userLocationData = userLocationsMap.get(locationId);

                const mergedData = {
                  id: locationId,
                  ...userLocationData,
                  ...activeLocationData,
                  // Explicitly convert timestamps
                  lastChecked: activeLocationData.lastChecked ? 
                    new Timestamp(
                      activeLocationData.lastChecked.seconds,
                      activeLocationData.lastChecked.nanoseconds
                    ) : null,
                  lastAppointmentFound: activeLocationData.lastAppointmentFound ? 
                    new Timestamp(
                      activeLocationData.lastAppointmentFound.seconds,
                      activeLocationData.lastAppointmentFound.nanoseconds
                    ) : null,
                  subscriberCount: activeLocationData.subscriberCount || 0,
                  subscribers: activeLocationData.subscribers || [],
                };

                console.log('Merged location data:', mergedData); // Debug log
                
                return convertFirestoreLocation(mergedData);
              } catch (error) {
                console.error(`Error fetching location ${locationId}:`, error);
                return null;
              }
            })
          );

          // Filter out any null values from locations that weren't found
          const validLocations = selectedLocations.filter((loc): loc is Location => loc !== null);
          
          console.log('Final locations data:', validLocations); // Debug log
          
          set(state => ({
            selectedLocations: validLocations,
            isLoading: false,
            error: null
          }));
        } catch (error) {
          console.error('Error loading locations:', error);
          set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load locations' });
        }
      },

      fetchLocations: async () => {
        if (get().isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const locations = await retryOperation(() => LocationService.fetchLocations());
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
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');

          const batch = writeBatch(db);
          
          // First check if location exists in activeLocations
          const activeLocationRef = doc(db, 'activeLocations', location.id.toString());
          const activeLocationSnap = await getDoc(activeLocationRef);
          
          if (!activeLocationSnap.exists()) {
            // Create new active location if it doesn't exist
            const now = Timestamp.now();
            batch.set(activeLocationRef, {
              name: location.name,
              city: location.city,
              state: location.state,
              subscribers: [user.uid],
              subscriberCount: 1,
              lastChecked: now,
              lastAppointmentFound: null
            });
          } else {
            // Update existing active location
            batch.update(activeLocationRef, {
              subscribers: arrayUnion(user.uid),
              subscriberCount: increment(1)
            });
          }

          // Add to user's selected locations
          const userLocationRef = doc(db, 'users', user.uid, 'selectedLocations', location.id.toString());
          batch.set(userLocationRef, {
            addedAt: Timestamp.now()
          });

          await batch.commit();

          // Fetch the updated location data
          const updatedLocationSnap = await getDoc(activeLocationRef);
          const updatedLocation = convertFirestoreLocation({
            id: location.id,
            ...updatedLocationSnap.data()
          });

          set((state) => ({
            selectedLocations: [...state.selectedLocations, updatedLocation],
            locations: state.locations.filter(loc => loc.id !== location.id)
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add location' });
          throw error;
        }
      },

      removeLocation: async (id: number) => {
        const locationId = id.toString();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        // Optimistically update UI
        set((state) => ({
          selectedLocations: state.selectedLocations.filter(loc => loc.id !== locationId),
          locations: state.locations
        }));

        try {
          const batch = writeBatch(db);

          // Remove from user's selected locations
          const userLocationRef = doc(db, 'users', user.uid, 'selectedLocations', locationId);
          batch.delete(userLocationRef);

          // Update active locations
          const activeLocationRef = doc(db, 'activeLocations', locationId);
          batch.update(activeLocationRef, {
            subscribers: arrayRemove(user.uid),
            subscriberCount: increment(-1)
          });

          await batch.commit();

          // Check if we need to delete the active location (no more subscribers)
          const activeLocationSnap = await getDoc(activeLocationRef);
          const activeLocationData = activeLocationSnap.data();
          
          if (activeLocationData?.subscriberCount <= 0) {
            await deleteDoc(activeLocationRef);
          }
        } catch (error) {
          // Revert optimistic update on error
          const originalLocation = get().selectedLocations.find(loc => loc.id === locationId);
          if (originalLocation) {
            set((state) => ({
              selectedLocations: [...state.selectedLocations, originalLocation],
              locations: state.locations
            }));
          }
          throw error;
        }
      },

      // Add real-time updates for selected locations
      subscribeToSelectedLocations: () => {
        const user = auth.currentUser;
        if (!user) return;

        const unsubscribe = onSnapshot(
          collection(db, 'users', user.uid, 'selectedLocations'),
          async (snapshot) => {
            const changes = snapshot.docChanges();
            
            for (const change of changes) {
              if (change.type === 'modified') {
                const locationData = await getCachedLocation(change.doc.id);
                if (locationData) {
                  set((state) => ({
                    selectedLocations: state.selectedLocations.map(loc =>
                      loc.id === change.doc.id ? locationData : loc
                    )
                  }));
                }
              }
            }
          }
        );

        return unsubscribe;
      },
    }),
    {
      name: "locations-storage",
      partialize: (state) => ({ selectedLocations: state.selectedLocations }),
    }
  )
) 