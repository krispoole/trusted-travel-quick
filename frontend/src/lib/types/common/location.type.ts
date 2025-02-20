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

export interface LocationState {
  locations: Location[]
  selectedLocations: Location[]
  isLoading: boolean
  error: string | null
  fetchLocations: () => Promise<void>
  addLocation: (location: Location) => Promise<void>
  removeLocation: (id: number) => Promise<void>
  loadSelectedLocations: () => Promise<void>
}

export interface LocationSubscription {
  id: number
  subscriberCount: number
  lastChecked: string | null
  subscribers: string[]
  lastAppointments?: Array<Appointment>
} 