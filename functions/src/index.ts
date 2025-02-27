import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Export scheduled functions
export { checkAppointments } from "./functions/scheduled/checkAppointments";

// Export auth functions
export {
  onUserCreated,
  handleEmailVerified,
  resendVerificationEmail,
} from "./functions/auth/userManagement";

// Add a health check endpoint for Cloud Run
export const healthCheck = onRequest({
  minInstances: 0,
  concurrency: 80,
}, async (req, res) => {
  logger.info("Health check received");
  res.status(200).send("OK");
});
