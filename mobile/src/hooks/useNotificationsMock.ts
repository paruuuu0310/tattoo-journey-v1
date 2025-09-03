import { useState, useCallback, useRef, useEffect } from "react";
import { Alert, ToastAndroid, Platform } from "react-native";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
  duration?: number;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  action: "primary" | "secondary";
  onPress: () => void;
}

export interface UseNotificationsMock {
  notifications: NotificationData[];
  showNotification: (
    notification: Omit<NotificationData, "id" | "timestamp">,
  ) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;

  // Booking-specific notifications
  notifyBookingRequest: (artistName: string, bookingId: string) => void;
  notifyBookingApproved: (artistName: string, date: Date) => void;
  notifyBookingChanged: (artistName: string, newDate: Date) => void;
  notifyReviewPrompt: (artistName: string, bookingId: string) => void;

  // Settings notifications with optimistic updates
  notifySettingsToggle: (
    setting: string,
    newValue: boolean,
    rollbackFn?: () => void,
  ) => void;

  // System notifications
  notifySystemError: (error: string, context?: string) => void;
  notifyNetworkStatus: (isOnline: boolean) => void;

  // Analytics
  getNotificationStats: () => {
    totalShown: number;
    byType: Record<NotificationType, number>;
    averageDisplayTime: number;
  };
}

const NOTIFICATION_DURATIONS = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 7000,
} as const;

const NOTIFICATION_EMOJIS = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
} as const;

export const useNotificationsMock = (): UseNotificationsMock => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const displayTimes = useRef<Map<string, number>>(new Map());
  const notificationStats = useRef({
    totalShown: 0,
    byType: {
      success: 0,
      error: 0,
      warning: 0,
      info: 0,
    } as Record<NotificationType, number>,
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showNativeNotification = useCallback(
    (notification: NotificationData) => {
      const message = `${NOTIFICATION_EMOJIS[notification.type]} ${notification.title}\n${notification.message}`;

      if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.LONG);
      } else {
        // iOS uses Alert for mock notifications
        Alert.alert(
          `${NOTIFICATION_EMOJIS[notification.type]} ${notification.title}`,
          notification.message,
          notification.actions?.map((action) => ({
            text: action.label,
            style: action.action === "primary" ? "default" : "cancel",
            onPress: action.onPress,
          })) || [{ text: "OK" }],
        );
      }
    },
    [],
  );

  const showNotification = useCallback(
    (notificationData: Omit<NotificationData, "id" | "timestamp">) => {
      const id = generateId();
      const notification: NotificationData = {
        ...notificationData,
        id,
        timestamp: new Date(),
        autoHide: notificationData.autoHide ?? true,
        duration:
          notificationData.duration ??
          NOTIFICATION_DURATIONS[notificationData.type],
      };

      // Update statistics
      notificationStats.current.totalShown++;
      notificationStats.current.byType[notification.type]++;

      // Track display start time
      displayTimes.current.set(id, Date.now());

      // Add to state
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]); // Keep max 10

      // Show native notification
      showNativeNotification(notification);

      // Auto-hide if enabled
      if (notification.autoHide && notification.duration) {
        const timeoutId = setTimeout(() => {
          hideNotification(id);
        }, notification.duration);

        timeoutRefs.current.set(id, timeoutId);
      }

      console.log(`📢 Notification shown [${notification.type}]:`, {
        title: notification.title,
        message: notification.message,
        id,
        metadata: notification.metadata,
      });
    },
    [generateId, showNativeNotification],
  );

  const hideNotification = useCallback((id: string) => {
    // Track display time
    const startTime = displayTimes.current.get(id);
    if (startTime) {
      const displayTime = Date.now() - startTime;
      console.log(`📢 Notification displayed for ${displayTime}ms: ${id}`);
      displayTimes.current.delete(id);
    }

    // Clear timeout
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }

    // Remove from state
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
    displayTimes.current.clear();

    // Clear notifications
    setNotifications([]);
    console.log("📢 All notifications cleared");
  }, []);

  // Booking-specific notifications
  const notifyBookingRequest = useCallback(
    (artistName: string, bookingId: string) => {
      showNotification({
        type: "info",
        title: "予約リクエスト送信完了",
        message: `${artistName} への予約リクエストを送信しました`,
        metadata: { type: "booking_request", artistName, bookingId },
        actions: [
          {
            label: "チャットを開く",
            action: "primary",
            onPress: () => {
              console.log(`📱 Navigate to chat for booking: ${bookingId}`);
              // Navigation logic would go here
            },
          },
        ],
      });
    },
    [showNotification],
  );

  const notifyBookingApproved = useCallback(
    (artistName: string, date: Date) => {
      showNotification({
        type: "success",
        title: "予約承認されました！",
        message: `${artistName} が ${date.toLocaleDateString("ja-JP")} の予約を承認しました`,
        metadata: { type: "booking_approved", artistName, date },
        duration: 5000,
      });
    },
    [showNotification],
  );

  const notifyBookingChanged = useCallback(
    (artistName: string, newDate: Date) => {
      showNotification({
        type: "warning",
        title: "予約日程変更",
        message: `${artistName} が予約日程を ${newDate.toLocaleDateString("ja-JP")} に変更しました`,
        metadata: { type: "booking_changed", artistName, newDate },
        actions: [
          {
            label: "確認する",
            action: "primary",
            onPress: () => {
              console.log("📱 Navigate to booking confirmation");
            },
          },
          {
            label: "後で",
            action: "secondary",
            onPress: () => {
              console.log("📱 Defer booking confirmation");
            },
          },
        ],
      });
    },
    [showNotification],
  );

  const notifyReviewPrompt = useCallback(
    (artistName: string, bookingId: string) => {
      showNotification({
        type: "info",
        title: "レビューをお願いします",
        message: `${artistName} の施術はいかがでしたか？他のユーザーのためにレビューをお願いします`,
        metadata: { type: "review_prompt", artistName, bookingId },
        autoHide: false, // Don't auto-hide review prompts
        actions: [
          {
            label: "レビューを書く",
            action: "primary",
            onPress: () => {
              console.log(
                `📱 Navigate to review form for booking: ${bookingId}`,
              );
            },
          },
          {
            label: "後で",
            action: "secondary",
            onPress: () => {
              console.log("📱 Defer review writing");
              // Schedule reminder for later
            },
          },
        ],
      });
    },
    [showNotification],
  );

  // Settings with optimistic updates and rollback
  const notifySettingsToggle = useCallback(
    (setting: string, newValue: boolean, rollbackFn?: () => void) => {
      showNotification({
        type: "success",
        title: "設定を更新しました",
        message: `${setting}: ${newValue ? "オン" : "オフ"}`,
        metadata: { type: "settings_toggle", setting, newValue },
        duration: 2000,
      });

      // Simulate potential failure and rollback
      if (Math.random() < 0.1 && rollbackFn) {
        // 10% chance of failure
        setTimeout(() => {
          rollbackFn();
          showNotification({
            type: "error",
            title: "設定更新に失敗",
            message: `${setting}の設定を元に戻しました`,
            metadata: { type: "settings_rollback", setting },
          });
        }, 3000);
      }
    },
    [showNotification],
  );

  // System notifications
  const notifySystemError = useCallback(
    (error: string, context?: string) => {
      showNotification({
        type: "error",
        title: "システムエラー",
        message: error,
        metadata: { type: "system_error", error, context },
        duration: 8000, // Longer duration for errors
        actions: [
          {
            label: "再試行",
            action: "primary",
            onPress: () => {
              console.log("🔄 User requested retry after system error");
            },
          },
        ],
      });
    },
    [showNotification],
  );

  const notifyNetworkStatus = useCallback(
    (isOnline: boolean) => {
      if (!isOnline) {
        showNotification({
          type: "warning",
          title: "ネットワーク接続なし",
          message: "インターネット接続を確認してください",
          metadata: { type: "network_offline" },
          autoHide: false,
        });
      } else {
        // Clear any existing offline notifications
        setNotifications((prev) =>
          prev.filter((n) => n.metadata?.type !== "network_offline"),
        );

        showNotification({
          type: "success",
          title: "ネットワーク接続復旧",
          message: "インターネットに再接続しました",
          metadata: { type: "network_online" },
          duration: 2000,
        });
      }
    },
    [showNotification],
  );

  // Analytics
  const getNotificationStats = useCallback(() => {
    const displayTimes = Array.from(displayTimes.current.values());
    const averageDisplayTime =
      displayTimes.length > 0
        ? displayTimes.reduce((sum, time) => sum + time, 0) /
          displayTimes.length
        : 0;

    return {
      ...notificationStats.current,
      averageDisplayTime,
    };
  }, []);

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
    notifyBookingRequest,
    notifyBookingApproved,
    notifyBookingChanged,
    notifyReviewPrompt,
    notifySettingsToggle,
    notifySystemError,
    notifyNetworkStatus,
    getNotificationStats,
  };
};
