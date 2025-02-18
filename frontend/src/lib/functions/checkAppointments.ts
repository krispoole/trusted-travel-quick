import { LocationService } from "@/lib/services/location.service"
import { Location } from "@/lib/types/location.type"
import { AppointmentResponse } from "@/lib/types/appointment.type"

class AppointmentChecker {
  private static instance: AppointmentChecker
  private checkedLocations: Map<number, Date> = new Map()
  private locationService: LocationService

  private constructor() {
    this.locationService = new LocationService()
  }

  public static getInstance(): AppointmentChecker {
    if (!AppointmentChecker.instance) {
      AppointmentChecker.instance = new AppointmentChecker()
    }
    return AppointmentChecker.instance
  }

  async checkLocations(selectedLocations: Location[]): Promise<void> {
    console.log(`[${new Date().toISOString()}] Checking ${selectedLocations.length} locations for appointments...`)
    
    // Get unique locations by ID
    const uniqueLocations = Array.from(
      new Map(selectedLocations.map(loc => [loc.id, loc])).values()
    )

    const currentTime = new Date()
    const checkPromises = uniqueLocations.map(async (location) => {
      // Skip if we checked this location in the last minute
      const lastChecked = this.checkedLocations.get(location.id)
      if (lastChecked && currentTime.getTime() - lastChecked.getTime() < 60000) {
        return
      }

      try {
        const response = await this.locationService.checkAppointmentAvailability(location.id)
        this.checkedLocations.set(location.id, currentTime)
        
        if (response.availableSlots.length > 0) {
          this.handleAvailableAppointments(location, response)
        }
      } catch (error) {
        console.error(`Error checking appointments for ${location.name}:`, error)
      }
    })

    await Promise.all(checkPromises)
  }

  private handleAvailableAppointments(location: Location, response: AppointmentResponse): void {
    const appointmentCount = response.availableSlots.length
    console.log(`[${new Date().toISOString()}] Found ${appointmentCount} appointments at ${location.name}`)
    
    // TODO: Implement notification system integration
    // For now, we'll just log to console
    const firstAppointment = response.availableSlots[0]
    console.log(`Next available appointment: ${new Date(firstAppointment.startTimestamp).toLocaleString()}`)
  }
}

// Function to start the appointment checker
export function startAppointmentChecker(getSelectedLocations: () => Location[]): () => void {
  const checker = AppointmentChecker.getInstance()
  const intervalId = setInterval(async () => {
    const selectedLocations = getSelectedLocations()
    await checker.checkLocations(selectedLocations)
  }, 60000) // Run every minute

  // Run immediately on start
  checker.checkLocations(getSelectedLocations())

  // Return cleanup function
  return () => clearInterval(intervalId)
} 