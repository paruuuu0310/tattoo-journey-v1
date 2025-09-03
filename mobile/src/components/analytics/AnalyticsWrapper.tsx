import React, { useEffect, useRef } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AnalyticsService from "../../services/AnalyticsService";

interface AnalyticsWrapperProps {
  children: React.ReactNode;
  screenName: string;
  screenClass?: string;
  trackEngagement?: boolean;
}

/**
 * Analytics機能を自動的に追加するラッパーコンポーネント
 */
export const AnalyticsWrapper: React.FC<AnalyticsWrapperProps> = ({
  children,
  screenName,
  screenClass,
  trackEngagement = true,
}) => {
  const navigation = useNavigation();
  const focusTimeRef = useRef<number>(0);
  const engagementTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 画面フォーカス時の処理
  useFocusEffect(
    React.useCallback(() => {
      // 画面表示イベントをログ
      AnalyticsService.logScreenView(screenName, screenClass);

      // エンゲージメント時間の測定開始
      if (trackEngagement) {
        focusTimeRef.current = Date.now();
      }

      return () => {
        // 画面を離れる時の処理
        if (trackEngagement && focusTimeRef.current > 0) {
          const engagementTime = Date.now() - focusTimeRef.current;

          // 最小滞在時間（1秒）以上の場合のみログ
          if (engagementTime > 1000) {
            AnalyticsService.logCustomEvent("screen_engagement", {
              screen_name: screenName,
              engagement_time: Math.floor(engagementTime / 1000), // 秒単位
            });
          }
        }
      };
    }, [screenName, screenClass, trackEngagement]),
  );

  return <>{children}</>;
};

/**
 * HOC (Higher-Order Component) version
 */
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  screenName: string,
  screenClass?: string,
) => {
  const AnalyticsEnhancedComponent: React.FC<P> = (props) => {
    return (
      <AnalyticsWrapper screenName={screenName} screenClass={screenClass}>
        <Component {...props} />
      </AnalyticsWrapper>
    );
  };

  AnalyticsEnhancedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;

  return AnalyticsEnhancedComponent;
};

/**
 * カスタムフック: 画面での操作をトラッキング
 */
export const useAnalyticsTracking = (screenName: string) => {
  const trackAction = (
    actionName: string,
    parameters?: Record<string, any>,
  ) => {
    AnalyticsService.logCustomEvent("user_action", {
      screen: screenName,
      action: actionName,
      ...parameters,
      timestamp: new Date().toISOString(),
    });
  };

  const trackError = (errorType: string, errorMessage: string) => {
    AnalyticsService.logError(errorType, errorMessage, screenName);
  };

  const trackFeatureUsage = (featureName: string, action: string) => {
    AnalyticsService.logCustomEvent("feature_usage", {
      screen: screenName,
      feature_name: featureName,
      action: action,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    trackAction,
    trackError,
    trackFeatureUsage,
  };
};

/**
 * ボタンクリック等のアクションをトラッキングするHOC
 */
interface TrackableButtonProps {
  onPress: () => void;
  actionName: string;
  screenName?: string;
  additionalParams?: Record<string, any>;
  children: React.ReactNode;
}

export const TrackableButton: React.FC<TrackableButtonProps> = ({
  onPress,
  actionName,
  screenName,
  additionalParams,
  children,
}) => {
  const handlePress = () => {
    // アクションをトラッキング
    AnalyticsService.logCustomEvent("button_clicked", {
      screen: screenName,
      action: actionName,
      ...additionalParams,
      timestamp: new Date().toISOString(),
    });

    // 元のonPressを実行
    onPress();
  };

  return React.cloneElement(
    children as React.ReactElement<any>,
    {
      onPress: handlePress,
    } as any,
  );
};

/**
 * フォーム送信をトラッキングするHOC
 */
interface TrackableFormProps {
  onSubmit: (data: any) => void;
  formName: string;
  screenName?: string;
  children: React.ReactNode;
}

export const TrackableForm: React.FC<TrackableFormProps> = ({
  onSubmit,
  formName,
  screenName,
  children,
}) => {
  const handleSubmit = (data: any) => {
    // フォーム送信をトラッキング
    AnalyticsService.logCustomEvent("form_submitted", {
      screen: screenName,
      form_name: formName,
      field_count: Object.keys(data).length,
      timestamp: new Date().toISOString(),
    });

    // 元のonSubmitを実行
    onSubmit(data);
  };

  return React.cloneElement(
    children as React.ReactElement<any>,
    {
      onSubmit: handleSubmit,
    } as any,
  );
};

/**
 * エラー境界でエラーをトラッキング
 */
interface AnalyticsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AnalyticsErrorBoundary extends React.Component<
  { children: React.ReactNode; screenName?: string },
  AnalyticsErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; screenName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AnalyticsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーをAnalyticsにログ
    AnalyticsService.logError(
      "component_error",
      error.message,
      this.props.screenName,
    );

    // 詳細なエラー情報もログ
    AnalyticsService.logCustomEvent("component_error_detail", {
      screen: this.props.screenName,
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // スタックトレースを制限
      component_stack: errorInfo.componentStack?.substring(0, 500) || "",
      timestamp: new Date().toISOString(),
    });

    console.error("AnalyticsErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            backgroundColor: "#ff6b6b",
            color: "white",
            textAlign: "center",
            borderRadius: 8,
          }}
        >
          <h2>エラーが発生しました</h2>
          <p>申し訳ございませんが、予期しないエラーが発生しました。</p>
          <p>アプリを再起動してお試しください。</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * パフォーマンス測定のためのHOC
 */
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
) => {
  const PerformanceTrackedComponent: React.FC<P> = (props) => {
    const renderStartTime = useRef<number>(Date.now());
    const [isLoaded, setIsLoaded] = React.useState(false);

    useEffect(() => {
      // コンポーネントの読み込み完了時間を測定
      const loadTime = Date.now() - renderStartTime.current;

      AnalyticsService.logCustomEvent("component_performance", {
        component_name: componentName,
        load_time: loadTime,
        timestamp: new Date().toISOString(),
      });

      setIsLoaded(true);
    }, []);

    return <Component {...props} />;
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;

  return PerformanceTrackedComponent;
};

export default {
  AnalyticsWrapper,
  withAnalytics,
  useAnalyticsTracking,
  TrackableButton,
  TrackableForm,
  AnalyticsErrorBoundary,
  withPerformanceTracking,
};
