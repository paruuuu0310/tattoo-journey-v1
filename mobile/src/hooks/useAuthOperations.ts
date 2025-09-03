/**
 * Auth Operations Custom Hook - SEC-005
 * 認証操作の高度な管理とエラーハンドリング
 */

import { useCallback, useRef, useState } from "react";
import { SecureLogger } from "../utils/SecureLogger";

export interface AuthOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount: number;
}

export interface AuthOperationOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  priority?: "high" | "normal" | "low";
}

/**
 * ✅ 認証操作の優先度付きキュー管理
 */
export const useAuthOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const operationQueueRef = useRef<
    Array<{
      id: string;
      operation: () => Promise<any>;
      resolve: (value: any) => void;
      reject: (reason: any) => void;
      options: AuthOperationOptions;
      createdAt: number;
    }>
  >([]);

  /**
   * ✅ 操作を優先度順にソート
   */
  const sortOperationQueue = useCallback(() => {
    operationQueueRef.current.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.options.priority || "normal"];
      const bPriority = priorityOrder[b.options.priority || "normal"];

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // 高優先度が先
      }

      return a.createdAt - b.createdAt; // 同じ優先度なら先入先出
    });
  }, []);

  /**
   * ✅ キューの処理
   */
  const processQueue = useCallback(async () => {
    if (isProcessing || operationQueueRef.current.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      while (operationQueueRef.current.length > 0) {
        sortOperationQueue();
        const item = operationQueueRef.current.shift();

        if (!item) break;

        const { operation, resolve, reject, options } = item;

        try {
          const result = await executeWithRetry(operation, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, sortOperationQueue]);

  /**
   * ✅ タイムアウトと再試行付きの操作実行
   */
  const executeWithRetry = useCallback(
    async (
      operation: () => Promise<any>,
      options: AuthOperationOptions,
    ): Promise<any> => {
      const { timeout = 10000, retryCount = 3, retryDelay = 1000 } = options;

      let lastError: Error;

      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          // タイムアウト付きで操作実行
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Operation timeout")), timeout);
          });

          const result = await Promise.race([operation(), timeoutPromise]);

          SecureLogger.info("Auth operation succeeded", undefined, {
            attempt,
            timeout,
          });

          return result;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error("Unknown error");

          SecureLogger.warn("Auth operation failed", undefined, {
            attempt,
            maxRetries: retryCount,
            error: lastError.message,
          });

          // 最後の試行でなければ再試行
          if (attempt < retryCount) {
            const delay = retryDelay * Math.pow(2, attempt - 1); // 指数バックオフ
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // すべての再試行が失敗
      SecureLogger.error("Auth operation failed after all retries", undefined, {
        error: lastError!,
        totalAttempts: retryCount,
        reportToService: true,
      });

      throw lastError!;
    },
    [],
  );

  /**
   * ✅ 操作をキューに追加
   */
  const enqueueOperation = useCallback(
    <T>(
      operation: () => Promise<T>,
      options: AuthOperationOptions = {},
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        const operationId = `auth_op_${Date.now()}_${Math.random()}`;

        operationQueueRef.current.push({
          id: operationId,
          operation,
          resolve,
          reject,
          options,
          createdAt: Date.now(),
        });

        // キュー処理を開始
        processQueue();
      });
    },
    [processQueue],
  );

  /**
   * ✅ 特定の操作をキャンセル
   */
  const cancelOperation = useCallback((operationId: string) => {
    const index = operationQueueRef.current.findIndex(
      (item) => item.id === operationId,
    );
    if (index > -1) {
      const item = operationQueueRef.current.splice(index, 1)[0];
      item.reject(new Error("Operation cancelled"));

      SecureLogger.info("Auth operation cancelled", undefined, {
        operationId,
      });
    }
  }, []);

  /**
   * ✅ すべての操作をキャンセル
   */
  const cancelAllOperations = useCallback(() => {
    const cancelled = operationQueueRef.current.length;

    operationQueueRef.current.forEach((item) => {
      item.reject(new Error("All operations cancelled"));
    });

    operationQueueRef.current = [];

    SecureLogger.info("All auth operations cancelled", undefined, {
      cancelledCount: cancelled,
    });
  }, []);

  /**
   * ✅ キューの状態を取得
   */
  const getQueueStatus = useCallback(() => {
    return {
      isProcessing,
      queueLength: operationQueueRef.current.length,
      operations: operationQueueRef.current.map((item) => ({
        id: item.id,
        priority: item.options.priority || "normal",
        createdAt: item.createdAt,
      })),
    };
  }, [isProcessing]);

  /**
   * ✅ 健全性チェック - 古い操作の自動クリーンアップ
   */
  const cleanupStaleOperations = useCallback(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分

    const initialLength = operationQueueRef.current.length;

    operationQueueRef.current = operationQueueRef.current.filter((item) => {
      const isStale = now - item.createdAt > maxAge;
      if (isStale) {
        item.reject(new Error("Operation expired"));
      }
      return !isStale;
    });

    const cleanedCount = initialLength - operationQueueRef.current.length;

    if (cleanedCount > 0) {
      SecureLogger.warn("Cleaned up stale auth operations", undefined, {
        cleanedCount,
        remainingCount: operationQueueRef.current.length,
      });
    }
  }, []);

  return {
    enqueueOperation,
    cancelOperation,
    cancelAllOperations,
    getQueueStatus,
    cleanupStaleOperations,
    isProcessing,
  };
};
