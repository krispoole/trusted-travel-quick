import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore"
import { db, auth } from "@/firebaseConfig"
import { Location } from "@/lib/models/location.model"
import { AppointmentResponse } from "@/lib/models/appointment.model"
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

  static async addLocation(location: Location): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const locationRef = doc(db, 'users', user.uid, 'selectedLocations', location.id.toString())
    await setDoc(locationRef, location)
  }

  static async removeLocation(locationId: number): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const locationRef = doc(db, 'users', user.uid, 'selectedLocations', locationId.toString())
    await deleteDoc(locationRef)
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
      return { availableSlots: [], lastPublishedDate: new Date().toISOString() };
    }
  }
} 