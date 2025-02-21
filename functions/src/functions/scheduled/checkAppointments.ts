import {onSchedule} from "firebase-functions/v2/scheduler";
import type {ScheduledEvent} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import {AppointmentService} from "../../services/appointment";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const checkAppointments = onSchedule({
  schedule: "every 5 minutes",
  timeoutSeconds: 300,
  memory: "1GiB",
}, async (event: ScheduledEvent): Promise<void> => {
  try {
    logger.info("Starting appointment check...");

    // Get and process active locations
    const activeLocations = await AppointmentService.getActiveLocations();
    logger.info(`Found ${activeLocations.length} active locations`);

    // Update timestamps and check for appointments
    await AppointmentService.updateLastChecked(activeLocations);

    logger.info("Successfully updated timestamps");
  } catch (error) {
    logger.error("Error in appointment check function:", error);
    throw error;
  }
});
