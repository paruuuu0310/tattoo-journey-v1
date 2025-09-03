import { useState, useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuth } from "../contexts/AuthContext";
import { useNotificationsMock } from "./useNotificationsMock";
import telemetry from "../lib/telemetry";

type AuthProvider = "google" | "apple" | "email";
type AuthState = "idle" | "authenticating" | "authenticated" | "failed";

interface AuthFlowState {
  state: AuthState;
  provider?: AuthProvider;
  error?: string;
  isLoading: boolean;
  retryCount: number;
  lastAuthAttempt?: Date;
}

interface UseAuthFlow {
  authState: AuthFlowState;
  actions: {
    signInWithProvider: (
      provider: AuthProvider,
      credentials?: any,
    ) => Promise<void>;
    signOut: () => Promise<void>;
    retry: () => Promise<void>;
    clearError: () => void;
  };

  // Performance tracking
  performance: {
    authStartTime?: Date;
    homeTransitionTime?: Date;
    getAuthDuration: () => number;
    meetsThreeSecondTarget: () => boolean;
  };

  // Token management
  tokenManager: {
    refreshToken: () => Promise<string | null>;
    clearTokens: () => Promise<void>;
    isTokenValid: () => Promise<boolean>;
  };
}

const AUTH_STORAGE_KEY = "@tattoo_journey_auth";
const MAX_RETRY_ATTEMPTS = 3;
const THREE_SECOND_TARGET = 3000; // 3 seconds in milliseconds

export const useAuthFlow = (): UseAuthFlow => {
  const { currentUser, signIn, signUp, signOut: authSignOut } = useAuth();
  const { showNotification, notifySystemError } = useNotificationsMock();

  const [authState, setAuthState] = useState<AuthFlowState>({
    state: "idle",
    isLoading: false,
    retryCount: 0,
  });

  const authStartTimeRef = useRef<Date>();
  const homeTransitionTimeRef = useRef<Date>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "1234567890-abcdefgh.apps.googleusercontent.com", // Mock ID
      offlineAccess: true,
    });
  }, []);

  // Monitor authentication state changes
  useEffect(() => {
    if (currentUser) {
      setAuthState((prev) => ({
        ...prev,
        state: "authenticated",
        isLoading: false,
        error: undefined,
      }));

      // Mark home transition time for performance tracking
      homeTransitionTimeRef.current = new Date();

      // Track successful authentication
      telemetry.trackAuth("login", authState.provider || "unknown");

      // Check if we met the 3-second target
      const duration = getAuthDuration();
      if (duration > 0 && duration <= THREE_SECOND_TARGET) {
        console.log(`✅ Auth flow completed within target: ${duration}ms`);
      } else if (duration > THREE_SECOND_TARGET) {
        console.warn(`⚠️ Auth flow exceeded 3s target: ${duration}ms`);
        telemetry.track("performance_slow_load", {
          performanceMarkerId: "auth_flow",
          durationMs: duration,
        });
      }
    }
  }, [currentUser, authState.provider]);

  const updateAuthState = useCallback((updates: Partial<AuthFlowState>) => {
    if (!isMountedRef.current) return;

    setAuthState((prev) => ({
      ...prev,
      ...updates,
      lastAuthAttempt: new Date(),
    }));
  }, []);

  const signInWithProvider = useCallback(
    async (
      provider: AuthProvider,
      credentials?: { email?: string; password?: string },
    ) => {
      authStartTimeRef.current = new Date();
      homeTransitionTimeRef.current = undefined;

      updateAuthState({
        state: "authenticating",
        provider,
        isLoading: true,
        error: undefined,
      });

      try {
        telemetry.startPerformanceTimer("auth_flow");

        switch (provider) {
          case "google":
            await signInWithGoogle();
            break;
          case "apple":
            await signInWithApple();
            break;
          case "email":
            if (!credentials?.email || !credentials?.password) {
              throw new Error("Email and password required");
            }
            await signIn(credentials.email, credentials.password);
            break;
          default:
            throw new Error(`Unsupported auth provider: ${provider}`);
        }

        // Store successful auth info
        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            provider,
            lastLogin: new Date().toISOString(),
          }),
        );

        // Reset retry count on success
        updateAuthState({
          state: "authenticated",
          isLoading: false,
          retryCount: 0,
          error: undefined,
        });

        showNotification({
          type: "success",
          title: "ログイン成功",
          message: "ホーム画面に移動します...",
          duration: 2000,
        });
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error("Authentication failed:", error);

        updateAuthState({
          state: "failed",
          isLoading: false,
          error: errorMessage,
          retryCount: authState.retryCount + 1,
        });

        // Track authentication failure
        telemetry.trackError(error as Error, {
          errorType: "network",
          screenName: "auth",
          actionAttempted: `${provider}_signin`,
          additionalContext: {
            retryCount: authState.retryCount,
            provider,
          },
        });

        notifySystemError(errorMessage, "authentication");

        // Show retry option if under retry limit
        if (authState.retryCount < MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            showNotification({
              type: "warning",
              title: "認証に失敗しました",
              message:
                "もう一度お試しいただくか、しばらく時間をおいてから再試行してください",
              actions: [
                {
                  label: "再試行",
                  action: "primary",
                  onPress: () => retry(),
                },
              ],
            });
          }, 1000);
        }
      } finally {
        telemetry.endPerformanceTimer("auth_flow");
      }
    },
    [authState.retryCount, signIn, showNotification, notifySystemError],
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Mock implementation - in real app would use Firebase auth
      console.log("Google sign-in successful:", userInfo.user.email);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error: any) {
      if (error.code === "SIGN_IN_CANCELLED") {
        throw new Error("Google サインインがキャンセルされました");
      } else if (error.code === "IN_PROGRESS") {
        throw new Error("Google サインインが進行中です");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        throw new Error("Google Play Services が利用できません");
      } else {
        throw new Error("Google サインインに失敗しました");
      }
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    // Mock Apple Sign-In implementation
    console.log("Apple sign-in attempted");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // For now, simulate success
    console.log("Apple sign-in successful (mock)");
  }, []);

  const signOut = useCallback(async () => {
    updateAuthState({
      state: "idle",
      isLoading: true,
      provider: undefined,
      error: undefined,
    });

    try {
      await authSignOut();

      // Clear stored auth info
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);

      // Clear Google Sign-In
      if (authState.provider === "google") {
        await GoogleSignin.signOut();
      }

      telemetry.trackAuth("logout");

      updateAuthState({
        state: "idle",
        isLoading: false,
        retryCount: 0,
      });

      showNotification({
        type: "info",
        title: "ログアウトしました",
        message: "またのご利用をお待ちしております",
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      notifySystemError("ログアウトに失敗しました", "auth_signout");
    }
  }, [authSignOut, authState.provider, showNotification, notifySystemError]);

  const retry = useCallback(async () => {
    if (authState.retryCount >= MAX_RETRY_ATTEMPTS) {
      Alert.alert(
        "リトライ上限に達しました",
        "しばらく時間をおいてからもう一度お試しください。",
        [{ text: "OK" }],
      );
      return;
    }

    if (authState.provider) {
      await signInWithProvider(authState.provider);
    }
  }, [authState.retryCount, authState.provider, signInWithProvider]);

  const clearError = useCallback(() => {
    updateAuthState({
      error: undefined,
      state: authState.state === "failed" ? "idle" : authState.state,
    });
  }, [authState.state]);

  // Performance tracking
  const getAuthDuration = useCallback((): number => {
    if (!authStartTimeRef.current || !homeTransitionTimeRef.current) {
      return 0;
    }
    return (
      homeTransitionTimeRef.current.getTime() -
      authStartTimeRef.current.getTime()
    );
  }, []);

  const meetsThreeSecondTarget = useCallback((): boolean => {
    const duration = getAuthDuration();
    return duration > 0 && duration <= THREE_SECOND_TARGET;
  }, [getAuthDuration]);

  // Token management
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      // Mock token refresh - in real implementation would refresh Firebase token
      const mockToken = `mock_token_${Date.now()}`;
      console.log("Token refreshed:", mockToken.substring(0, 20) + "...");
      return mockToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  }, []);

  const clearTokens = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem("@tattoo_journey_tokens");
      console.log("Tokens cleared");
    } catch (error) {
      console.error("Failed to clear tokens:", error);
    }
  }, []);

  const isTokenValid = useCallback(async (): Promise<boolean> => {
    try {
      // Mock token validation
      const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!authData) return false;

      const parsed = JSON.parse(authData);
      const lastLogin = new Date(parsed.lastLogin);
      const now = new Date();
      const daysSinceLogin =
        (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

      // Consider token valid for 7 days
      return daysSinceLogin < 7;
    } catch {
      return false;
    }
  }, []);

  return {
    authState,
    actions: {
      signInWithProvider,
      signOut,
      retry,
      clearError,
    },
    performance: {
      authStartTime: authStartTimeRef.current,
      homeTransitionTime: homeTransitionTimeRef.current,
      getAuthDuration,
      meetsThreeSecondTarget,
    },
    tokenManager: {
      refreshToken,
      clearTokens,
      isTokenValid,
    },
  };
};

// Helper function to extract user-friendly error messages
function getErrorMessage(error: any): string {
  if (typeof error === "string") return error;

  if (error?.code) {
    switch (error.code) {
      case "auth/user-not-found":
        return "ユーザーが見つかりませんでした";
      case "auth/wrong-password":
        return "パスワードが間違っています";
      case "auth/email-already-in-use":
        return "このメールアドレスは既に使用されています";
      case "auth/weak-password":
        return "パスワードが弱すぎます";
      case "auth/network-request-failed":
        return "ネットワークエラーが発生しました";
      case "auth/too-many-requests":
        return "リクエストが多すぎます。しばらく時間をおいてから再試行してください";
      default:
        return error.message || "認証エラーが発生しました";
    }
  }

  return error?.message || "不明なエラーが発生しました";
}
