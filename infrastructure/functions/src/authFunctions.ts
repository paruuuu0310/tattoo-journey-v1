/**
 * Authentication Functions - Tattoo Journey 2.0
 * Firebase Functions for user authentication and validation
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Joi from "joi";

const db = admin.firestore();

/**
 * Advanced Email Validation Function
 * Validates email addresses with enhanced security checks
 */
export const advancedEmailValidation = functions.https.onCall(
  async (data, context) => {
    const { email } = data;

    // Input validation
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error } = schema.validate({ email });
    if (error) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        error.details[0].message,
      );
    }

    try {
      // Check if email already exists
      const existingUser = await admin
        .auth()
        .getUserByEmail(email)
        .catch(() => null);

      if (existingUser) {
        return {
          valid: false,
          reason: "Email already registered",
          suggestions: [],
        };
      }

      // Domain validation
      const domain = email.split("@")[1];
      const disposableEmailDomains = [
        "10minutemail.com",
        "tempmail.org",
        "guerrillamail.com",
        "mailinator.com",
      ];

      if (disposableEmailDomains.includes(domain)) {
        return {
          valid: false,
          reason: "Disposable email addresses are not allowed",
          suggestions: ["gmail.com", "yahoo.com", "outlook.com"],
        };
      }

      // Log validation attempt
      await db.collection("emailValidationLogs").add({
        email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        result: "valid",
        ipAddress: context.rawRequest.ip,
        userAgent: context.rawRequest.headers["user-agent"],
      });

      return {
        valid: true,
        reason: "Email is valid and available",
        suggestions: [],
      };
    } catch (error) {
      console.error("Email validation error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to validate email",
      );
    }
  },
);

/**
 * User Registration Handler
 * Handles user creation and profile setup
 */
export const handleUserRegistration = functions.auth
  .user()
  .onCreate(async (user) => {
    try {
      // Create initial user document in Firestore
      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        userType: null, // To be set during onboarding
        profileCompleted: false,
        isActive: true,
      });

      console.log("User profile created successfully:", user.uid);
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  });

/**
 * User Deletion Handler
 * Cleans up user data when account is deleted
 */
export const handleUserDeletion = functions.auth
  .user()
  .onDelete(async (user) => {
    try {
      // Remove user document
      await db.collection("users").doc(user.uid).delete();

      // Remove user from any active chat rooms
      const chatRoomsSnapshot = await db
        .collection("chatRooms")
        .where("participants", "array-contains", user.uid)
        .get();

      const batch = db.batch();
      chatRoomsSnapshot.docs.forEach((doc) => {
        const participants = doc
          .data()
          .participants.filter((id: string) => id !== user.uid);
        batch.update(doc.ref, { participants });
      });

      await batch.commit();

      console.log("User data cleanup completed:", user.uid);
    } catch (error) {
      console.error("Error during user deletion cleanup:", error);
    }
  });
