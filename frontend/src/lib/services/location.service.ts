import { doc, setDoc, deleteDoc, collection, getDocs, getDoc, query, where, Timestamp } from "firebase/firestore"
import { db, auth } from "@/config/firebase.config"
import { Location, UserLocation } from "@/lib/types/common/location.type"
import { Appointment } from "@/lib/types/common/appointment.type"

export class LocationService {
  private static mapApiLocationToLocation(apiLocation: any): Location {
    return {
      id: apiLocation.id.toString(),
      name: apiLocation.name,
      shortName: apiLocation.name,
      address: apiLocation.address || '',
      addressAdditional: '',
      city: apiLocation.city,
      state: apiLocation.state,
      postalCode: apiLocation.postalCode || '',
      countryCode: 'US',
      phoneNumber: apiLocation.phoneNumber || '',
      phoneExtension: apiLocation.phoneExtension || '',
      locationType: apiLocation.locationType || '',
      operational: true,
      lastChecked: null,
      lastAppointmentFound: null
    }
  }

  private static mapFirestoreLocationToLocation(id: string, data: any): Location {
    return {
      id,
      name: data.name,
      shortName: data.shortName,
      address: data.address,
      addressAdditional: data.addressAdditional || '',
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      countryCode: data.countryCode,
      phoneNumber: data.phoneNumber || '',
      phoneExtension: data.phoneExtension || '',
      locationType: data.locationType || '',
      operational: data.operational,
      lastChecked: data.lastChecked || null,
      lastAppointmentFound: data.lastAppointmentFound || null
    }
  }

  private static handleError(error: unknown, customMessage: string): never {
    if (process.env.NODE_ENV === 'development') {
      console.error(customMessage, error)
    }
    throw new Error(customMessage)
  }

  static async fetchLocations(): Promise<Location[]> {
    try {
      const response = await fetch(
        'https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry'
      )
      
      if (!response.ok) {
        return this.handleError(response, 'Failed to fetch locations')
      }
      
      const locations = await response.json()
      return locations.map(this.mapApiLocationToLocation)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch locations')
    }
  }

  static async getSelectedLocations(): Promise<Location[]> {
    const user = auth.currentUser
    if (!user) {
      return this.handleError(new Error('No user'), 'Authentication required')
    }

    try {
      const userLocationsRef = collection(db, 'userLocations')
      const userLocationsQuery = query(userLocationsRef, where('userId', '==', user.uid))
      const userLocationsSnapshot = await getDocs(userLocationsQuery)

      if (userLocationsSnapshot.empty) return []

      const locationPromises = userLocationsSnapshot.docs.map(async (userLocationDoc) => {
        const userLocation = userLocationDoc.data() as UserLocation
        const locationRef = doc(db, 'locations', userLocation.locationId)
        const locationSnap = await getDoc(locationRef)
        
        if (!locationSnap.exists()) return null

        return this.mapFirestoreLocationToLocation(locationSnap.id, locationSnap.data())
      })

      const locations = await Promise.all(locationPromises)
      return locations.filter((loc): loc is Location => loc !== null)
    } catch (error) {
      return this.handleError(error, 'Failed to fetch selected locations')
    }
  }

  static async addLocation(location: Location): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      // First check if location exists
      const locationRef = doc(db, 'locations', location.id.toString());
      const locationSnap = await getDoc(locationRef);
      
      // Only try to create the location if it doesn't exist
      if (!locationSnap.exists()) {
        try {
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
        } catch (error) {
          // Ignore error if document already exists (race condition)
          if (error instanceof Error && !error.message.includes('permission-denied')) {
            throw error;
          }
        }
      }

      // Create user-specific location relationship
      const userLocationRef = doc(db, 'userLocations', `${user.uid}_${location.id}`);
      await setDoc(userLocationRef, {
        userId: user.uid,
        locationId: location.id.toString(),
        selectedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding location:', error);
      throw new Error('Failed to add location');
    }
  }

  static async removeLocation(locationId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      // Remove only the user's relationship with the location
      const userLocationRef = doc(db, 'userLocations', `${user.uid}_${locationId}`);
      await deleteDoc(userLocationRef);
    } catch (error) {
      console.error('Error removing location:', error);
      throw new Error('Failed to remove location');
    }
  }

  static async checkAppointmentAvailability(locationId: string): Promise<{ availableSlots: Appointment[] }> {
    try {
      const numericId = parseInt(locationId, 10)
      if (isNaN(numericId)) {
        throw new Error('Invalid location ID')
      }

      const response = await fetch(
        `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=3&locationId=${numericId}&minimum=1`
      )

      if (!response.ok) {
        if (response.status === 404) {
          return { availableSlots: [] }
        }
        throw new Error(`Failed to check appointments: ${response.status} ${response.statusText}`)
      }

      const slots = await response.json()
      return {
        availableSlots: slots.map((slot: any) => ({
          locationId: numericId,
          startTimestamp: slot.startTimestamp,
          endTimestamp: slot.endTimestamp,
          active: true,
          duration: slot.duration,
          remoteInd: slot.remoteInd
        }))
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking appointment availability:', error)
      }
      return { availableSlots: [] }
    }
  }
}