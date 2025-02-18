/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import axios from "axios";

initializeApp();
const db = getFirestore();

interface User {
  id: string;
  selectedLocations: string[];
}

// Scheduled function (runs every 10 minutes)
export const checkAppointments = onSchedule({
  schedule: "*/10 * * * *",
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 120,
}, async (_event) => {
  try {
    // Get all users and their selected locations
    const usersSnapshot = await db.collection("users").get();
    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        selectedLocations: doc.data().selectedLocations || [],
      });
    });

    // Get all unique location IDs
    const uniqueLocationIds = [...new Set(
      users.flatMap((user) => user.selectedLocations)
    )];

    // Check each location for availability
    for (const locationId of uniqueLocationIds) {
      try {
        const response = await axios.get(
          `https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=${locationId}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "application/json",
            },
          }
        );

        // If appointments are available
        if (response.data && response.data.availableSlots?.length > 0) {
          // Get location details
          const locationDoc = await db.collection("locations")
            .doc(locationId).get();
          const locationName = locationDoc.data()?.name || "Unknown Location";

          // Find users who selected this location
          const interestedUsers = users.filter((user) =>
            user.selectedLocations.includes(locationId)
          );

          // Create notifications for interested users
          const notifications = interestedUsers.map((user) => ({
            userId: user.id,
            locationId,
            locationName,
            timestamp: FieldValue.serverTimestamp(),
            message: `Appointment available for ${locationName} on 
                ${new Date(response.data.availableSlots[0]
              .timestamp).toLocaleString()}`,
            read: false,
          }));

          // Batch write notifications
          const batch = db.batch();
          notifications.forEach((notification) => {
            const notificationRef = db.collection("notifications").doc();
            batch.set(notificationRef, notification);
          });

          await batch.commit();
          console.log(`Notifications created for location ${locationName}`);
        }
      } catch (error) {
        console.error(`Error checking location ${locationId}:`, error);
        continue; // Continue checking other locations even if one fails
      }
    }

    // Update last check timestamp
    await db.collection("system").doc("appointmentChecks").set({
      lastCheck: FieldValue.serverTimestamp(),
      status: "success",
    });
  } catch (error) {
    console.error("Error in scheduled function:", error);
    await db.collection("system").doc("appointmentChecks").set({
      lastCheck: FieldValue.serverTimestamp(),
      status: "error",
      error: (error as Error).message,
    });
  }
});
