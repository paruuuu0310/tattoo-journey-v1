/**
 * Chat Image Deletion Security Tests - SEC-008
 * TDD Red Phase: チャット画像削除権限強化のテストケース作成
 *
 * テスト対象の問題点:
 * 1. 管理者権限検証の不備
 * 2. 削除履歴記録システムの不足
 * 3. 不正削除検知システムの不足
 * 4. 時間制限・条件付き削除権限管理の不足
 */

import {
  RulesTestEnvironment,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";

// Cloud Functions エミュレーター用の型定義
interface MockCloudFunctionContext {
  auth?: {
    uid: string;
    token: Record<string, any>;
  };
}

interface DeletionAuditLog {
  deletedBy: string;
  originalUploader: string;
  roomId: string;
  imageId: string;
  reason: string;
  adminVerified: boolean;
  timestamp: number;
  moderatorApproved?: boolean;
}

describe("SEC-008: チャット画像削除権限の強化", () => {
  let testEnv: RulesTestEnvironment;
  let mockFirestore: any;
  let mockStorage: any;

  beforeAll(async () => {
    // Firebase ルールファイルの読み込み
    const storageRules = readFileSync(
      resolve(__dirname, "../../storage.rules"),
      "utf8",
    );
    const firestoreRules = readFileSync(
      resolve(__dirname, "../../firestore.rules"),
      "utf8",
    );

    testEnv = await initializeTestEnvironment({
      projectId: "tattoo-journey-security-test",
      storage: {
        rules: storageRules,
        host: "localhost",
        port: 9199,
      },
      firestore: {
        rules: firestoreRules,
        host: "localhost",
        port: 8080,
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearStorage();
    await testEnv.clearFirestore();

    // モックデータ設定
    mockFirestore = testEnv.firestore();
    mockStorage = testEnv.storage();

    // テスト用チャットルームとユーザーデータ設定
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();

      // チャットルーム設定
      await firestore.doc("chatRooms/room_customer_artist").set({
        participants: ["customer1", "artist1"],
        createdAt: new Date(),
        lastMessage: "test message",
      });

      // ユーザー設定
      await firestore.doc("users/customer1").set({
        uid: "customer1",
        userType: "customer",
        email: "customer@test.com",
      });

      await firestore.doc("users/artist1").set({
        uid: "artist1",
        userType: "artist",
        email: "artist@test.com",
      });

      await firestore.doc("users/admin1").set({
        uid: "admin1",
        userType: "admin",
        email: "admin@tattoojourney.com",
        adminLevel: "super",
        verifiedAdmin: true,
      });

      await firestore.doc("users/moderator1").set({
        uid: "moderator1",
        userType: "moderator",
        email: "moderator@tattoojourney.com",
        adminLevel: "moderate",
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("SEC-008-1: 強化された管理者権限検証", () => {
    it("✅ PASS: 正当な管理者は画像を削除できる", async () => {
      // テスト用画像メタデータ
      const imageMetadata = {
        uploadedBy: "customer1",
        uploadedAt: Date.now(),
        roomId: "room_customer_artist",
      };

      const adminContext = testEnv.authenticatedContext("admin1", {
        admin: true,
        adminLevel: "super",
        verifiedAdmin: true,
      });

      const storage = adminContext.storage();

      // ✅ 期待: 正当な管理者は削除権限を持つ
      await expect(
        storage.ref("chat/room_customer_artist/images/image1.jpg").delete(),
      ).not.toBeRejected();

      // ✅ 削除履歴が記録されることを確認
      const auditRef = mockFirestore
        .collection("deletionAuditLogs")
        .where("imageId", "==", "image1.jpg")
        .where("deletedBy", "==", "admin1");

      const auditSnapshot = await auditRef.get();
      expect(auditSnapshot.empty).toBe(false);

      const auditData = auditSnapshot.docs[0].data() as DeletionAuditLog;
      expect(auditData.adminVerified).toBe(true);
      expect(auditData.reason).toBeDefined();
    });

    it("❌ FAIL: 管理者クレーム偽装による不正削除の試行", async () => {
      const fakeAdminContext = testEnv.authenticatedContext("malicious_user", {
        admin: true, // 偽装されたクレーム
        adminLevel: "super", // 偽装レベル
      });

      const storage = fakeAdminContext.storage();

      // ❌ 問題: 現在のルールでは単純なtoken.adminチェックのみ
      // ✅ 期待: データベースでの管理者検証が必要
      await expect(
        storage.ref("chat/room_customer_artist/images/image1.jpg").delete(),
      ).toBeRejected();
    });

    it("✅ PASS: 管理者レベル別権限制御", async () => {
      // モデレーター（中間管理者）のテスト
      const moderatorContext = testEnv.authenticatedContext("moderator1", {
        admin: true,
        adminLevel: "moderate",
      });

      const storage = moderatorContext.storage();

      // ✅ モデレーターは通常の不適切画像のみ削除可能
      await expect(
        storage
          .ref("chat/room_customer_artist/images/inappropriate.jpg")
          .delete(),
      ).not.toBeRejected();

      // ✅ しかし、システム重要画像は削除不可
      await expect(
        storage
          .ref("chat/room_customer_artist/images/system_important.jpg")
          .delete(),
      ).toBeRejected();
    });
  });

  describe("SEC-008-2: 削除履歴記録システム", () => {
    it("✅ PASS: すべての削除操作が監査ログに記録される", async () => {
      const customerContext = testEnv.authenticatedContext("customer1", {});
      const storage = customerContext.storage();

      // 顧客が自分の画像を削除
      await storage
        .ref("chat/room_customer_artist/images/my_image.jpg")
        .delete();

      // ✅ 削除履歴が記録されることを確認
      const auditQuery = await mockFirestore
        .collection("deletionAuditLogs")
        .where("imageId", "==", "my_image.jpg")
        .get();

      expect(auditQuery.empty).toBe(false);

      const auditData = auditQuery.docs[0].data() as DeletionAuditLog;
      expect(auditData.deletedBy).toBe("customer1");
      expect(auditData.originalUploader).toBe("customer1");
      expect(auditData.roomId).toBe("room_customer_artist");
      expect(auditData.adminVerified).toBe(false);
      expect(auditData.timestamp).toBeGreaterThan(Date.now() - 10000);
    });

    it("✅ PASS: 管理者削除の詳細ログ記録", async () => {
      const adminContext = testEnv.authenticatedContext("admin1", {
        admin: true,
        adminLevel: "super",
        verifiedAdmin: true,
      });

      const storage = adminContext.storage();

      // 管理者が他人の画像を削除（理由付き）
      await storage
        .ref("chat/room_customer_artist/images/violation.jpg")
        .delete({
          customMetadata: {
            reason: "Community guideline violation",
            reportedBy: "user123",
            violationType: "inappropriate_content",
          },
        });

      const auditQuery = await mockFirestore
        .collection("deletionAuditLogs")
        .where("imageId", "==", "violation.jpg")
        .get();

      const auditData = auditQuery.docs[0].data() as DeletionAuditLog;
      expect(auditData.deletedBy).toBe("admin1");
      expect(auditData.reason).toBe("Community guideline violation");
      expect(auditData.adminVerified).toBe(true);
    });

    it("❌ FAIL: 現在のシステムでは削除履歴が記録されない", async () => {
      // ❌ 問題: 現在のStorage Rulesには削除履歴機能がない
      const customerContext = testEnv.authenticatedContext("customer1", {});
      const storage = customerContext.storage();

      await storage.ref("chat/room_customer_artist/images/test.jpg").delete();

      // 現在のシステムでは削除履歴が存在しない
      const auditQuery = await mockFirestore
        .collection("deletionAuditLogs")
        .where("imageId", "==", "test.jpg")
        .get();

      // ❌ 現在は履歴が記録されないため、この部分が失敗する
      expect(auditQuery.empty).toBe(true); // 現状では履歴なし
    });
  });

  describe("SEC-008-3: 時間制限および条件付き削除権限", () => {
    it("✅ PASS: 24時間以内の画像のみ自己削除可能", async () => {
      const now = Date.now();
      const recentImage = now - 1 * 60 * 60 * 1000; // 1時間前
      const oldImage = now - 25 * 60 * 60 * 1000; // 25時間前

      const customerContext = testEnv.authenticatedContext("customer1", {});
      const storage = customerContext.storage();

      // ✅ 最近の画像は削除可能
      await expect(
        storage.ref("chat/room_customer_artist/images/recent.jpg").delete(),
      ).not.toBeRejected();

      // ✅ 古い画像は削除不可
      await expect(
        storage.ref("chat/room_customer_artist/images/old.jpg").delete(),
      ).toBeRejected();
    });

    it("✅ PASS: 会話が終了したチャットの画像は削除不可", async () => {
      // 終了したチャットルーム設定
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .doc("chatRooms/closed_room")
          .set({
            participants: ["customer1", "artist1"],
            status: "closed",
            closedAt: new Date(Date.now() - 1000),
            finalizedConversation: true,
          });
      });

      const customerContext = testEnv.authenticatedContext("customer1", {});
      const storage = customerContext.storage();

      // ✅ 終了した会話の画像は削除できない
      await expect(
        storage.ref("chat/closed_room/images/final_design.jpg").delete(),
      ).toBeRejected();
    });

    it("✅ PASS: 進行中予約に関連する画像は削除制限", async () => {
      // 進行中の予約設定
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc("activeBookings/booking123").set({
          customerId: "customer1",
          artistId: "artist1",
          status: "in_progress",
          roomId: "room_customer_artist",
        });
      });

      const customerContext = testEnv.authenticatedContext("customer1", {});
      const storage = customerContext.storage();

      // ✅ 予約関連画像は削除に制限がかかる
      await expect(
        storage
          .ref("chat/room_customer_artist/images/booking_design.jpg")
          .delete(),
      ).toBeRejected();
    });
  });

  describe("SEC-008-4: 不正削除検知システム", () => {
    it("✅ PASS: 短時間での大量削除の検知", async () => {
      const suspiciousUserContext = testEnv.authenticatedContext(
        "suspicious_user",
        {},
      );
      const storage = suspiciousUserContext.storage();

      // 短時間で5回以上の削除を実行
      const deletionPromises = Array.from({ length: 6 }, (_, i) =>
        storage.ref(`chat/room_customer_artist/images/spam_${i}.jpg`).delete(),
      );

      // ✅ 大量削除が検知されてブロックされる
      await expect(Promise.all(deletionPromises)).toBeRejected();

      // ✅ 異常行動アラートが記録される
      const alertQuery = await mockFirestore
        .collection("securityAlerts")
        .where("type", "==", "mass_deletion")
        .where("userId", "==", "suspicious_user")
        .get();

      expect(alertQuery.empty).toBe(false);
    });

    it("✅ PASS: パターン異常の検知", async () => {
      const userContext = testEnv.authenticatedContext("customer1", {});
      const storage = userContext.storage();

      // 異常なパターン: 他人の画像ばかりを削除しようとする
      const suspiciousDeletions = [
        "chat/room1/images/other_user_1.jpg",
        "chat/room2/images/other_user_2.jpg",
        "chat/room3/images/other_user_3.jpg",
      ];

      for (const imagePath of suspiciousDeletions) {
        await expect(storage.ref(imagePath).delete()).toBeRejected();
      }

      // ✅ パターン異常アラートが記録される
      const patternAlertQuery = await mockFirestore
        .collection("securityAlerts")
        .where("type", "==", "suspicious_deletion_pattern")
        .where("userId", "==", "customer1")
        .get();

      expect(patternAlertQuery.empty).toBe(false);
    });
  });

  describe("SEC-008-5: 管理者権限システムの階層管理", () => {
    it("✅ PASS: スーパー管理者の全権限", async () => {
      const superAdminContext = testEnv.authenticatedContext("super_admin", {
        admin: true,
        adminLevel: "super",
        verifiedAdmin: true,
      });

      const storage = superAdminContext.storage();

      // ✅ あらゆる画像を削除可能
      await expect(
        storage.ref("chat/any_room/images/any_image.jpg").delete(),
      ).not.toBeRejected();

      // ✅ システム画像も削除可能
      await expect(
        storage.ref("system/critical_backup.jpg").delete(),
      ).not.toBeRejected();
    });

    it("✅ PASS: モデレーターの制限付き権限", async () => {
      const moderatorContext = testEnv.authenticatedContext("moderator1", {
        admin: true,
        adminLevel: "moderate",
      });

      const storage = moderatorContext.storage();

      // ✅ 通常のチャット画像は削除可能
      await expect(
        storage.ref("chat/room_customer_artist/images/normal.jpg").delete(),
      ).not.toBeRejected();

      // ✅ しかしシステムファイルは削除不可
      await expect(storage.ref("system/important.jpg").delete()).toBeRejected();
    });

    it("❌ FAIL: 現在の管理者権限システムは階層管理されていない", async () => {
      // ❌ 問題: 現在はtoken.admin == trueの単純チェックのみ
      // 階層的な管理者権限システムが実装されていない

      const fakeModeratorContext = testEnv.authenticatedContext(
        "fake_moderator",
        {
          admin: true, // 偽装された管理者クレーム
        },
      );

      const storage = fakeModeratorContext.storage();

      // 現在のシステムでは偽装管理者も削除権限を持ってしまう
      await expect(
        storage
          .ref("chat/room_customer_artist/images/should_be_protected.jpg")
          .delete(),
      ).not.toBeRejected(); // ❌ 現状では削除できてしまう
    });
  });

  describe("SEC-008-6: 削除復元とバックアップシステム", () => {
    it("✅ PASS: 重要画像の自動バックアップ", async () => {
      const adminContext = testEnv.authenticatedContext("admin1", {
        admin: true,
        adminLevel: "super",
      });

      const storage = adminContext.storage();

      // 重要画像を削除
      await storage
        .ref("chat/room_customer_artist/images/important_design.jpg")
        .delete({
          customMetadata: {
            importance: "high",
            backupRequired: "true",
          },
        });

      // ✅ バックアップが作成されることを確認
      const backupQuery = await mockFirestore
        .collection("deletedImageBackups")
        .where(
          "originalPath",
          "==",
          "chat/room_customer_artist/images/important_design.jpg",
        )
        .get();

      expect(backupQuery.empty).toBe(false);

      const backupData = backupQuery.docs[0].data();
      expect(backupData.backupLocation).toBeDefined();
      expect(backupData.restorePossible).toBe(true);
    });

    it("✅ PASS: 48時間以内の削除復元機能", async () => {
      const adminContext = testEnv.authenticatedContext("admin1", {
        admin: true,
        adminLevel: "super",
      });

      // 削除された画像の復元試行
      const restorationResult = await mockFirestore
        .collection("imageRestorations")
        .add({
          originalPath: "chat/room_customer_artist/images/restored.jpg",
          requestedBy: "admin1",
          reason: "Accidental deletion",
          timestamp: Date.now(),
        });

      expect(restorationResult.id).toBeDefined();

      // ✅ 復元が正常に処理されることを確認
      const restoredQuery = await mockFirestore
        .collection("restoredImages")
        .where("restorationId", "==", restorationResult.id)
        .get();

      expect(restoredQuery.empty).toBe(false);
    });
  });
});
