import crashlytics from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";

export interface CrashReport {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  userId?: string;
  screen?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

export interface UserInfo {
  userId: string;
  userType: "customer" | "artist" | "admin";
  email?: string;
  displayName?: string;
  appVersion: string;
  platform: string;
}

export class CrashlyticsService {
  private static instance: CrashlyticsService;
  private isInitialized: boolean = false;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): CrashlyticsService {
    if (!CrashlyticsService.instance) {
      CrashlyticsService.instance = new CrashlyticsService();
    }
    return CrashlyticsService.instance;
  }

  /**
   * Crashlytics サービスの初期化
   */
  async initialize(userId?: string): Promise<void> {
    try {
      // Initializing Firebase Crashlytics

      // Crashlyticsの有効化
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      // ユーザーIDの設定
      if (userId) {
        await this.setUserId(userId);
      }

      // アプリの基本情報を設定
      await this.setDefaultAttributes();

      this.isInitialized = true;
      // Firebase Crashlytics initialized successfully

      // 初期化完了をログ
      this.logMessage("Crashlytics initialized", "info");
    } catch (error) {
      console.error("Error initializing Firebase Crashlytics:", error);
      throw error;
    }
  }

  /**
   * ユーザーIDの設定
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await crashlytics().setUserId(userId);
      this.userId = userId;
      // Crashlytics User ID set
    } catch (error) {
      console.error("Error setting Crashlytics User ID:", error);
    }
  }

  /**
   * ユーザー情報の設定
   */
  async setUserInfo(userInfo: UserInfo): Promise<void> {
    try {
      await crashlytics().setUserId(userInfo.userId);

      // ユーザー属性の設定
      await crashlytics().setAttributes({
        user_type: userInfo.userType,
        email: userInfo.email || "",
        display_name: userInfo.displayName || "",
        app_version: userInfo.appVersion,
        platform: userInfo.platform,
      });

      this.userId = userInfo.userId;
      // User info set for Crashlytics
    } catch (error) {
      console.error("Error setting user info:", error);
    }
  }

  /**
   * デフォルト属性の設定
   */
  private async setDefaultAttributes(): Promise<void> {
    try {
      await crashlytics().setAttributes({
        platform: Platform.OS,
        app_version: "2.0.0", // 実際のバージョンを設定
        build_number: "1", // 実際のビルド番号を設定
        environment: __DEV__ ? "development" : "production",
      });
    } catch (error) {
      console.error("Error setting default attributes:", error);
    }
  }

  // === エラー報告メソッド ===

  /**
   * キャッチされたエラーの報告
   */
  async recordError(error: Error, fatal: boolean = false): Promise<void> {
    try {
      if (fatal) {
        crashlytics().recordError(error);
      } else {
        crashlytics().recordError(error);
      }

      // Error recorded to Crashlytics
    } catch (recordingError) {
      console.error("Error recording to Crashlytics:", recordingError);
    }
  }

  /**
   * カスタムエラーの報告
   */
  async recordCustomError(crashReport: CrashReport): Promise<void> {
    try {
      // カスタム属性の設定
      if (crashReport.screen) {
        await crashlytics().setAttribute("current_screen", crashReport.screen);
      }
      if (crashReport.action) {
        await crashlytics().setAttribute("last_action", crashReport.action);
      }
      if (crashReport.userId) {
        await crashlytics().setUserId(crashReport.userId);
      }

      // 追加データがある場合は属性として設定
      if (crashReport.additionalData) {
        for (const [key, value] of Object.entries(crashReport.additionalData)) {
          if (value !== undefined && value !== null) {
            await crashlytics().setAttribute(key, String(value));
          }
        }
      }

      // エラーオブジェクトの作成と報告
      const error = new Error(crashReport.errorMessage);
      error.name = crashReport.errorType;
      if (crashReport.errorStack) {
        error.stack = crashReport.errorStack;
      }

      await crashlytics().recordError(error);

      // Custom error recorded to Crashlytics
    } catch (error) {
      console.error("Error recording custom error:", error);
    }
  }

  /**
   * 致命的でないエラーの報告
   */
  async recordNonFatalError(
    errorType: string,
    errorMessage: string,
    errorStack?: string,
    context?: Record<string, any>,
  ): Promise<void> {
    try {
      const crashReport: CrashReport = {
        errorType,
        errorMessage,
        errorStack,
        userId: this.userId || undefined,
        additionalData: context,
      };

      await this.recordCustomError(crashReport);
    } catch (error) {
      console.error("Error recording non-fatal error:", error);
    }
  }

  // === 特定のエラータイプ用のヘルパーメソッド ===

  /**
   * ネットワークエラーの報告
   */
  async recordNetworkError(
    url: string,
    method: string,
    statusCode: number,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.recordCustomError({
        errorType: "NetworkError",
        errorMessage: `${method} ${url} - ${statusCode}: ${errorMessage}`,
        additionalData: {
          url,
          method,
          status_code: statusCode,
          error_category: "network",
        },
      });
    } catch (error) {
      console.error("Error recording network error:", error);
    }
  }

  /**
   * API エラーの報告
   */
  async recordApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    errorResponse: any,
    requestData?: any,
  ): Promise<void> {
    try {
      await this.recordCustomError({
        errorType: "ApiError",
        errorMessage: `API Error: ${method} ${endpoint} - ${statusCode}`,
        additionalData: {
          endpoint,
          method,
          status_code: statusCode,
          error_response: JSON.stringify(errorResponse).substring(0, 500),
          request_data: requestData
            ? JSON.stringify(requestData).substring(0, 300)
            : "",
          error_category: "api",
        },
      });
    } catch (error) {
      console.error("Error recording API error:", error);
    }
  }

  /**
   * データベースエラーの報告
   */
  async recordDatabaseError(
    operation: string,
    collection: string,
    errorMessage: string,
    query?: any,
  ): Promise<void> {
    try {
      await this.recordCustomError({
        errorType: "DatabaseError",
        errorMessage: `DB Error: ${operation} on ${collection} - ${errorMessage}`,
        additionalData: {
          operation,
          collection,
          query: query ? JSON.stringify(query).substring(0, 200) : "",
          error_category: "database",
        },
      });
    } catch (error) {
      console.error("Error recording database error:", error);
    }
  }

  /**
   * 認証エラーの報告
   */
  async recordAuthError(
    authMethod: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.recordCustomError({
        errorType: "AuthError",
        errorMessage: `Auth Error: ${authMethod} - ${errorCode}: ${errorMessage}`,
        additionalData: {
          auth_method: authMethod,
          error_code: errorCode,
          error_category: "authentication",
        },
      });
    } catch (error) {
      console.error("Error recording auth error:", error);
    }
  }

  /**
   * UI/UXエラーの報告
   */
  async recordUiError(
    screen: string,
    component: string,
    errorType: string,
    errorMessage: string,
    userAction?: string,
  ): Promise<void> {
    try {
      await this.recordCustomError({
        errorType: "UiError",
        errorMessage: `UI Error: ${screen}/${component} - ${errorMessage}`,
        screen,
        action: userAction,
        additionalData: {
          component,
          ui_error_type: errorType,
          error_category: "ui",
        },
      });
    } catch (error) {
      console.error("Error recording UI error:", error);
    }
  }

  // === ログとブレッドクラム ===

  /**
   * カスタムログの記録
   */
  logMessage(
    message: string,
    level: "debug" | "info" | "warning" | "error" = "info",
  ): void {
    try {
      crashlytics().log(`[${level.toUpperCase()}] ${message}`);

      // デバッグモードではコンソールにも出力
      if (__DEV__) {
        // Crashlytics Log
      }
    } catch (error) {
      console.error("Error logging message:", error);
    }
  }

  /**
   * ユーザーアクションのブレッドクラム
   */
  logUserAction(
    screen: string,
    action: string,
    additionalData?: Record<string, any>,
  ): void {
    try {
      const breadcrumb = {
        screen,
        action,
        timestamp: new Date().toISOString(),
        ...additionalData,
      };

      crashlytics().log(`User Action: ${screen} - ${action}`);

      // 追加データがある場合は属性として設定
      if (additionalData) {
        crashlytics().setAttributes({
          last_screen: screen,
          last_action: action,
        });
      }
    } catch (error) {
      console.error("Error logging user action:", error);
    }
  }

  /**
   * アプリの状態変化をログ
   */
  logAppStateChange(
    previousState: string,
    currentState: string,
    additionalInfo?: Record<string, any>,
  ): void {
    try {
      const message = `App State: ${previousState} -> ${currentState}`;
      this.logMessage(message, "info");

      if (additionalInfo) {
        crashlytics().setAttributes(additionalInfo);
      }
    } catch (error) {
      console.error("Error logging app state change:", error);
    }
  }

  // === パフォーマンス関連 ===

  /**
   * パフォーマンス問題の報告
   */
  async recordPerformanceIssue(
    issueType: "slow_render" | "memory_warning" | "crash_on_launch" | "timeout",
    duration?: number,
    memoryUsage?: number,
    additionalData?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.recordCustomError({
        errorType: "PerformanceIssue",
        errorMessage: `Performance Issue: ${issueType}`,
        additionalData: {
          issue_type: issueType,
          duration: duration || 0,
          memory_usage: memoryUsage || 0,
          error_category: "performance",
          ...additionalData,
        },
      });
    } catch (error) {
      console.error("Error recording performance issue:", error);
    }
  }

  // === 開発・デバッグ用メソッド ===

  /**
   * テストクラッシュの発生（開発用）
   */
  testCrash(): void {
    if (__DEV__) {
      // Sending test crash to Crashlytics
      crashlytics().crash();
    } else {
      console.warn("Test crash is only available in development mode");
    }
  }

  /**
   * Crashlytics が有効かどうかを確認
   */
  isCrashlyticsEnabled(): boolean {
    return this.isInitialized;
  }

  /**
   * Crashlytics の無効化（GDPR対応等）
   */
  async disableCrashlytics(): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(false);
      // Firebase Crashlytics disabled
    } catch (error) {
      console.error("Error disabling Crashlytics:", error);
    }
  }

  /**
   * Crashlytics の有効化
   */
  async enableCrashlytics(): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(true);
      // Firebase Crashlytics enabled
    } catch (error) {
      console.error("Error enabling Crashlytics:", error);
    }
  }

  /**
   * 未送信のレポート確認
   */
  async checkForUnsentReports(): Promise<boolean> {
    try {
      const hasUnsentReports = await crashlytics().checkForUnsentReports();
      // Unsent crash reports status checked
      return hasUnsentReports;
    } catch (error) {
      console.error("Error checking for unsent reports:", error);
      return false;
    }
  }

  /**
   * 未送信レポートの削除
   */
  async deleteUnsentReports(): Promise<void> {
    try {
      await crashlytics().deleteUnsentReports();
      // Deleted unsent crash reports
    } catch (error) {
      console.error("Error deleting unsent reports:", error);
    }
  }

  /**
   * 未送信レポートの送信
   */
  async sendUnsentReports(): Promise<void> {
    try {
      await crashlytics().sendUnsentReports();
      // Sent unsent crash reports
    } catch (error) {
      console.error("Error sending unsent reports:", error);
    }
  }
}

// アプリ固有のクラッシュレポートヘルパー
export const TattooJourneyErrorReporting = {
  // 予約関連エラー
  reportBookingError: async (
    errorType:
      | "booking_creation_failed"
      | "booking_update_failed"
      | "booking_cancellation_failed",
    bookingId: string,
    errorMessage: string,
    additionalData?: Record<string, any>,
  ) => {
    await CrashlyticsService.getInstance().recordCustomError({
      errorType: "BookingError",
      errorMessage: `${errorType}: ${errorMessage}`,
      additionalData: {
        booking_id: bookingId,
        booking_error_type: errorType,
        error_category: "booking",
        ...additionalData,
      },
    });
  },

  // AI マッチングエラー
  reportMatchingError: async (
    errorType:
      | "image_analysis_failed"
      | "matching_algorithm_failed"
      | "recommendation_failed",
    imageId?: string,
    errorMessage: string,
    additionalData?: Record<string, any>,
  ) => {
    await CrashlyticsService.getInstance().recordCustomError({
      errorType: "MatchingError",
      errorMessage: `${errorType}: ${errorMessage}`,
      additionalData: {
        image_id: imageId,
        matching_error_type: errorType,
        error_category: "ai_matching",
        ...additionalData,
      },
    });
  },

  // チャット関連エラー
  reportChatError: async (
    errorType:
      | "message_send_failed"
      | "message_receive_failed"
      | "chat_room_creation_failed",
    chatRoomId: string,
    errorMessage: string,
    additionalData?: Record<string, any>,
  ) => {
    await CrashlyticsService.getInstance().recordCustomError({
      errorType: "ChatError",
      errorMessage: `${errorType}: ${errorMessage}`,
      additionalData: {
        chat_room_id: chatRoomId,
        chat_error_type: errorType,
        error_category: "chat",
        ...additionalData,
      },
    });
  },

  // 支払い関連エラー（将来の機能用）
  reportPaymentError: async (
    errorType: "payment_processing_failed" | "payment_verification_failed",
    transactionId: string,
    errorMessage: string,
    additionalData?: Record<string, any>,
  ) => {
    await CrashlyticsService.getInstance().recordCustomError({
      errorType: "PaymentError",
      errorMessage: `${errorType}: ${errorMessage}`,
      additionalData: {
        transaction_id: transactionId,
        payment_error_type: errorType,
        error_category: "payment",
        ...additionalData,
      },
    });
  },

  // レビューシステムエラー
  reportReviewError: async (
    errorType:
      | "review_submission_failed"
      | "review_loading_failed"
      | "review_update_failed",
    reviewId: string,
    errorMessage: string,
    additionalData?: Record<string, any>,
  ) => {
    await CrashlyticsService.getInstance().recordCustomError({
      errorType: "ReviewError",
      errorMessage: `${errorType}: ${errorMessage}`,
      additionalData: {
        review_id: reviewId,
        review_error_type: errorType,
        error_category: "review",
        ...additionalData,
      },
    });
  },
};

export default CrashlyticsService.getInstance();
