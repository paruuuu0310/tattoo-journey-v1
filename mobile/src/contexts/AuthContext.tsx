import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { User as FirebaseUser } from "@react-native-firebase/auth";
import { auth, firestore } from "../config/firebase";
import { User, UserType } from "../types";
import { SecureLogger } from "../utils/SecureLogger";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  signUp: (
    email: string,
    password: string,
    userType: UserType,
    profile: any,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  retryProfileFetch: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ 競合状態対策: 現在処理中の操作を追跡
  const currentOperationRef = useRef<string | null>(null);
  const operationQueueRef = useRef<Array<() => Promise<void>>>([]);
  const isProcessingRef = useRef(false);

  // ✅ メモリリーク対策: アンマウント状態を追跡
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ 操作の順次実行を保証するサインアップ
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userType: UserType,
      profile: any,
    ) => {
      return new Promise<void>((resolve, reject) => {
        operationQueueRef.current.push(async () => {
          try {
            setError(null);
            setLoading(true);

            const userCredential = await auth().createUserWithEmailAndPassword(
              email,
              password,
            );
            const user = userCredential.user;

            // Firestoreにユーザープロフィールを作成
            const userProfile: User = {
              uid: user.uid,
              email: user.email!,
              displayName: profile.firstName + " " + profile.lastName,
              userType,
              createdAt: new Date(),
              updatedAt: new Date(),
              profile,
            };

            await firestore()
              .collection("users")
              .doc(user.uid)
              .set(userProfile);

            SecureLogger.info("User signed up successfully", undefined, {
              uid: user.uid,
              userType: userType,
            });

            resolve();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Sign up failed";
            setError(errorMessage);

            SecureLogger.error("Sign up error:", undefined, {
              error: error as Error,
              reportToService: true,
              includeTimestamp: true,
            });

            reject(error);
          } finally {
            if (isMountedRef.current) {
              setLoading(false);
            }
          }
        });

        processOperationQueue();
      });
    },
    [processOperationQueue],
  );

  // ✅ 操作の順次実行を保証するサインイン
  const signIn = useCallback(
    async (email: string, password: string) => {
      return new Promise<void>((resolve, reject) => {
        operationQueueRef.current.push(async () => {
          try {
            setError(null);
            setLoading(true);

            await auth().signInWithEmailAndPassword(email, password);

            SecureLogger.info("User signed in successfully", undefined, {
              email: email.split("@")[0] + "@***", // メールのマスキング
            });

            resolve();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Sign in failed";
            setError(errorMessage);

            SecureLogger.error("Sign in error:", undefined, {
              error: error as Error,
              reportToService: true,
              includeTimestamp: true,
            });

            reject(error);
          } finally {
            if (isMountedRef.current) {
              setLoading(false);
            }
          }
        });

        processOperationQueue();
      });
    },
    [processOperationQueue],
  );

  // ✅ サインアウトの即座実行（キューをクリア）
  const signOut = useCallback(async () => {
    try {
      // ✅ 進行中の操作をキャンセル
      currentOperationRef.current = null;
      operationQueueRef.current = [];

      setError(null);
      setLoading(true);

      await auth().signOut();

      setCurrentUser(null);
      setUserProfile(null);

      SecureLogger.info("User signed out successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      setError(errorMessage);

      SecureLogger.error("Sign out error:", undefined, {
        error: error as Error,
        reportToService: true,
        includeTimestamp: true,
      });

      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ プロフィール更新の順次実行
  const updateProfile = useCallback(
    async (profile: Partial<User>) => {
      if (!currentUser) {
        throw new Error("No user is currently signed in");
      }

      return new Promise<void>((resolve, reject) => {
        operationQueueRef.current.push(async () => {
          try {
            setError(null);

            const updatedProfile = {
              ...profile,
              updatedAt: new Date(),
            };

            await firestore()
              .collection("users")
              .doc(currentUser.uid)
              .update(updatedProfile);

            // ✅ ローカル状態を更新（競合状態チェック付き）
            if (userProfile && isMountedRef.current) {
              setUserProfile({ ...userProfile, ...updatedProfile });
            }

            SecureLogger.info("Profile updated successfully", undefined, {
              uid: currentUser.uid,
              fieldsUpdated: Object.keys(profile),
            });

            resolve();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Profile update failed";
            setError(errorMessage);

            SecureLogger.error("Update profile error:", undefined, {
              error: error as Error,
              reportToService: true,
              includeTimestamp: true,
            });

            reject(error);
          }
        });

        processOperationQueue();
      });
    },
    [currentUser, userProfile, processOperationQueue],
  );

  // ✅ 競合状態対策: 操作の順次処理
  const processOperationQueue = useCallback(async () => {
    if (isProcessingRef.current || operationQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      while (operationQueueRef.current.length > 0 && isMountedRef.current) {
        const operation = operationQueueRef.current.shift();
        if (operation) {
          await operation();
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // ✅ タイムアウトと再試行機能付きのプロフィール取得
  const fetchUserProfile = useCallback(
    async (uid: string, attempt: number = 1): Promise<void> => {
      const operationId = `fetchProfile_${uid}_${Date.now()}`;
      currentOperationRef.current = operationId;

      try {
        // タイムアウト付きのプロミス
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Profile fetch timeout")), 10000); // 10秒タイムアウト
        });

        const fetchPromise = firestore().collection("users").doc(uid).get();

        const userDoc = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as any;

        // ✅ 操作がキャンセルされたかチェック
        if (
          currentOperationRef.current !== operationId ||
          !isMountedRef.current
        ) {
          return; // キャンセルされた操作
        }

        if (userDoc.exists) {
          const userData = userDoc.data() as User;
          setUserProfile(userData);
          setError(null);
          setRetryCount(0);

          SecureLogger.info("User profile fetched successfully", undefined, {
            uid: uid,
            attempt: attempt,
          });
        } else {
          setUserProfile(null);
          setError("User profile not found");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        SecureLogger.error("Fetch user profile error:", undefined, {
          error: error as Error,
          attempt: attempt,
          uid: uid,
          reportToService: true,
          includeTimestamp: true,
        });

        // ✅ 再試行ロジック
        if (
          attempt < 3 &&
          isMountedRef.current &&
          (errorMessage.includes("network") || errorMessage.includes("timeout"))
        ) {
          setRetryCount(attempt);
          setError(`Network error (attempt ${attempt}/3). Retrying...`);

          // 指数バックオフで再試行
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          setTimeout(() => {
            if (
              isMountedRef.current &&
              currentOperationRef.current === operationId
            ) {
              fetchUserProfile(uid, attempt + 1);
            }
          }, delay);
        } else {
          // 最終的な失敗
          setError(errorMessage);
          setUserProfile(null);
          setRetryCount(attempt);
        }
      }
    },
    [],
  );

  // ✅ 認証状態の変化を監視（競合状態対策付き）
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      // ✅ 進行中の操作をキャンセル
      currentOperationRef.current = null;
      operationQueueRef.current = [];

      setCurrentUser(user);
      setError(null);
      setRetryCount(0);

      if (user && isMountedRef.current) {
        // ✅ 操作をキューに追加して順次処理
        operationQueueRef.current.push(async () => {
          await fetchUserProfile(user.uid);
        });

        // 非同期でキュー処理開始
        processOperationQueue();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      // ✅ クリーンアップ
      currentOperationRef.current = null;
      operationQueueRef.current = [];
    };
  }, [fetchUserProfile, processOperationQueue]);

  // ✅ 手動再試行機能
  const retryProfileFetch = useCallback(async () => {
    if (currentUser && isMountedRef.current) {
      setError(null);
      setRetryCount(0);
      await fetchUserProfile(currentUser.uid);
    }
  }, [currentUser, fetchUserProfile]);

  // ✅ エラークリア機能
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // ✅ ローディング状態の最適化
  useEffect(() => {
    if (
      !isProcessingRef.current &&
      operationQueueRef.current.length === 0 &&
      !loading
    ) {
      // すべての操作が完了したらローディングを終了
      setLoading(false);
    }
  }, [loading]);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    retryCount,
    signUp,
    signIn,
    signOut,
    updateProfile,
    retryProfileFetch,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
