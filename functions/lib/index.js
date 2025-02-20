"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAppointments = void 0;
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const axios_1 = __importDefault(require("axios"));
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const NOTIFICATIONS_LIMIT = 3;
const NEXT_DAY_HOUR = 6; // 6 AM
/**
 * Scheduled function that checks for appointment availability
 * Runs every 10 minutes
 */
exports.checkAppointments = (0, scheduler_1.onSchedule)({
    schedule: "*/10 * * * *",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 120,
}, async () => {
    var _a, _b;
    try {
        // Get current time
        const now = new Date();
        // Reset daily notifications at 6am
        await resetDailyNotifications(now);
        // Get all active users with remaining notifications
        const usersSnapshot = await db.collection("users")
            .where("notificationsRemaining", ">", 0)
            .where("dailyNotificationsSent", "<", NOTIFICATIONS_LIMIT)
            .get();
        const users = [];
        usersSnapshot.forEach((doc) => {
            var _a;
            const userData = doc.data();
            users.push({
                id: doc.id,
                selectedLocations: userData.selectedLocations || [],
                notificationsRemaining: userData.notificationsRemaining,
                dailyNotificationsSent: userData.dailyNotificationsSent || 0,
                lastNotificationReset: (_a = userData.lastNotificationReset) === null || _a === void 0 ? void 0 : _a.toDate(),
            });
        });
        if (users.length === 0) {
            console.log("No eligible users found for notifications");
            return;
        }
        // Get all unique location IDs from eligible users
        const uniqueLocationIds = [...new Set(users.flatMap((user) => user.selectedLocations))];
        // Get location checks
        const locationChecksSnapshot = await db.collection("locationChecks")
            .where("locationId", "in", uniqueLocationIds)
            .get();
        const locationChecks = new Map();
        locationChecksSnapshot.forEach((doc) => {
            const data = doc.data();
            locationChecks.set(data.locationId, Object.assign(Object.assign({}, data), { lastCheck: data.lastCheck.toDate(), nextCheckTime: data.nextCheckTime.toDate(), locationId: "", hasAvailability: false }));
        });
        // Filter locations that need checking
        const locationsToCheck = uniqueLocationIds.filter((locationId) => {
            const check = locationChecks.get(locationId);
            return !check || now >= check.nextCheckTime;
        });
        // Check filtered locations
        for (const locationId of locationsToCheck) {
            try {
                const response = await axios_1.default.get(`https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=${locationId}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Accept": "application/json",
                    },
                });
                const hasAvailability = ((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.availableSlots) === null || _b === void 0 ? void 0 : _b.length) > 0;
                const nextCheckTime = getNextCheckTime(now, hasAvailability);
                // Update location check record
                await db.collection("locationChecks").doc(locationId).set({
                    locationId,
                    lastCheck: firestore_1.Timestamp.fromDate(now),
                    hasAvailability,
                    nextCheckTime: firestore_1.Timestamp.fromDate(nextCheckTime),
                });
                if (hasAvailability) {
                    await handleAvailableAppointments(locationId, response.data, users.filter((u) => u.selectedLocations.includes(locationId)));
                }
            }
            catch (error) {
                console.error(`Error checking location ${locationId}:`, error);
                continue;
            }
        }
        // Update system check record
        await db.collection("system").doc("appointmentChecks").set({
            lastCheck: firestore_1.FieldValue.serverTimestamp(),
            status: "success",
        });
    }
    catch (error) {
        console.error("Error in scheduled function:", error);
        await db.collection("system").doc("appointmentChecks").set({
            lastCheck: firestore_1.FieldValue.serverTimestamp(),
            status: "error",
            error: error.message,
        });
    }
});
/**
 * Handles creating notifications for users when appointments are available
 * @param {string} locationId - The ID of the location with availability
 * @param {AppointmentData} appointmentData - The appointment availability data
 * @param {User[]} eligibleUsers - Array of users eligible for notifications
 */
async function handleAvailableAppointments(locationId, appointmentData, eligibleUsers) {
    var _a;
    const locationDoc = await db.collection("locations").doc(locationId).get();
    const locationName = ((_a = locationDoc.data()) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Location";
    const batch = db.batch();
    for (const user of eligibleUsers) {
        if (user.notificationsRemaining <= 0 ||
            user.dailyNotificationsSent >= NOTIFICATIONS_LIMIT) {
            continue;
        }
        // Create notification
        const notificationRef = db.collection("notifications").doc();
        const appointmentDate = new Date(appointmentData.availableSlots[0].timestamp).toLocaleString();
        batch.set(notificationRef, {
            userId: user.id,
            locationId,
            locationName,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
            message: `Appointment available for ${locationName} 
                    on ${appointmentDate}`,
            read: false,
        });
        // Update user notification counts
        const userRef = db.collection("users").doc(user.id);
        batch.update(userRef, {
            notificationsRemaining: firestore_1.FieldValue.increment(-1),
            dailyNotificationsSent: firestore_1.FieldValue.increment(1),
        });
    }
    await batch.commit();
    console.log(`Notifications created for location ${locationName}`);
}
/**
 * Determines the next time to check a location based on availability
 * @param {Date} now - Current timestamp
 * @param {boolean} hasAvailability - If appointments are currently available
 * @return {Date} The next time to check this location
 */
function getNextCheckTime(now, hasAvailability) {
    if (hasAvailability) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(NEXT_DAY_HOUR, 0, 0, 0);
        return tomorrow;
    }
    else {
        return new Date(now.getTime() + 10 * 60 * 1000);
    }
}
/**
 * Resets daily notification counts for users at 6am
 * @param {Date} now - Current timestamp
 */
async function resetDailyNotifications(now) {
    const resetHour = now.getHours();
    if (resetHour === NEXT_DAY_HOUR) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(NEXT_DAY_HOUR, 0, 0, 0);
        const usersToReset = await db.collection("users")
            .where("lastNotificationReset", "<", firestore_1.Timestamp.fromDate(yesterday))
            .get();
        const batch = db.batch();
        usersToReset.forEach((doc) => {
            batch.update(doc.ref, {
                dailyNotificationsSent: 0,
                lastNotificationReset: firestore_1.Timestamp.fromDate(now),
            });
        });
        if (!usersToReset.empty) {
            await batch.commit();
            console.log(`Reset daily notifications for ${usersToReset.size} users`);
        }
    }
}
//# sourceMappingURL=index.js.map