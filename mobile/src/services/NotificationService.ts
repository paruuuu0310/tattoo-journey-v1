import messaging from "@react-native-firebase/messaging";
import firestore from "@react-native-firebase/firestore";
import { Platform, Alert, PermissionsAndroid } from "react-native";

export interface NotificationData {
  type:
    | "booking_request"
    | "booking_confirmed"
    | "booking_cancelled"
    | "message"
    | "review_received"
    | "promotion";
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  createdAt: Date;
  isRead: boolean;
  priority?: "low" | "normal" | "high";
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private currentFCMToken: string | null = null;
  private unsubscribeFromTokenRefresh: (() => void) | null = null;
  private unsubscribeFromMessages: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 通知サービスの初期化
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Initializing notification service

      // 通知権限の確認・取得
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn("Notification permission not granted");
        return;
      }

      // FCMトークンの取得と管理
      await this.getFCMToken(userId);

      // メッセージリスナーの設定
      this.setupMessageHandlers();

      // バックグラウンドメッセージハンドラーの設定
      this.setupBackgroundMessageHandler();

      // Notification service initialized successfully
    } catch (error) {
      console.error("Error initializing notification service:", error);
      throw error;
    }
  }

  /**
   * 通知権限の確認と取得
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        // Android 13以降の通知権限チェック
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        }
      }

      // Firebase Messaging権限の取得
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert(
          "通知設定",
          "プッシュ通知を受信するために、設定から通知を有効にしてください。",
          [
            { text: "キャンセル", style: "cancel" },
            {
              text: "設定を開く",
              onPress: () => this.openNotificationSettings(),
            },
          ],
        );
      }

      return enabled;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * FCMトークンの取得と管理
   */
  private async getFCMToken(userId: string): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.currentFCMToken = token;

      if (token) {
        // FCM Token obtained

        // トークンをFirestoreに保存
        await this.saveFCMTokenToFirestore(userId, token);

        // トークンの更新を監視
        this.unsubscribeFromTokenRefresh = messaging().onTokenRefresh(
          (newToken) => {
            // FCM Token refreshed
            this.currentFCMToken = newToken;
            this.saveFCMTokenToFirestore(userId, newToken);
          },
        );
      }

      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * FCMトークンをFirestoreに保存
   */
  private async saveFCMTokenToFirestore(
    userId: string,
    token: string,
  ): Promise<void> {
    try {
      await firestore().collection("users").doc(userId).update({
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
        platform: Platform.OS,
        appVersion: "2.0.0", // 実際のアプリバージョンを設定
      });

      // デバイス固有の通知設定も保存
      await firestore()
        .collection("userNotificationSettings")
        .doc(userId)
        .set(
          {
            fcmToken: token,
            platform: Platform.OS,
            enabledNotificationTypes: {
              booking_request: true,
              booking_confirmed: true,
              booking_cancelled: true,
              message: true,
              review_received: true,
              promotion: false, // デフォルトはオプトアウト
            },
            lastUpdated: new Date(),
          },
          { merge: true },
        );
    } catch (error) {
      console.error("Error saving FCM token to Firestore:", error);
    }
  }

  /**
   * メッセージハンドラーの設定
   */
  private setupMessageHandlers(): void {
    // フォアグラウンドでのメッセージ受信
    this.unsubscribeFromMessages = messaging().onMessage(
      async (remoteMessage) => {
        // Foreground message received

        // アプリ内通知として表示
        if (remoteMessage.notification) {
          this.showInAppNotification(remoteMessage);
        }

        // カスタムデータの処理
        if (remoteMessage.data) {
          await this.handleNotificationData(remoteMessage.data);
        }
      },
    );

    // 通知タップでのアプリ起動
    messaging().onNotificationOpenedApp((remoteMessage) => {
      // Notification caused app to open from background
      this.handleNotificationTap(remoteMessage);
    });

    // アプリが閉じている状態からの起動
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          // Notification caused app to open from quit state
          this.handleNotificationTap(remoteMessage);
        }
      });
  }

  /**
   * バックグラウンドメッセージハンドラーの設定
   */
  private setupBackgroundMessageHandler(): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // Background message received

      // バックグラウンドでのカスタム処理
      if (remoteMessage.data) {
        await this.handleBackgroundNotification(remoteMessage.data);
      }
    });
  }

  /**
   * アプリ内通知の表示
   */
  private showInAppNotification(remoteMessage: any): void {
    const { notification } = remoteMessage;

    Alert.alert(notification?.title || "お知らせ", notification?.body || "", [
      { text: "OK", style: "default" },
      {
        text: "詳細を見る",
        style: "default",
        onPress: () => this.handleNotificationTap(remoteMessage),
      },
    ]);
  }

  /**
   * 通知タップ時の処理
   */
  private handleNotificationTap(remoteMessage: any): void {
    const { data } = remoteMessage;

    if (data?.type) {
      switch (data.type) {
        case "booking_request":
          // 予約リクエスト画面に遷移
          this.navigateToScreen("BookingRequests", {
            bookingId: data.bookingId,
          });
          break;

        case "booking_confirmed":
          // 予約確認画面に遷移
          this.navigateToScreen("BookingConfirmation", {
            bookingId: data.bookingId,
          });
          break;

        case "message":
          // チャット画面に遷移
          this.navigateToScreen("Chat", {
            roomId: data.roomId,
            userId: data.senderId,
          });
          break;

        case "review_received":
          // レビュー詳細画面に遷移
          this.navigateToScreen("ReviewDetail", { reviewId: data.reviewId });
          break;

        default:
          // デフォルトは通知一覧画面
          this.navigateToScreen("Notifications");
          break;
      }
    }
  }

  /**
   * 通知データの処理
   */
  private async handleNotificationData(
    data: Record<string, any>,
  ): Promise<void> {
    try {
      // 通知をローカルDBに保存
      await this.saveNotificationToLocal(data);

      // バッジ数の更新
      await this.updateBadgeCount();

      // カスタムデータに基づく追加処理
      if (data.type === "booking_request") {
        // 新しい予約リクエストのカウントを更新
        await this.updateBookingRequestCount();
      }
    } catch (error) {
      console.error("Error handling notification data:", error);
    }
  }

  /**
   * バックグラウンド通知の処理
   */
  private async handleBackgroundNotification(
    data: Record<string, any>,
  ): Promise<void> {
    try {
      // バックグラウンドでの軽量な処理のみ
      await this.saveNotificationToLocal(data);
    } catch (error) {
      console.error("Error handling background notification:", error);
    }
  }

  /**
   * 特定ユーザーに通知を送信
   */
  async sendNotificationToUser(
    targetUserId: string,
    payload: PushNotificationPayload,
    notificationType: NotificationData["type"],
  ): Promise<void> {
    try {
      // ユーザーのFCMトークンを取得
      const userDoc = await firestore()
        .collection("users")
        .doc(targetUserId)
        .get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.warn("FCM token not found for user:", targetUserId);
        return;
      }

      // 通知設定を確認
      const notificationSettings =
        await this.getUserNotificationSettings(targetUserId);
      if (!notificationSettings.enabledNotificationTypes[notificationType]) {
        // Notification type disabled for user
        return;
      }

      // FCMメッセージの構築
      const message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          type: notificationType,
          ...payload.data,
        },
        android: {
          notification: {
            sound: payload.sound || "default",
            priority: "high",
            channelId: "tattoo_journey_notifications",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: payload.sound || "default",
              badge: payload.badge,
              alert: {
                title: payload.title,
                body: payload.body,
              },
            },
          },
        },
      };

      // Cloud Functions経由で送信（実際の実装では）
      // ここではFirestore経由でキューに追加
      await firestore()
        .collection("notificationQueue")
        .add({
          ...message,
          createdAt: new Date(),
          status: "pending",
        });

      // Notification queued for user
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * 複数ユーザーに通知を送信
   */
  async sendNotificationToMultipleUsers(
    userIds: string[],
    payload: PushNotificationPayload,
    notificationType: NotificationData["type"],
  ): Promise<void> {
    try {
      const sendPromises = userIds.map((userId) =>
        this.sendNotificationToUser(userId, payload, notificationType),
      );

      await Promise.allSettled(sendPromises);
    } catch (error) {
      console.error("Error sending notifications to multiple users:", error);
      throw error;
    }
  }

  /**
   * トピックの購読
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      // Subscribed to topic
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      throw error;
    }
  }

  /**
   * トピックの購読解除
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      // Unsubscribed from topic
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
      throw error;
    }
  }

  /**
   * ユーザーの通知設定を取得
   */
  private async getUserNotificationSettings(userId: string): Promise<any> {
    try {
      const doc = await firestore()
        .collection("userNotificationSettings")
        .doc(userId)
        .get();

      return doc.exists
        ? doc.data()
        : {
            enabledNotificationTypes: {
              booking_request: true,
              booking_confirmed: true,
              booking_cancelled: true,
              message: true,
              review_received: true,
              promotion: false,
            },
          };
    } catch (error) {
      console.error("Error getting notification settings:", error);
      return { enabledNotificationTypes: {} };
    }
  }

  /**
   * 通知をローカルに保存
   */
  private async saveNotificationToLocal(
    data: Record<string, any>,
  ): Promise<void> {
    // 実際の実装では、AsyncStorageまたはローカルDBに保存
    // Saving notification to local storage
  }

  /**
   * バッジ数の更新
   */
  private async updateBadgeCount(): Promise<void> {
    // 実際の実装では、未読通知数を計算してバッジを更新
    // Updating badge count
  }

  /**
   * 予約リクエスト数の更新
   */
  private async updateBookingRequestCount(): Promise<void> {
    // 実際の実装では、新しい予約リクエスト数を更新
    // Updating booking request count
  }

  /**
   * 画面遷移（実際の実装では適切なナビゲーションサービスを使用）
   */
  private navigateToScreen(
    screenName: string,
    params?: Record<string, any>,
  ): void {
    // Navigate to screen
    // 実際の実装では、React Navigationを使用
  }

  /**
   * 通知設定画面を開く
   */
  private openNotificationSettings(): void {
    // 実際の実装では、デバイスの設定画面を開く
    // Opening notification settings
  }

  /**
   * サービスのクリーンアップ
   */
  cleanup(): void {
    if (this.unsubscribeFromTokenRefresh) {
      this.unsubscribeFromTokenRefresh();
    }
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
    }
  }

  /**
   * 現在のFCMトークンを取得
   */
  getCurrentToken(): string | null {
    return this.currentFCMToken;
  }

  /**
   * 通知チャンネルの設定（Android）
   */
  async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === "android") {
      // 実際の実装では、react-native-push-notification等を使用
      // Setting up Android notification channels
    }
  }
}

// 予約関連の通知ヘルパー
export const BookingNotifications = {
  // 新規予約リクエスト通知
  sendBookingRequest: async (
    artistId: string,
    customerName: string,
    bookingId: string,
  ) => {
    const payload: PushNotificationPayload = {
      title: "新しい予約リクエスト",
      body: `${customerName}様から予約リクエストが届きました`,
      data: { bookingId, type: "booking_request" },
    };

    await NotificationService.getInstance().sendNotificationToUser(
      artistId,
      payload,
      "booking_request",
    );
  },

  // 予約確定通知
  sendBookingConfirmation: async (
    customerId: string,
    artistName: string,
    bookingId: string,
  ) => {
    const payload: PushNotificationPayload = {
      title: "予約が確定しました",
      body: `${artistName}様との予約が確定しました`,
      data: { bookingId, type: "booking_confirmed" },
    };

    await NotificationService.getInstance().sendNotificationToUser(
      customerId,
      payload,
      "booking_confirmed",
    );
  },

  // 予約キャンセル通知
  sendBookingCancellation: async (
    userId: string,
    reason: string,
    bookingId: string,
  ) => {
    const payload: PushNotificationPayload = {
      title: "予約がキャンセルされました",
      body: reason,
      data: { bookingId, type: "booking_cancelled" },
    };

    await NotificationService.getInstance().sendNotificationToUser(
      userId,
      payload,
      "booking_cancelled",
    );
  },
};

export default NotificationService.getInstance();
