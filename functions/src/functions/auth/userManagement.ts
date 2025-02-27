import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { EmailService } from "../../services/email";
import { getAuth, UserRecord } from "firebase-admin/auth";

// Get environment variables based on environment
const getEnvVar = (name: string, defaultValue: string = ""): string => {
  // Check if running in production (Firebase Functions)
  if (process.env.NODE_ENV === "production") {
    try {
      // For production, use Firebase Functions config
      const config = functions.config();

      // Parse the name to get the section and key (e.g., "resend.api_key")
      const [section, key] = name.split(".");
      return config?.[section]?.[key] || defaultValue;
    } catch (error) {
      logger.error("Error getting config variable:", error);
      return defaultValue;
    }
  } else {
    // For local development, use process.env
    return process.env[name] || defaultValue;
  }
};

// Get frontend URL for verification links
const frontendUrl = getEnvVar("FRONTEND_URL") || getEnvVar("frontend.url");

/**
 * Trigger function that runs when a new user is created
 * Sends a verification email to the user
 */
export const onUserCreated = functions.auth.user().onCreate(async (user: UserRecord) => {
  try {
    logger.info("New user created", { uid: user.uid, email: user.email });

    // Skip if email is not available or already verified
    if (!user.email || user.emailVerified) {
      logger.info("Skipping verification email", {
        reason: !user.email ? "No email" : "Already verified",
      });
      return;
    }

    // Generate email verification link
    const actionCodeSettings = {
      url: `${frontendUrl}/auth/verify-email-success`,
      handleCodeInApp: true,
    };

    const verificationLink = await getAuth().generateEmailVerificationLink(
      user.email,
      actionCodeSettings
    );

    // Send verification email
    await EmailService.sendVerificationEmail(
      user.email,
      user.displayName || null,
      verificationLink
    );

    logger.info("Verification email sent successfully", { uid: user.uid });
  } catch (error) {
    logger.error("Error in onUserCreated function:", error);
  }
});

/**
 * HTTP function to handle email verification success
 * This is called when a user clicks the verification link in their email
 */
export const handleEmailVerified = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to verify email"
      );
    }

    const uid = context.auth.uid;
    const user = await getAuth().getUser(uid);

    // Check if email is verified
    if (user.emailVerified) {
      logger.info("User email already verified", { uid });

      // Send welcome email if not already sent
      await EmailService.sendWelcomeEmail(
        user.email || "",
        user.displayName || null
      );

      return { success: true, message: "Email already verified" };
    }

    // If not verified, ask user to check their email or request a new verification link
    return {
      success: false,
      message: "Email not verified. Please check your email or request a new verification link.",
    };
  } catch (error) {
    logger.error("Error in handleEmailVerified function:", error);
    throw new functions.https.HttpsError("internal", "Error verifying email");
  }
});

/**
 * HTTP function to resend verification email
 * This can be called by the user if they didn't receive the initial verification email
 */
export const resendVerificationEmail = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to request verification email"
      );
    }

    const uid = context.auth.uid;
    const user = await getAuth().getUser(uid);

    // Check if user has an email
    if (!user.email) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User does not have an email address"
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: "Email is already verified",
      };
    }

    // Generate email verification link
    const actionCodeSettings = {
      url: `${frontendUrl}/auth/verify-email-success`,
      handleCodeInApp: true,
    };

    const verificationLink = await getAuth().generateEmailVerificationLink(
      user.email,
      actionCodeSettings
    );

    // Send verification email
    await EmailService.sendVerificationEmail(
      user.email,
      user.displayName || null,
      verificationLink
    );

    logger.info("Verification email resent successfully", { uid });
    return {
      success: true,
      message: "Verification email sent. Please check your inbox.",
    };
  } catch (error) {
    logger.error("Error in resendVerificationEmail function:", error);
    throw new functions.https.HttpsError("internal", "Error sending verification email");
  }
});
