import { doc, setDoc, deleteDoc, collection, getDocs, getDoc, writeBatch, increment, arrayUnion, arrayRemove, updateDoc, runTransaction } from "firebase/firestore"
import { db, auth } from "@/config/firebase.config"
import { Location, LocationSubscription } from "@/lib/types/common/location.type"
import { AppointmentResponse } from "@/lib/types/common/appointment.type"

export class LocationService {
  static async fetchLocations(): Promise<Location[]> {
    const response = await fetch(
      'https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry'
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  static async getSelectedLocations(): Promise<Location[]> {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const locationsRef = collection(db, 'users', user.uid, 'selectedLocations')
    const snapshot = await getDocs(locationsRef)
    return snapshot.docs.map(doc => doc.data() as Location)
  }

  static async updateGlobalLocationTracking(location: Location, userId: string): Promise<void> {
    const globalLocationRef = doc(db, 'activeLocations', location.id.toString())
    
    try {
      // Use transaction instead of batch for better concurrency handling
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(globalLocationRef)
        
        if (!docSnap.exists()) {
          // New location subscription
          transaction.set(globalLocationRef, {
            id: location.id,
            subscriberCount: 1,
            lastChecked: null,
            subscribers: [userId],
            name: location.name,
            city: location.city,
            state: location.state
          })
        } else {
          // Update existing location
          const data = docSnap.data() as LocationSubscription
          if (!data.subscribers.includes(userId)) {
            transaction.update(globalLocationRef, {
              subscriberCount: increment(1),
              subscribers: arrayUnion(userId)
            })
          }
        }
      })
    } catch (error) {
      console.error('Error updating global location tracking:', error)
      throw error
    }
  }

  static async removeFromGlobalTracking(locationId: number, userId: string): Promise<void> {
    const globalLocationRef = doc(db, 'activeLocations', locationId.toString())
    
    try {
      const docSnap = await getDoc(globalLocationRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as LocationSubscription
        if (data.subscriberCount <= 1) {
          // Last subscriber, remove the document
          await deleteDoc(globalLocationRef)
        } else {
          // Update counts and remove subscriber
          await updateDoc(globalLocationRef, {
            subscriberCount: increment(-1),
            subscribers: arrayRemove(userId)
          })
        }
      }
    } catch (error) {
      console.error('Error removing from global tracking:', error)
      throw error
    }
  }

  static async addLocation(location: Location): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    try {
      // Add to user's selected locations first
      const locationRef = doc(db, 'users', user.uid, 'selectedLocations', location.id.toString())
      await setDoc(locationRef, location)
      
      // Then update global tracking
      await this.updateGlobalLocationTracking(location, user.uid)
    } catch (error) {
      console.error('Error adding location:', error)
      // If error occurs, try to rollback the user's selected location
      try {
        const locationRef = doc(db, 'users', user.uid, 'selectedLocations', location.id.toString())
        await deleteDoc(locationRef)
      } catch (rollbackError) {
        console.error('Error rolling back location addition:', rollbackError)
      }
      throw error
    }
  }

  static async removeLocation(locationId: number): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    try {
      // Remove from user's selected locations
      const locationRef = doc(db, 'users', user.uid, 'selectedLocations', locationId.toString())
      await deleteDoc(locationRef)
      
      // Remove from global tracking
      await this.removeFromGlobalTracking(locationId, user.uid)
    } catch (error) {
      console.error('Error removing location:', error)
      throw error
    }
  }

  async checkAppointmentAvailability(locationId: number): Promise<AppointmentResponse> {
    try {
      const response = await fetch(
        `https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=${locationId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      return response.json();
    } catch (error) {
      console.error('Error checking appointment availability:', error);
      return { 
        availableSlots: [], 
        lastPublishedDate: new Date().toISOString(),
        locationId: locationId,
        success: false
      };
    }
  }
}