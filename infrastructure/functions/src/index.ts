/**
 * Firebase Functions Entry Point - Tattoo Journey 2.0
 * Main exports for all cloud functions
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// ✅ Import and export all function modules
export {
  auditChatImageDeletion,
  restoreDeletedImage,
} from "./chatImageDeletionAudit";

export { advancedEmailValidation } from "./authFunctions";

export {
  processImageAnalysis,
  generateAIMatching,
} from "./aiMatchingFunctions";

export {
  sendBookingNotification,
  sendChatNotification,
} from "./notificationFunctions";

export { generateMatchingScore, updateArtistScore } from "./scoringFunctions";

// Health check endpoint
import * as functions from "firebase-functions";

export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: "healthy",
    timestamp: Date.now(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});
