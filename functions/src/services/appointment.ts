import { db } from "../config/firebase";
import { Location } from "../types/location";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import type { DocumentData } from "firebase-admin/firestore";
import fetch from "node-fetch";

/** Service class for handling appointment-related operations */
export class AppointmentService {
  /**
   * Retrieves all locations that have active subscribers
   * @return {Promise<Location[]>} Array of locations with subscribers
   */
  static async getLocationsWithSubscribers(): Promise<Location[]> {
    try {
      // Get unique locationIds from userLocations
      const userLocationsSnapshot = await db.collection("userLocations").get();
      const locationIds = new Set(
        userLocationsSnapshot.docs.map((doc: DocumentData) => doc.data().locationId)
      );

      if (locationIds.size === 0) {
        logger.info("No locations with subscribers found");
        return [];
      }

      // Get the actual location documents
      const locationsPromises = Array.from(locationIds).map(async (locationId) => {
        const locationDoc = await db.collection("locations").doc(locationId).get();
        if (!locationDoc.exists) return null;

        return {
          id: locationId,
          ...locationDoc.data(),
        } as Location;
      });

      const locations = (await Promise.all(locationsPromises))
        .filter((loc): loc is Location => loc !== null);

      logger.info(`Found ${locations.length} locations with subscribers`);
      return locations;
    } catch (error) {
      logger.error("Error getting locations with subscribers:", error);
      throw error;
    }
  }

  /**
   * Updates the lastChecked timestamp and lastAppointmentFound if appointments are available
   * @param {Location[]} locations - Array of locations to update
   * @return {Promise<void>}
   */
  static async updateLocationTimestamps(locations: Location[]): Promise<void> {
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    try {
      await Promise.all(locations.map(async (location) => {
        const locationRef = db.collection("locations").doc(location.id);

        // Create base update data with just lastChecked
        const updateData = {
          lastChecked: now,
        };

        // Check for appointment availability
        const hasAppointment = await this.checkAppointmentAvailability(location);

        // Only add lastAppointmentFound if there is an appointment
        if (hasAppointment) {
          Object.assign(updateData, { lastAppointmentFound: now });
          logger.info(`Found appointment for location ${location.id}`);
        }

        // Update the document with the prepared data
        batch.update(locationRef, updateData);
      }));

      await batch.commit();
      logger.info(`Updated timestamps for ${locations.length} locations`);
    } catch (error) {
      logger.error("Error updating location timestamps:", error);
      throw error;
    }
  }

  /**
   * Checks if appointments are available for a given location
   * @param {Location} location - Location to check
   * @return {Promise<boolean>} Whether appointments are available
   */
  static async checkAppointmentAvailability(location: Location): Promise<boolean> {
    try {
      const numericId = parseInt(location.id, 10);
      if (isNaN(numericId)) {
        logger.error(`Invalid location ID: ${location.id}`);
        return false;
      }

      const response = await fetch(
        "https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=3&" +
        `locationId=${numericId}&minimum=1`
      );

      if (!response.ok) {
        if (response.status === 404) {
          logger.info(`No appointments found for location ${location.id}`);
          return false;
        }
        logger.error(
          `Failed to check appointments for location ${location.id}: ` +
          `${response.status} ${response.statusText}`
        );
        return false;
      }

      const slots = await response.json();
      const hasAppointments = Array.isArray(slots) && slots.length > 0;

      if (hasAppointments) {
        logger.info(`Found ${slots.length} appointment slots for location ${location.id}`);
      } else {
        logger.info(`No appointment slots available for location ${location.id}`);
      }

      return hasAppointments;
    } catch (error) {
      logger.error(`Error checking appointment availability for location ${location.id}:`, error);
      return false;
    }
  }
}
