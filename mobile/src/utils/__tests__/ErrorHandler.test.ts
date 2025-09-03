/**
 * Error Handler Test Suite - SEC-006
 * TDD Red Phase: エラー処理の改善とメッセージ分離テストケース作成
 *
 * 問題点:
 * 1. デバッグ情報とユーザー向けメッセージが混在
 * 2. エラー処理の一貫性不足 (複数サービスで異なるエラー処理)
 * 3. 本番環境とデベロップ環境でのエラー情報レベル未統一
 * 4. エラー分類システムの不備
 * 5. ログ収集・分析システムの不足
 */

import {
  ErrorHandler,
  ErrorLevel,
  ErrorCategory,
  UserFriendlyError,
} from "../ErrorHandler";
import { SecureLogger } from "../SecureLogger";
import { EnvironmentConfig } from "../../config/EnvironmentConfig";

// モック設定
jest.mock("../SecureLogger");
jest.mock("../../config/EnvironmentConfig");

const mockSecureLogger = SecureLogger as jest.Mocked<typeof SecureLogger>;
const mockEnvironmentConfig = EnvironmentConfig as jest.Mocked<
  typeof EnvironmentConfig
>;

describe("ErrorHandler - SEC-006", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentConfig.isProduction.mockReturnValue(false);
  });

  describe("SEC-006-1: エラー分類システム", () => {
    it("✅ PASS: エラーを適切なカテゴリに分類できる", () => {
      const networkError = new Error("Network request failed");
      const authError = new Error("Authentication failed");
      const validationError = new Error("Invalid email format");
      const systemError = new Error("Internal server error");

      expect(ErrorHandler.categorizeError(networkError)).toBe(
        ErrorCategory.NETWORK,
      );
      expect(ErrorHandler.categorizeError(authError)).toBe(
        ErrorCategory.AUTHENTICATION,
      );
      expect(ErrorHandler.categorizeError(validationError)).toBe(
        ErrorCategory.VALIDATION,
      );
      expect(ErrorHandler.categorizeError(systemError)).toBe(
        ErrorCategory.SYSTEM,
      );
    });

    it("✅ PASS: Firebase固有エラーを正しく分類できる", () => {
      const firestoreError = new Error(
        "Firestore: Missing or insufficient permissions",
      );
      const authPermissionError = new Error(
        "Firebase: User does not have permission",
      );
      const storageError = new Error("Firebase Storage: File not found");

      expect(ErrorHandler.categorizeError(firestoreError)).toBe(
        ErrorCategory.DATABASE,
      );
      expect(ErrorHandler.categorizeError(authPermissionError)).toBe(
        ErrorCategory.AUTHENTICATION,
      );
      expect(ErrorHandler.categorizeError(storageError)).toBe(
        ErrorCategory.STORAGE,
      );
    });
  });

  describe("SEC-006-2: ユーザー向けメッセージとデバッグ情報の分離", () => {
    it("✅ PASS: 本番環境ではユーザーフレンドリーなメッセージのみ表示", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(true);

      const technicalError = new Error(
        "Firestore query failed: Invalid document reference path/to/doc",
      );
      const userError = ErrorHandler.handleError(technicalError, {
        context: "user_profile_fetch",
        userId: "user123",
      });

      // ✅ 期待: 技術的詳細は隠蔽され、ユーザーフレンドリーなメッセージ
      expect(userError.userMessage).toBe(
        "プロフィールの読み込みに失敗しました。しばらく待ってから再度お試しください。",
      );
      expect(userError.userMessage).not.toContain("Firestore");
      expect(userError.userMessage).not.toContain("document reference");

      // ✅ デバッグ情報はSecureLoggerに記録
      expect(mockSecureLogger.error).toHaveBeenCalledWith(
        "Error in user_profile_fetch",
        expect.any(Object),
        expect.objectContaining({
          reportToService: true,
        }),
      );
    });

    it("✅ PASS: 開発環境では詳細なデバッグ情報を提供", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(false);

      const technicalError = new Error("API endpoint /users/123 returned 404");
      const userError = ErrorHandler.handleError(technicalError, {
        context: "api_request",
        endpoint: "/users/123",
      });

      // ✅ 開発環境では詳細情報も含む
      expect(userError.debugInfo).toBeDefined();
      expect(userError.debugInfo?.originalError).toContain(
        "API endpoint /users/123 returned 404",
      );
      expect(userError.debugInfo?.stackTrace).toBeDefined();
      expect(userError.debugInfo?.context).toEqual({
        context: "api_request",
        endpoint: "/users/123",
      });
    });

    it("❌ FAIL: 既存の実装では技術的エラーがそのままユーザーに表示される", () => {
      // ❌ 問題: 現在のサービスファイルでの典型的な問題
      const rawFirestoreError = new Error(
        "Firestore: PERMISSION_DENIED: Missing or insufficient permissions",
      );

      // 現在の実装では、このエラーがそのままユーザーに表示される
      // これはユーザーフレンドリーではない
      expect(rawFirestoreError.message).toContain("PERMISSION_DENIED");
      expect(rawFirestoreError.message).toContain("insufficient permissions");

      // ✅ 期待: ErrorHandlerを通すことで改善される
      const userError = ErrorHandler.handleError(rawFirestoreError);
      expect(userError.userMessage).not.toContain("PERMISSION_DENIED");
      expect(userError.userMessage).not.toContain("Firestore");
    });
  });

  describe("SEC-006-3: エラーレベルの自動判定", () => {
    it("✅ PASS: エラーの重要度を自動的に判定", () => {
      const warningError = new Error("Network timeout");
      const criticalError = new Error("Database connection lost");
      const infoError = new Error("User cancelled operation");

      expect(ErrorHandler.determineErrorLevel(warningError)).toBe(
        ErrorLevel.WARNING,
      );
      expect(ErrorHandler.determineErrorLevel(criticalError)).toBe(
        ErrorLevel.CRITICAL,
      );
      expect(ErrorHandler.determineErrorLevel(infoError)).toBe(ErrorLevel.INFO);
    });

    it("✅ PASS: コンテキストに応じてエラーレベルを調整", () => {
      const networkError = new Error("Network request failed");

      // 重要な操作の場合はCRITICAL
      const criticalContext = ErrorHandler.handleError(networkError, {
        context: "payment_processing",
        criticalOperation: true,
      });
      expect(criticalContext.level).toBe(ErrorLevel.CRITICAL);

      // 通常の操作の場合はWARNING
      const normalContext = ErrorHandler.handleError(networkError, {
        context: "profile_image_upload",
      });
      expect(normalContext.level).toBe(ErrorLevel.WARNING);
    });
  });

  describe("SEC-006-4: エラー回復提案システム", () => {
    it("✅ PASS: ユーザーに適切な回復アクションを提案", () => {
      const networkError = new Error("Network request failed");
      const authError = new Error("Authentication token expired");
      const validationError = new Error("Invalid email format");

      const networkResponse = ErrorHandler.handleError(networkError);
      expect(networkResponse.recoveryActions).toContain(
        "インターネット接続を確認してください",
      );
      expect(networkResponse.recoveryActions).toContain(
        "しばらく待ってから再度お試しください",
      );

      const authResponse = ErrorHandler.handleError(authError);
      expect(authResponse.recoveryActions).toContain(
        "再度ログインしてください",
      );

      const validationResponse = ErrorHandler.handleError(validationError);
      expect(validationResponse.recoveryActions).toContain(
        "入力内容を確認してください",
      );
    });

    it("✅ PASS: 自動リトライ可能エラーの検出", () => {
      const retryableError = new Error("Temporary server error");
      const nonRetryableError = new Error("Invalid API key");

      expect(ErrorHandler.isRetryable(retryableError)).toBe(true);
      expect(ErrorHandler.isRetryable(nonRetryableError)).toBe(false);
    });
  });

  describe("SEC-006-5: エラー集計とパターン分析", () => {
    it("✅ PASS: 同じエラーパターンの集計", async () => {
      const error1 = new Error("Network timeout");
      const error2 = new Error("Network timeout");
      const error3 = new Error("Database error");

      ErrorHandler.handleError(error1, { context: "api_call_1" });
      ErrorHandler.handleError(error2, { context: "api_call_2" });
      ErrorHandler.handleError(error3, { context: "db_query" });

      const stats = await ErrorHandler.getErrorStats(24); // 過去24時間

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory[ErrorCategory.NETWORK]).toBe(2);
      expect(stats.errorsByCategory[ErrorCategory.DATABASE]).toBe(1);
      expect(stats.mostCommonErrors[0].pattern).toContain("Network timeout");
      expect(stats.mostCommonErrors[0].count).toBe(2);
    });

    it("✅ PASS: ユーザー別エラー分析", async () => {
      const error = new Error("Permission denied");

      ErrorHandler.handleError(error, {
        userId: "user1",
        context: "profile_update",
      });
      ErrorHandler.handleError(error, {
        userId: "user1",
        context: "image_upload",
      });
      ErrorHandler.handleError(error, {
        userId: "user2",
        context: "profile_update",
      });

      const userStats = await ErrorHandler.getUserErrorStats("user1", 24);

      expect(userStats.totalErrors).toBe(2);
      expect(userStats.contexts).toEqual(["profile_update", "image_upload"]);
    });
  });

  describe("SEC-006-6: 多言語対応エラーメッセージ", () => {
    it("✅ PASS: ロケールに応じたエラーメッセージ", () => {
      const error = new Error("Network timeout");

      const jaResponse = ErrorHandler.handleError(error, { locale: "ja" });
      expect(jaResponse.userMessage).toContain("ネットワーク");

      const enResponse = ErrorHandler.handleError(error, { locale: "en" });
      expect(enResponse.userMessage).toContain("network");
      expect(enResponse.userMessage).not.toContain("ネットワーク");
    });
  });

  describe("SEC-006-7: サービス統合テスト", () => {
    it("❌ FAIL: 現在のサービスファイルでの一貫性のないエラー処理", () => {
      // ❌ 問題: 現在の実装例（MatchingService.ts:72）
      // console.error('Error in findMatchingArtists:', error);
      // この方法では:
      // 1. ユーザーフレンドリーなメッセージがない
      // 2. エラー分類がない
      // 3. 回復アクションの提案がない
      // 4. 本番/開発環境の区別がない

      // ✅ 期待: ErrorHandlerを使用した統一的な処理
      const mockServiceError = new Error("Firestore query failed");
      const handledError = ErrorHandler.handleError(mockServiceError, {
        context: "matching_service",
        operation: "findMatchingArtists",
      });

      expect(handledError.userMessage).toBeDefined();
      expect(handledError.category).toBeDefined();
      expect(handledError.recoveryActions).toBeDefined();
      expect(mockSecureLogger.error).toHaveBeenCalled();
    });

    it("✅ PASS: ErrorHandlerを使用したサービスの改善例", () => {
      // 改善されたサービスでの使用例
      const serviceError = new Error("Failed to fetch user data");

      const result = ErrorHandler.handleServiceError(serviceError, {
        service: "UserService",
        method: "fetchUserProfile",
        userId: "user123",
      });

      expect(result.success).toBe(false);
      expect(result.error?.userMessage).toBe(
        "ユーザー情報の取得に失敗しました。しばらく待ってから再度お試しください。",
      );
      expect(result.error?.canRetry).toBe(true);
      expect(result.error?.retryAfter).toBeGreaterThan(0);
    });
  });
});
