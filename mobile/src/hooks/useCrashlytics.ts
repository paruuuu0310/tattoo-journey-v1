import { useEffect, useCallback, useContext } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import CrashlyticsService from "../services/CrashlyticsService";
import { useAuth } from "../contexts/AuthContext";

export interface CrashlyticsHookOptions {
  screenName?: string;
  enableUserTracking?: boolean;
  enableScreenTracking?: boolean;
  enableActionTracking?: boolean;
}

/**
 * Firebase Crashlytics統合カスタムフック
 * 画面レベルでのクラッシュレポート機能を提供
 */
export const useCrashlytics = (options: CrashlyticsHookOptions = {}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();

  const {
    screenName = route.name,
    enableUserTracking = true,
    enableScreenTracking = true,
    enableActionTracking = true,
  } = options;

  const crashlyticsService = CrashlyticsService.getInstance();

  // ユーザー情報の設定
  useEffect(() => {
    if (enableUserTracking && userProfile) {
      crashlyticsService.setUserInfo({
        userId: userProfile.uid,
        userType: userProfile.user_type,
        email: userProfile.email,
        displayName: userProfile.display_name,
        appVersion: "2.0.0",
        platform: "mobile",
      });
    }
  }, [userProfile, enableUserTracking]);

  // 画面遷移の追跡
  useEffect(() => {
    if (enableScreenTracking && screenName) {
      crashlyticsService.logMessage(`Screen viewed: ${screenName}`, "info");
      crashlyticsService.logUserAction(screenName, "screen_view");
    }
  }, [screenName, enableScreenTracking]);

  // エラー報告メソッド
  const reportError = useCallback(
    async (
      error: Error,
      fatal: boolean = false,
      context?: Record<string, any>,
    ) => {
      try {
        // 画面情報を追加
        const errorContext = {
          current_screen: screenName,
          ...context,
        };

        // 属性として設定
        await crashlyticsService.recordCustomError({
          errorType: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          screen: screenName,
          additionalData: errorContext,
        });

        if (fatal) {
          await crashlyticsService.recordError(error, true);
        }
      } catch (reportingError) {
        console.error("Failed to report error:", reportingError);
      }
    },
    [screenName, crashlyticsService],
  );

  // カスタムエラー報告
  const reportCustomError = useCallback(
    async (
      errorType: string,
      errorMessage: string,
      context?: Record<string, any>,
    ) => {
      try {
        await crashlyticsService.recordCustomError({
          errorType,
          errorMessage,
          screen: screenName,
          additionalData: context,
        });
      } catch (error) {
        console.error("Failed to report custom error:", error);
      }
    },
    [screenName, crashlyticsService],
  );

  // ユーザーアクションの追跡
  const trackUserAction = useCallback(
    (action: string, additionalData?: Record<string, any>) => {
      if (enableActionTracking) {
        crashlyticsService.logUserAction(screenName, action, additionalData);
      }
    },
    [screenName, enableActionTracking, crashlyticsService],
  );

  // ログメッセージ
  const logMessage = useCallback(
    (
      message: string,
      level: "debug" | "info" | "warning" | "error" = "info",
    ) => {
      crashlyticsService.logMessage(`[${screenName}] ${message}`, level);
    },
    [screenName, crashlyticsService],
  );

  // 非同期処理のエラーをキャッチするヘルパー
  const safeAsyncCall = useCallback(
    async <T>(
      asyncFunction: () => Promise<T>,
      errorContext?: string,
    ): Promise<T | null> => {
      try {
        return await asyncFunction();
      } catch (error) {
        const contextMessage = errorContext ? ` (${errorContext})` : "";
        await reportError(
          error instanceof Error ? error : new Error(String(error)),
          false,
          { context: errorContext || "async_operation" },
        );
        logMessage(
          `Async operation failed${contextMessage}: ${error}`,
          "error",
        );
        return null;
      }
    },
    [reportError, logMessage],
  );

  return {
    reportError,
    reportCustomError,
    trackUserAction,
    logMessage,
    safeAsyncCall,
    crashlyticsService,
  };
};

/**
 * 特定のビジネスロジック用のCrashlyticsフック
 */
export const useTattooJourneyCrashlytics = (screenName: string) => {
  const { reportCustomError, trackUserAction, logMessage, safeAsyncCall } =
    useCrashlytics({ screenName });

  // 予約関連エラーの報告
  const reportBookingError = useCallback(
    async (
      errorType: "creation" | "update" | "cancellation",
      bookingId: string,
      error: Error,
      additionalData?: Record<string, any>,
    ) => {
      await reportCustomError(
        "BookingError",
        `Booking ${errorType} failed: ${error.message}`,
        {
          booking_id: bookingId,
          booking_error_type: errorType,
          error_name: error.name,
          error_category: "booking",
          ...additionalData,
        },
      );
    },
    [reportCustomError],
  );

  // AIマッチングエラーの報告
  const reportMatchingError = useCallback(
    async (
      errorType: "image_analysis" | "algorithm" | "recommendation",
      error: Error,
      additionalData?: Record<string, any>,
    ) => {
      await reportCustomError(
        "MatchingError",
        `AI matching ${errorType} failed: ${error.message}`,
        {
          matching_error_type: errorType,
          error_name: error.name,
          error_category: "ai_matching",
          ...additionalData,
        },
      );
    },
    [reportCustomError],
  );

  // ネットワークエラーの報告
  const reportNetworkError = useCallback(
    async (
      endpoint: string,
      method: string,
      statusCode: number,
      error: Error,
      requestData?: any,
    ) => {
      await reportCustomError(
        "NetworkError",
        `${method} ${endpoint} failed: ${error.message}`,
        {
          endpoint,
          method,
          status_code: statusCode,
          error_name: error.name,
          request_data: requestData
            ? JSON.stringify(requestData).substring(0, 200)
            : "",
          error_category: "network",
        },
      );
    },
    [reportCustomError],
  );

  // UI操作の追跡
  const trackUiInteraction = useCallback(
    (
      component: string,
      interaction: string,
      additionalData?: Record<string, any>,
    ) => {
      trackUserAction(`${component}_${interaction}`, {
        component,
        interaction_type: interaction,
        ...additionalData,
      });
    },
    [trackUserAction],
  );

  // フォーム送信の追跡
  const trackFormSubmission = useCallback(
    (
      formName: string,
      success: boolean,
      validationErrors?: string[],
      additionalData?: Record<string, any>,
    ) => {
      trackUserAction(`form_submit_${formName}`, {
        form_name: formName,
        success,
        validation_errors: validationErrors?.join(", ") || "",
        field_count: additionalData ? Object.keys(additionalData).length : 0,
        ...additionalData,
      });

      if (!success && validationErrors && validationErrors.length > 0) {
        logMessage(
          `Form validation failed for ${formName}: ${validationErrors.join(", ")}`,
          "warning",
        );
      }
    },
    [trackUserAction, logMessage],
  );

  // API呼び出しの監視
  const monitorApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      endpoint: string,
      method: string = "GET",
      requestData?: any,
    ): Promise<T | null> => {
      const startTime = Date.now();

      try {
        logMessage(`API call started: ${method} ${endpoint}`, "debug");
        const result = await apiCall();

        const duration = Date.now() - startTime;
        trackUserAction(`api_call_success`, {
          endpoint,
          method,
          duration,
          has_request_data: !!requestData,
        });

        logMessage(
          `API call completed: ${method} ${endpoint} (${duration}ms)`,
          "debug",
        );
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const apiError =
          error instanceof Error ? error : new Error(String(error));

        await reportNetworkError(endpoint, method, 0, apiError, requestData);

        trackUserAction(`api_call_failed`, {
          endpoint,
          method,
          duration,
          error_message: apiError.message,
        });

        logMessage(
          `API call failed: ${method} ${endpoint} - ${apiError.message}`,
          "error",
        );
        return null;
      }
    },
    [reportNetworkError, trackUserAction, logMessage],
  );

  // パフォーマンス問題の報告
  const reportPerformanceIssue = useCallback(
    async (
      issueType: "slow_render" | "memory_warning" | "timeout",
      duration?: number,
      additionalData?: Record<string, any>,
    ) => {
      await reportCustomError(
        "PerformanceIssue",
        `Performance issue detected: ${issueType}`,
        {
          issue_type: issueType,
          duration: duration || 0,
          error_category: "performance",
          ...additionalData,
        },
      );
    },
    [reportCustomError],
  );

  return {
    reportBookingError,
    reportMatchingError,
    reportNetworkError,
    trackUiInteraction,
    trackFormSubmission,
    monitorApiCall,
    reportPerformanceIssue,
    safeAsyncCall,
    trackUserAction,
    logMessage,
  };
};

/**
 * React Navigation統合用のCrashlyticsフック
 */
export const useNavigationCrashlytics = () => {
  const navigation = useNavigation();
  const crashlyticsService = CrashlyticsService.getInstance();

  // 画面遷移の監視
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (e) => {
      const currentRoute = e.data.state?.routes[e.data.state.index];
      if (currentRoute) {
        crashlyticsService.logMessage(
          `Navigation to: ${currentRoute.name}`,
          "debug",
        );
        crashlyticsService.logUserAction("navigation", "screen_change", {
          from_screen: "previous", // 実際の実装では前の画面を記録
          to_screen: currentRoute.name,
        });
      }
    });

    return unsubscribe;
  }, [navigation, crashlyticsService]);

  // ナビゲーションエラーの報告
  const reportNavigationError = useCallback(
    async (
      errorType: "navigation_failed" | "route_not_found" | "params_invalid",
      route: string,
      error: Error,
      params?: any,
    ) => {
      await crashlyticsService.recordCustomError({
        errorType: "NavigationError",
        errorMessage: `Navigation ${errorType}: ${error.message}`,
        additionalData: {
          navigation_error_type: errorType,
          target_route: route,
          route_params: params ? JSON.stringify(params).substring(0, 200) : "",
          error_category: "navigation",
        },
      });
    },
    [crashlyticsService],
  );

  return {
    reportNavigationError,
  };
};

export default useCrashlytics;
