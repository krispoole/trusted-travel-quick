import {db} from "../config/firebase";
import {Location} from "../types/location";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface LocationUpdate {
  lastChecked: admin.firestore.Timestamp;
  lastAppointmentFound?: admin.firestore.Timestamp;
}

/** Service class for handling appointment-related operations */
export class AppointmentService {
  /**
   * Retrieves all active locations with subscribers
   * @return {Promise<Location[]>} Array of active locations
   */
  static async getActiveLocations(): Promise<Location[]> {
    const snapshot = await db
      .collection("activeLocations")
      .where("subscriberCount", ">", 0)
      .get();

    return snapshot.docs.map((doc) => ({
      id: parseInt(doc.id),
      ...doc.data(),
    } as Location));
  }

  /**
   * Updates the lastChecked timestamp and checks for appointments
   * @param {Location[]} locations - Array of locations to update
   * @return {Promise<void>}
   */
  static async updateLastChecked(locations: Location[]): Promise<void> {
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    await Promise.all(locations.map(async (location) => {
      const ref = db.collection("activeLocations").doc(location.id.toString());
      const updateData: LocationUpdate = {
        lastChecked: now,
      };

      // Check for appointment availability
      const hasAppointment = await this.checkAppointmentAvailability(location);
      if (hasAppointment) {
        updateData.lastAppointmentFound = now;
        logger.info(`Found appointment for location ${location.id}`);
      }

      batch.update(ref, {[`${location.id}.lastChecked`]: now, ...(hasAppointment ? {[`${location.id}.lastAppointmentFound`]: now} : {})});
    }));

    await batch.commit();
  }

  /**
   * Checks if appointments are available for a given location
   * @param {Location} location - Location to check
   * @return {Promise<boolean>} Whether appointments are available
   */
  private static async checkAppointmentAvailability(location: Location): Promise<boolean> {
    // TODO: Implement actual appointment checking logic
    // This could involve making API calls, scraping websites, etc.
    return Math.random() < 0.2; // 20% chance to simulate finding an appointment
  }
}
