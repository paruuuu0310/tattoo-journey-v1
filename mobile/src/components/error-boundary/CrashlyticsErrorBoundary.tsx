import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import CrashlyticsService from "../../services/CrashlyticsService";
import { DesignTokens } from "../design-system/TattooDesignTokens";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Firebase Crashlytics統合エラー境界コンポーネント
 * アプリ全体またはスクリーン単位でエラーをキャッチし、Crashlyticsに報告
 */
export class CrashlyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生した時にstateを更新してフォールバックUIをレンダリング
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "CrashlyticsErrorBoundary caught an error:",
      error,
      errorInfo,
    );

    // stateにエラー情報を保存
    this.setState({ errorInfo });

    // Crashlyticsにエラーを報告
    this.reportErrorToCrashlytics(error, errorInfo);

    // カスタムエラーハンドラーがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async reportErrorToCrashlytics(error: Error, errorInfo: ErrorInfo) {
    try {
      const crashlyticsService = await CrashlyticsService.getInstance();

      // 画面情報をログ
      if (this.props.screenName) {
        crashlyticsService.logMessage(
          `Error occurred in screen: ${this.props.screenName}`,
          "error",
        );
      }

      // コンポーネントスタック情報をログ
      crashlyticsService.logMessage(
        `Component stack: ${errorInfo.componentStack.substring(0, 500)}`,
        "error",
      );

      // カスタムエラーレポートとして送信
      await crashlyticsService.recordCustomError({
        errorType: "ComponentError",
        errorMessage: error.message,
        errorStack: error.stack,
        screen: this.props.screenName,
        additionalData: {
          component_stack: errorInfo.componentStack.substring(0, 500),
          error_boundary: true,
          error_name: error.name,
          error_category: "ui_component",
        },
      });

      // 実際のエラーオブジェクトも送信
      await crashlyticsService.recordError(error, true);
    } catch (reportingError) {
      console.error("Failed to report error to Crashlytics:", reportingError);
    }
  }

  private handleRetry = () => {
    // エラーをリセットして再試行
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReportIssue = async () => {
    try {
      // ユーザーから追加情報を収集して報告
      const crashlyticsService = await CrashlyticsService.getInstance();

      crashlyticsService.logMessage(
        "User reported issue via error boundary",
        "info",
      );
      crashlyticsService.logUserAction(
        this.props.screenName || "unknown",
        "report_issue_from_error_boundary",
      );

      // 実際のアプリでは、フィードバックフォームを表示したり
      // サポートページに誘導することができます
      // Issue reported by user
    } catch (error) {
      console.error("Failed to handle issue report:", error);
    }
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            {/* エラーアイコン */}
            <View style={styles.iconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>

            {/* エラータイトル */}
            <Text style={styles.title}>申し訳ございません</Text>
            <Text style={styles.subtitle}>予期しないエラーが発生しました</Text>

            {/* エラー詳細 (デバッグモードのみ) */}
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>
                  エラー詳細 (開発用):
                </Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorDetailsText}>
                    コンポーネント:{" "}
                    {this.state.errorInfo.componentStack.split("\n")[1]?.trim()}
                  </Text>
                )}
              </View>
            )}

            {/* アクションボタン */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>再試行</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.reportButton]}
                onPress={this.handleReportIssue}
                activeOpacity={0.8}
              >
                <Text style={styles.reportButtonText}>問題を報告</Text>
              </TouchableOpacity>
            </View>

            {/* 説明文 */}
            <Text style={styles.description}>
              このエラーは自動的に開発チームに報告されます。{"\n"}
              アプリを再起動するか、しばらく時間をおいてお試しください。
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: 24,
    alignItems: "center",
    maxWidth: 350,
    width: "100%",
    shadowColor: DesignTokens.colors.primary[500],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  errorDetails: {
    backgroundColor: DesignTokens.colors.dark.elevated,
    borderRadius: DesignTokens.radius.md,
    padding: 12,
    marginBottom: 20,
    width: "100%",
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: DesignTokens.colors.error,
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 10,
    color: DesignTokens.colors.dark.text.secondary,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: DesignTokens.radius.md,
    minWidth: 100,
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: DesignTokens.colors.primary[500],
  },
  retryButtonText: {
    color: DesignTokens.colors.dark.text.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  reportButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DesignTokens.colors.secondary[500],
  },
  reportButtonText: {
    color: DesignTokens.colors.secondary[500],
    fontSize: 14,
    fontWeight: "bold",
  },
  description: {
    fontSize: 12,
    color: DesignTokens.colors.dark.text.tertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});

/**
 * React Native画面用のエラー境界HOC
 */
export const withCrashlyticsErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName?: string,
  customFallback?: ReactNode,
) => {
  const CrashlyticsWrappedComponent: React.FC<P> = (props) => {
    return (
      <CrashlyticsErrorBoundary
        screenName={screenName}
        fallback={customFallback}
      >
        <WrappedComponent {...props} />
      </CrashlyticsErrorBoundary>
    );
  };

  CrashlyticsWrappedComponent.displayName = `withCrashlyticsErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return CrashlyticsWrappedComponent;
};

/**
 * 最小限のフォールバックUI
 */
export const MinimalErrorFallback: React.FC<{
  onRetry?: () => void;
  message?: string;
}> = ({ onRetry, message }) => (
  <View style={styles.container}>
    <View style={[styles.errorCard, { padding: 20 }]}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={[styles.title, { fontSize: 16, marginBottom: 16 }]}>
        {message || "エラーが発生しました"}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default CrashlyticsErrorBoundary;
