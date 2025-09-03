/**
 * Notification Functions - Tattoo Journey 2.0
 * Firebase Functions for push notifications and messaging
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Send booking-related notifications
 */
export const sendBookingNotification = functions.firestore
  .document("bookings/{bookingId}")
  .onWrite(async (change, context) => {
    const bookingId = context.params.bookingId;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    if (!after) {
      // Booking deleted - notify relevant parties
      return;
    }

    try {
      // Determine notification type based on status change
      let notificationType = "";
      let recipientId = "";
      let title = "";
      let body = "";

      if (!before) {
        // New booking created
        notificationType = "booking_created";
        recipientId = after.artistId;
        title = "新しい予約リクエスト";
        body = "お客様から新しい予約リクエストが届きました";
      } else if (before.status !== after.status) {
        // Status changed
        switch (after.status) {
          case "confirmed":
            notificationType = "booking_confirmed";
            recipientId = after.customerId;
            title = "予約が確定しました";
            body = "アーティストが予約を承認しました";
            break;
          case "cancelled":
            notificationType = "booking_cancelled";
            recipientId =
              after.customerId === after.cancelledBy
                ? after.artistId
                : after.customerId;
            title = "予約がキャンセルされました";
            body = "予約がキャンセルされました。詳細をご確認ください";
            break;
          case "completed":
            notificationType = "booking_completed";
            recipientId = after.customerId;
            title = "セッション完了";
            body = "タトゥーセッションが完了しました。レビューを書いてください";
            break;
        }
      }

      if (notificationType && recipientId) {
        await sendPushNotification(recipientId, title, body, {
          type: notificationType,
          bookingId,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        });

        // Log notification
        await db.collection("notificationLogs").add({
          type: notificationType,
          recipientId,
          bookingId,
          title,
          body,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: "sent",
        });
      }
    } catch (error) {
      console.error("Error sending booking notification:", error);
    }
  });

/**
 * Send chat-related notifications
 */
export const sendChatNotification = functions.database
  .ref("/messages/{roomId}/{messageId}")
  .onCreate(async (snapshot, context) => {
    const roomId = context.params.roomId;
    const messageData = snapshot.val();

    try {
      // Get chat room participants
      const roomSnapshot = await admin
        .database()
        .ref(`/chatRooms/${roomId}`)
        .once("value");
      const roomData = roomSnapshot.val();

      if (!roomData || !roomData.participants) {
        return;
      }

      // Find recipient (not the sender)
      const recipientId = roomData.participants.find(
        (id: string) => id !== messageData.senderId,
      );

      if (!recipientId) {
        return;
      }

      // Get sender information
      const senderDoc = await db
        .collection("users")
        .doc(messageData.senderId)
        .get();
      const senderName = senderDoc.exists
        ? senderDoc.data()?.displayName
        : "Unknown User";

      // Prepare notification content
      let title = senderName;
      let body = messageData.text;

      // Handle different message types
      if (messageData.type === "image") {
        body = "📷 画像を送信しました";
      } else if (messageData.type === "booking_request") {
        body = "💼 予約リクエストを送信しました";
      } else if (messageData.text && messageData.text.length > 100) {
        body = messageData.text.substring(0, 97) + "...";
      }

      await sendPushNotification(recipientId, title, body, {
        type: "new_message",
        roomId,
        senderId: messageData.senderId,
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      });

      // Log notification
      await db.collection("notificationLogs").add({
        type: "new_message",
        recipientId,
        senderId: messageData.senderId,
        roomId,
        title,
        body,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "sent",
      });
    } catch (error) {
      console.error("Error sending chat notification:", error);
    }
  });

/**
 * Send push notification to user
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: { [key: string]: string },
): Promise<void> {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.warn("User not found for notification:", userId);
      return;
    }

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.warn("No FCM tokens found for user:", userId);
      return;
    }

    // Check notification preferences
    const notificationSettings = userData.notificationSettings || {};
    const notificationType = data.type || "general";

    if (notificationSettings[notificationType] === false) {
      console.log("User has disabled notifications for:", notificationType);
      return;
    }

    // Prepare message payload
    const message = {
      notification: {
        title,
        body,
      },
      data,
      android: {
        notification: {
          sound: "default",
          channelId: "tattoo_journey_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    // Send to all user's devices
    const promises = fcmTokens.map(async (token: string) => {
      try {
        await admin.messaging().send({
          ...message,
          token,
        });
        console.log("Notification sent successfully to:", token);
      } catch (tokenError: any) {
        console.warn("Failed to send to token:", token, tokenError.message);

        // Remove invalid tokens
        if (
          tokenError.code === "messaging/invalid-registration-token" ||
          tokenError.code === "messaging/registration-token-not-registered"
        ) {
          await db
            .collection("users")
            .doc(userId)
            .update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
            });
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Error in push notification:", error);
    throw error;
  }
}

/**
 * Handle FCM token registration/update
 */
export const updateFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { token } = data;
  const userId = context.auth.uid;

  if (!token) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "FCM token is required",
    );
  }

  try {
    // Add token to user's FCM tokens array
    await db
      .collection("users")
      .doc(userId)
      .update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error("Error updating FCM token:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update FCM token",
    );
  }
});

/**
 * Clean up old FCM tokens
 */
export const cleanupFCMTokens = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    try {
      const usersSnapshot = await db
        .collection("users")
        .where("fcmTokens", "!=", null)
        .get();

      const cleanupPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        // Test each token
        const validTokens = [];

        for (const token of fcmTokens) {
          try {
            await admin.messaging().send(
              {
                token,
                data: { test: "true" },
              },
              true,
            ); // Dry run
            validTokens.push(token);
          } catch (error) {
            console.log("Invalid token removed:", token);
          }
        }

        // Update user with valid tokens only
        if (validTokens.length !== fcmTokens.length) {
          await userDoc.ref.update({
            fcmTokens: validTokens,
            lastTokenCleanup: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await Promise.allSettled(cleanupPromises);
      console.log("FCM token cleanup completed");
    } catch (error) {
      console.error("Error during FCM token cleanup:", error);
    }
  });
