import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { AppointmentService } from "../../services/appointment";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const checkAppointments = onSchedule({
  schedule: "every 5 minutes",
  retryCount: 3,
  maxRetrySeconds: 60,
}, async () => {
  try {
    logger.info("Starting appointment check function");

    // Get locations that have subscribers
    const locationsToCheck = await AppointmentService.getLocationsWithSubscribers();
    logger.info(`Found ${locationsToCheck.length} locations to check`);

    if (locationsToCheck.length === 0) {
      logger.info("No locations to check, exiting");
      return;
    }

    // Update timestamps and check for appointments
    await AppointmentService.updateLocationTimestamps(locationsToCheck);
    logger.info("Successfully completed appointment checks");
  } catch (error) {
    logger.error("Error in appointment check function:", error);
    throw error;
  }
});
