import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { AppointmentService } from "../../services/appointment";
import * as admin from "firebase-admin";
import { db } from "../../config/firebase";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const checkAppointments = onSchedule({
  schedule: "every 5 minutes",
  retryCount: 3,
  maxRetrySeconds: 60,
  // Add these options to help with Cloud Run configuration
  timeoutSeconds: 540,
  memory: "256MiB",
  minInstances: 0,
  concurrency: 1,
}, async (event) => {
  try {
    logger.info("Starting appointment check function", { event });

    // Get locations that have subscribers
    const locationsToCheck = await AppointmentService.getLocationsWithSubscribers();
    logger.info(`Found ${locationsToCheck.length} locations to check`);

    if (locationsToCheck.length === 0) {
      logger.info("No locations to check, exiting");
      return;
    }

    // Check each location for appointments and update timestamps
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    await Promise.all(locationsToCheck.map(async (location) => {
      const locationRef = db.collection("locations").doc(location.id);
      const hasAppointment = await AppointmentService.checkAppointmentAvailability(location);

      // Always update lastChecked, only update lastAppointmentFound if appointments are available
      const updateData = {
        lastChecked: now,
        ...(hasAppointment && { lastAppointmentFound: now }),
      };

      batch.update(locationRef, updateData);
      if (hasAppointment) {
        logger.info(`Found appointment for location ${location.id} (${location.name})`);
      }
    }));

    // Commit all updates in a single batch
    await batch.commit();
    logger.info("Successfully completed appointment checks");
  } catch (error) {
    logger.error("Error in appointment check function:", error);
    throw error;
  }
});
