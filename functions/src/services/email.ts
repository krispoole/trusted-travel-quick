import { Resend } from "resend";
import * as logger from "firebase-functions/logger";
import * as functionsV2 from "firebase-functions/v2/https";
import * as functions from "firebase-functions";

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

// Don't initialize Resend at module load time
// Instead, create a function to get a Resend instance when needed
const getResendClient = (): Resend => {
  const resendApiKey = getEnvVar("RESEND_API_KEY") || getEnvVar("resend.api_key");
  if (!resendApiKey) {
    logger.error("Resend API key is missing. Make sure it's set in your environment or Firebase config.");
  }
  return new Resend(resendApiKey);
};

const getFrontendUrl = (): string => {
  return getEnvVar("FRONTEND_URL") || getEnvVar("frontend.url");
};

export class EmailService {
  /**
   * Sends a verification email to a user
   * @param email User's email address
   * @param displayName User's display name (if available)
   * @param verificationLink Firebase verification link
   */
  static async sendVerificationEmail(
    email: string,
    displayName: string | null,
    verificationLink: string
  ): Promise<void> {
    try {
      const name = displayName || email.split("@")[0];
      const resend = getResendClient();
      // We don't need frontendUrl here since we're using the verificationLink parameter
      // const frontendUrl = getFrontendUrl();

      const { data, error } = await resend.emails.send({
        from: "Trusted Travel Quick <support@krispoole.dev>",
        to: email,
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Hello ${name},</p>
            <p>Thank you for signing up with Trusted Travel Quick. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The Trusted Travel Quick Team</p>
          </div>
        `,
      });

      if (error) {
        logger.error("Error sending verification email:", error);
        throw new functionsV2.HttpsError("internal", "Failed to send verification email");
      }

      logger.info("Verification email sent successfully", { messageId: data?.id });
    } catch (error) {
      logger.error("Error in sendVerificationEmail:", error);
      throw new functionsV2.HttpsError("internal", "Failed to send verification email");
    }
  }

  /**
   * Sends a welcome email to a user after verification
   * @param email User's email address
   * @param displayName User's display name (if available)
   */
  static async sendWelcomeEmail(
    email: string,
    displayName: string | null
  ): Promise<void> {
    try {
      const name = displayName || email.split("@")[0];
      const resend = getResendClient();
      const frontendUrl = getFrontendUrl();

      const { data, error } = await resend.emails.send({
        from: "Trusted Travel Quick <support@krispoole.dev>", // Update with your domain
        to: email,
        subject: "Welcome to Trusted Travel Quick",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Trusted Travel Quick!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for verifying your email address. Your account is now fully activated.</p>
            <p>You can now access all features of Trusted Travel Quick.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            <p>Best regards,<br>The Trusted Travel Quick Team</p>
          </div>
        `,
      });

      if (error) {
        logger.error("Error sending welcome email:", error);
        throw new functionsV2.HttpsError("internal", "Failed to send welcome email");
      }

      logger.info("Welcome email sent successfully", { messageId: data?.id });
    } catch (error) {
      logger.error("Error in sendWelcomeEmail:", error);
      throw new functionsV2.HttpsError("internal", "Failed to send welcome email");
    }
  }
}
