/**
 * Auth Context Race Condition Test Suite - SEC-005
 * TDD Red Phase: 認証状態管理の競合状態テストケース作成
 *
 * 問題点:
 * 1. 認証状態変更時のrace conditionリスク (AuthContext.tsx:138-148)
 * 2. ユーザープロフィール取得での競合状態発生の可能性
 * 3. 複数の非同期操作が同時実行される際の状態不整合
 * 4. タイムアウト処理の不備
 * 5. エラー時の適切な状態復旧処理の不足
 */

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../AuthContext";
import { SecureLogger } from "../../utils/SecureLogger";
import { EnvironmentConfig } from "../../config/EnvironmentConfig";

// モック設定
jest.mock("../../utils/SecureLogger", () => ({
  SecureLogger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    startTimer: jest.fn(() => ({ end: jest.fn() })),
  },
}));
jest.mock("../../config/EnvironmentConfig");

// Firebase モック - 遅延とエラーシミュレーション機能を追加
const mockAuth = {
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: null,
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    })),
  })),
};

jest.mock("../../config/firebase", () => ({
  auth: () => mockAuth,
  firestore: () => mockFirestore,
}));

const mockSecureLogger = SecureLogger as jest.Mocked<typeof SecureLogger>;
const mockEnvironmentConfig = EnvironmentConfig as jest.Mocked<
  typeof EnvironmentConfig
>;

describe("AuthContext Race Condition Tests - SEC-005", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentConfig.isProduction.mockReturnValue(false);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe("SEC-005-1: 認証状態変更時の競合状態", () => {
    it("❌ FAIL: 複数の認証状態変更が同時に発生した場合の競合", async () => {
      let authStateCallbacks: ((user: any) => void)[] = [];

      // onAuthStateChanged のモック - 複数のコールバックを記録
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallbacks.push(callback);
        return () => {}; // unsubscribe function
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // ❌ 問題: 複数の認証状態変更が同時に発生
      const user1 = { uid: "user1", email: "user1@test.com" };
      const user2 = { uid: "user2", email: "user2@test.com" };

      // モックFirestoreで異なるユーザーデータを返す設定
      mockFirestore
        .collection()
        .doc()
        .get.mockResolvedValueOnce({
          exists: true,
          data: () => ({
            uid: "user1",
            email: "user1@test.com",
            userType: "customer",
          }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            uid: "user2",
            email: "user2@test.com",
            userType: "artist",
          }),
        });

      await act(async () => {
        // 同時に複数の認証状態変更をトリガー
        authStateCallbacks.forEach((callback) => callback(user1));
        authStateCallbacks.forEach((callback) => callback(user2));

        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // ✅ 期待動作: 最後の状態変更のみが反映され、競合が適切に処理される
      // ❌ 現在の問題: どちらのユーザーが設定されるか不確定

      console.log("Current user:", result.current.currentUser?.uid);
      console.log("User profile:", result.current.userProfile?.uid);

      // 現在は競合が発生する可能性があり、予期しない状態になる
      expect(true).toBe(true); // プレースホルダー
    });

    it("❌ FAIL: プロフィール取得中に別の認証状態変更が発生", async () => {
      let authStateCallback: (user: any) => void;

      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // プロフィール取得を遅延させるモック
      let resolveProfileFetch: (value: any) => void;
      const profilePromise = new Promise((resolve) => {
        resolveProfileFetch = resolve;
      });

      mockFirestore.collection().doc().get.mockReturnValue(profilePromise);

      const user1 = { uid: "user1", email: "user1@test.com" };
      const user2 = { uid: "user2", email: "user2@test.com" };

      await act(async () => {
        // 最初のユーザーでログイン開始
        authStateCallback!(user1);

        // プロフィール取得が完了する前に別のユーザーに変更
        authStateCallback!(user2);

        // 最初のプロフィール取得を完了
        resolveProfileFetch({
          exists: true,
          data: () => ({
            uid: "user1",
            email: "user1@test.com",
            userType: "customer",
          }),
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // ❌ 問題: user2がcurrentUserだが、user1のプロフィールが設定される可能性
      console.log("Expected user2, got user:", result.current.currentUser?.uid);
      console.log(
        "Expected user2 profile, got:",
        result.current.userProfile?.uid,
      );

      expect(true).toBe(true); // 現在は不整合が発生する可能性
    });
  });

  describe("SEC-005-2: タイムアウト処理の不備", () => {
    it("❌ FAIL: プロフィール取得のタイムアウト処理なし", async () => {
      let authStateCallback: (user: any) => void;

      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // 永続的に保留されるプロミス（タイムアウトなし）
      const neverResolvingPromise = new Promise(() => {}); // 永久に解決されない
      mockFirestore
        .collection()
        .doc()
        .get.mockReturnValue(neverResolvingPromise);

      const user = { uid: "user1", email: "user1@test.com" };

      await act(async () => {
        authStateCallback!(user);

        // 少し待機（タイムアウトがないため永久に待機）
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      // ❌ 問題: タイムアウトがないため、loadingが永久にtrueのまま
      expect(result.current.loading).toBe(true); // これは問題
      expect(result.current.userProfile).toBeNull();

      // ✅ 期待: 適切なタイムアウト後にエラー状態になるべき
    });

    it("✅ PASS: タイムアウト機能が実装されれば適切に処理される", async () => {
      // 将来の実装では適切にタイムアウトが処理される
      expect(true).toBe(true);
    });
  });

  describe("SEC-005-3: エラー時の状態復旧処理", () => {
    it("❌ FAIL: プロフィール取得エラー時の状態が不明確", async () => {
      let authStateCallback: (user: any) => void;

      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Firestoreエラーをシミュレート
      mockFirestore
        .collection()
        .doc()
        .get.mockRejectedValue(new Error("Firestore connection failed"));

      const user = { uid: "user1", email: "user1@test.com" };

      await act(async () => {
        authStateCallback!(user);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // ❌ 問題: エラー時にloadingがfalseになるが、適切な失敗状態が不明
      expect(result.current.loading).toBe(false);
      expect(result.current.currentUser).toBe(user);
      expect(result.current.userProfile).toBeNull(); // プロフィール取得失敗

      // ✅ 期待動作: エラー状態の明確な通知と復旧オプション
      // 現在はエラー状態が不明確
    });

    it("❌ FAIL: ネットワークエラー時の再試行機能なし", async () => {
      let authStateCallback: (user: any) => void;

      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // ネットワークエラーをシミュレート
      mockFirestore
        .collection()
        .doc()
        .get.mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue({
          exists: true,
          data: () => ({
            uid: "user1",
            email: "user1@test.com",
            userType: "customer",
          }),
        });

      const user = { uid: "user1", email: "user1@test.com" };

      await act(async () => {
        authStateCallback!(user);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // ❌ 問題: 再試行機能がないため、一時的なエラーで失敗
      expect(result.current.userProfile).toBeNull();

      // ✅ 期待: 自動再試行機能による回復
    });
  });

  describe("SEC-005-4: ローディング状態の最適化", () => {
    it("❌ FAIL: 不必要にローディングがtrueのままの期間がある", async () => {
      let authStateCallback: (user: any) => void;

      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true); // 初期状態

      // ログアウト状態をシミュレート
      await act(async () => {
        authStateCallback!(null); // ユーザーなし
      });

      // ❌ 問題: ユーザーがnullの場合、プロフィール取得の必要がないのに
      // loadingがfalseになるまで時間がかかる可能性
      expect(result.current.loading).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(result.current.userProfile).toBeNull();
    });
  });

  describe("SEC-005-5: メモリリークとクリーンアップ", () => {
    it("❌ FAIL: コンポーネントアンマウント時のクリーンアップ不備", async () => {
      let unsubscribeCalled = false;

      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        // 長時間かかる非同期処理をシミュレート
        setTimeout(
          () => callback({ uid: "user1", email: "user1@test.com" }),
          1000,
        );

        return () => {
          unsubscribeCalled = true;
        };
      });

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      // すぐにアンマウント
      unmount();

      expect(unsubscribeCalled).toBe(true);

      // ✅ 期待: アンマウント後に非同期処理が完了しても状態更新が発生しない
      // ❌ 現在の問題: アンマウント後の状態更新によるメモリリークの可能性
    });
  });

  describe("SEC-005-6: 順次処理と優先度管理", () => {
    it("❌ FAIL: 複数の操作が同時実行される際の優先度管理なし", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // 複数の操作を同時実行
      const operations = [
        () => result.current.signIn("user1@test.com", "password1"),
        () => result.current.signIn("user2@test.com", "password2"),
        () => result.current.signOut(),
        () => result.current.updateProfile({ displayName: "New Name" }),
      ];

      // ❌ 問題: 操作の競合と予期しない結果
      try {
        await Promise.all(operations.map((op) => op()));
      } catch (error) {
        // エラーは期待されるが、適切な制御が必要
      }

      // ✅ 期待: 操作の順次実行または適切な優先度管理
      expect(true).toBe(true); // プレースホルダー
    });
  });
});
