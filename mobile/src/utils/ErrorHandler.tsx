import React, { createContext, useContext, useState, ReactNode } from "react";
import { Alert } from "react-native";
import { Toast } from "../components/ui";

export interface AppError {
  id: string;
  type: "network" | "validation" | "auth" | "permission" | "system" | "unknown";
  message: string;
  userMessage: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, any>;
  retryable?: boolean;
  criticalLevel: "low" | "medium" | "high" | "critical";
}

interface ErrorContextType {
  errors: AppError[];
  showError: (error: AppError) => void;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  retryOperation: (
    errorId: string,
    retryFn: () => Promise<void>,
  ) => Promise<void>;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [currentToastError, setCurrentToastError] = useState<AppError | null>(
    null,
  );

  const showError = (error: AppError) => {
    // Add error to list
    setErrors((prev) => [...prev, error]);

    // Show appropriate UI based on critical level
    switch (error.criticalLevel) {
      case "critical":
      case "high":
        // Show alert dialog for critical errors
        Alert.alert("エラーが発生しました", error.userMessage, [
          {
            text: "OK",
            onPress: () => clearError(error.id),
          },
          ...(error.retryable
            ? [
                {
                  text: "再試行",
                  onPress: () => {
                    // Placeholder for retry logic
                    clearError(error.id);
                  },
                },
              ]
            : []),
        ]);
        break;
      case "medium":
      case "low":
        // Show toast for non-critical errors
        setCurrentToastError(error);
        setToastVisible(true);

        // Auto-clear after 5 seconds
        setTimeout(() => {
          clearError(error.id);
          setToastVisible(false);
          setCurrentToastError(null);
        }, 5000);
        break;
    }

    // Log error for development/debugging
    if (__DEV__) {
      console.error("App Error:", {
        id: error.id,
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        context: error.context,
        originalError: error.originalError,
      });
    }
  };

  const clearError = (errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));

    if (currentToastError?.id === errorId) {
      setToastVisible(false);
      setCurrentToastError(null);
    }
  };

  const clearAllErrors = () => {
    setErrors([]);
    setToastVisible(false);
    setCurrentToastError(null);
  };

  const retryOperation = async (
    errorId: string,
    retryFn: () => Promise<void>,
  ) => {
    try {
      clearError(errorId);
      await retryFn();
    } catch (retryError) {
      const newError = createError({
        type: "system",
        message: "Retry operation failed",
        userMessage: "再試行に失敗しました",
        originalError: retryError as Error,
        criticalLevel: "medium",
      });
      showError(newError);
    }
  };

  return (
    <ErrorContext.Provider
      value={{
        errors,
        showError,
        clearError,
        clearAllErrors,
        retryOperation,
      }}
    >
      {children}

      {/* Toast for non-critical errors */}
      <Toast
        message={currentToastError?.userMessage || ""}
        visible={toastVisible}
        onHide={() => {
          setToastVisible(false);
          if (currentToastError) {
            clearError(currentToastError.id);
            setCurrentToastError(null);
          }
        }}
        type="error"
        position="top"
      />
    </ErrorContext.Provider>
  );
};

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorHandler must be used within ErrorProvider");
  }
  return context;
};

// Helper function to create standardized errors
export const createError = (params: {
  type: AppError["type"];
  message: string;
  userMessage: string;
  originalError?: Error;
  context?: Record<string, any>;
  retryable?: boolean;
  criticalLevel: AppError["criticalLevel"];
}): AppError => ({
  id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date(),
  ...params,
});

// Predefined error creators for common scenarios
export const ErrorCreators = {
  network: (message: string, originalError?: Error): AppError =>
    createError({
      type: "network",
      message: `Network error: ${message}`,
      userMessage: "ネットワークエラーが発生しました。接続を確認してください。",
      originalError,
      retryable: true,
      criticalLevel: "medium",
    }),

  validation: (field: string, message: string): AppError =>
    createError({
      type: "validation",
      message: `Validation error for ${field}: ${message}`,
      userMessage: message,
      retryable: false,
      criticalLevel: "low",
      context: { field },
    }),

  auth: (message: string): AppError =>
    createError({
      type: "auth",
      message: `Authentication error: ${message}`,
      userMessage: "認証エラーが発生しました。再度ログインしてください。",
      retryable: false,
      criticalLevel: "high",
    }),

  permission: (resource: string): AppError =>
    createError({
      type: "permission",
      message: `Permission denied for ${resource}`,
      userMessage: "この機能を利用する権限がありません。",
      retryable: false,
      criticalLevel: "medium",
      context: { resource },
    }),

  system: (message: string, originalError?: Error): AppError =>
    createError({
      type: "system",
      message: `System error: ${message}`,
      userMessage:
        "システムエラーが発生しました。しばらく待ってから再度お試しください。",
      originalError,
      retryable: true,
      criticalLevel: "high",
    }),

  unknown: (originalError: Error): AppError =>
    createError({
      type: "unknown",
      message: `Unknown error: ${originalError.message}`,
      userMessage: "予期しないエラーが発生しました。",
      originalError,
      retryable: true,
      criticalLevel: "medium",
    }),
};

// Global error boundary for unhandled errors
export class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error("Error Boundary caught an error:", {
        error,
        errorInfo,
      });
    }

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: "#1a1a1a",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2
              style={{
                color: "#ff6b6b",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              アプリケーションエラー
            </h2>
            <p
              style={{
                color: "#cccccc",
                fontSize: 16,
                marginBottom: 16,
                lineHeight: "24px",
              }}
            >
              予期しないエラーが発生しました。{"\n"}
              アプリを再起動してください。
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#ff6b6b",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              アプリを再起動
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async operations with error handling
export const useAsyncOperation = () => {
  const { showError } = useErrorHandler();
  const [loading, setLoading] = useState(false);

  const executeAsync = async <T,>(
    operation: () => Promise<T>,
    options?: {
      errorType?: AppError["type"];
      customErrorMessage?: string;
      showLoadingState?: boolean;
    },
  ): Promise<T | null> => {
    try {
      if (options?.showLoadingState !== false) {
        setLoading(true);
      }

      const result = await operation();
      return result;
    } catch (error) {
      const appError = createError({
        type: options?.errorType || "system",
        message: error instanceof Error ? error.message : "Unknown error",
        userMessage: options?.customErrorMessage || "エラーが発生しました",
        originalError: error instanceof Error ? error : undefined,
        retryable: true,
        criticalLevel: "medium",
      });

      showError(appError);
      return null;
    } finally {
      if (options?.showLoadingState !== false) {
        setLoading(false);
      }
    }
  };

  return { executeAsync, loading };
};

export default ErrorHandler;
