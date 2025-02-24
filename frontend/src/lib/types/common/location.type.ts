import { Timestamp } from "firebase/firestore";
import { Appointment } from "./appointment.type";

export interface Location {
  id: string
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
  lastChecked: Timestamp | null
  lastAppointmentFound: Timestamp | null
}

export interface UserLocation {
  userId: string
  locationId: string
  selectedAt: Timestamp
}

export interface LocationState {
  locations: Location[]
  selectedLocations: Location[]
  isLoading: boolean
  error: string | null
  fetchLocations: () => Promise<void>
  addLocation: (location: Location) => Promise<void>
  removeLocation: (locationId: string) => Promise<void>
  loadSelectedLocations: () => Promise<void>
  clearLocations: () => void
  initializeAuthListener: () => () => void
  subscribeToSelectedLocations: () => (() => void) | undefined
}

export interface LocationSubscription {
  id: number
  subscriberCount: number
  lastChecked: string | null
  subscribers: string[]
  lastAppointments?: Array<Appointment>
}

// Add a helper function to convert Firestore data
export function convertFirestoreLocation(data: any): Location {
  if (!data) return data;
  
  return {
    ...data,
    // Ensure these are Firestore Timestamps
    lastChecked: data.lastChecked ? 
      (data.lastChecked instanceof Timestamp ? 
        data.lastChecked : 
        new Timestamp(data.lastChecked.seconds, data.lastChecked.nanoseconds)
      ) : null,
    lastAppointmentFound: data.lastAppointmentFound ? 
      (data.lastAppointmentFound instanceof Timestamp ? 
        data.lastAppointmentFound : 
        new Timestamp(data.lastAppointmentFound.seconds, data.lastAppointmentFound.nanoseconds)
      ) : null,
  };
} 