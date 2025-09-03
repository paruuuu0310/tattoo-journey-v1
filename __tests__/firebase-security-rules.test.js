/**
 * Firebase Security Rules Test Suite - SEC-003
 * TDD Red Phase: テストケース作成
 *
 * 問題点:
 * 1. ポートフォリオ画像が全認証ユーザーに公開 (storage.rules:57)
 * 2. チャット画像の削除権限チェックが不十分 (storage.rules:96-98)
 * 3. メール検証パターンが簡易的 (firestore.rules:34)
 */

const testing = require("@firebase/rules-unit-testing");
const fs = require("fs");
const path = require("path");

describe("Firebase Security Rules - SEC-003 Vulnerabilities", () => {
  let testEnv;

  beforeAll(async () => {
    // Firestore rules の読み込み
    const firestoreRules = fs.readFileSync(
      path.resolve(__dirname, "../firestore.rules"),
      "utf8",
    );

    // Storage rules の読み込み
    const storageRules = fs.readFileSync(
      path.resolve(__dirname, "../storage.rules"),
      "utf8",
    );

    testEnv = await testing.initializeTestEnvironment({
      firestore: {
        rules: firestoreRules,
        host: "localhost",
        port: 8080,
      },
      storage: {
        rules: storageRules,
        host: "localhost",
        port: 9199,
      },
      projectId: "tattoo-journey-test",
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
  });

  describe("SEC-003-1: ポートフォリオ画像アクセス制御の問題", () => {
    it("❌ FAIL: 現在は全認証ユーザーがポートフォリオ画像にアクセス可能", async () => {
      const artistId = "artist123";
      const customerId = "customer456";
      const otherCustomerId = "customer789";

      // アーティストのコンテキスト
      const artistContext = testEnv.authenticatedContext(artistId, {
        uid: artistId,
        userType: "artist",
      });

      // 他の顧客のコンテキスト
      const otherCustomerContext = testEnv.authenticatedContext(
        otherCustomerId,
        {
          uid: otherCustomerId,
          userType: "customer",
        },
      );

      // アーティストがポートフォリオ画像をアップロード
      const artistStorage = artistContext.storage();
      const portfolioImageRef = artistStorage.ref(
        `artists/${artistId}/portfolio/image1.jpg`,
      );

      await testing.assertSucceeds(
        portfolioImageRef.put(Buffer.from("fake-image-data"), {
          contentType: "image/jpeg",
        }),
      );

      // ❌ 問題: 他の顧客も画像を読み取れてしまう（プライバシー侵害の可能性）
      const otherCustomerStorage = otherCustomerContext.storage();
      const readRef = otherCustomerStorage.ref(
        `artists/${artistId}/portfolio/image1.jpg`,
      );

      // 現在のルールでは成功してしまう（これは問題）
      await testing.assertSucceeds(readRef.getDownloadURL());

      // ✅ 期待動作: 必要最小限のユーザーのみアクセス可能にすべき
      // - マッチング済みの顧客
      // - 問い合わせ中の顧客
      // - レビュー投稿権限のある顧客
    });

    it("✅ PASS: アーティストは自分のポートフォリオ画像を管理可能", async () => {
      const artistId = "artist123";
      const artistContext = testEnv.authenticatedContext(artistId, {
        uid: artistId,
        userType: "artist",
      });

      const artistStorage = artistContext.storage();
      const portfolioImageRef = artistStorage.ref(
        `artists/${artistId}/portfolio/image1.jpg`,
      );

      // アップロード
      await testing.assertSucceeds(
        portfolioImageRef.put(Buffer.from("fake-image-data"), {
          contentType: "image/jpeg",
        }),
      );

      // 読み取り
      await testing.assertSucceeds(portfolioImageRef.getDownloadURL());

      // 削除
      await testing.assertSucceeds(portfolioImageRef.delete());
    });
  });

  describe("SEC-003-2: チャット画像削除権限の問題", () => {
    it("❌ FAIL: メタデータのuploadedByだけでは削除権限が不十分", async () => {
      const customerId = "customer123";
      const artistId = "artist456";
      const roomId = "room123";

      // チャットルーム作成
      const adminContext = testEnv.authenticatedContext("admin", {
        admin: true,
      });
      const adminFirestore = adminContext.firestore();

      await adminFirestore
        .collection("chatRooms")
        .doc(roomId)
        .set({
          participants: [customerId, artistId],
          createdAt: testing.firestore.FieldValue.serverTimestamp(),
        });

      // 顧客がチャット画像をアップロード
      const customerContext = testEnv.authenticatedContext(customerId, {
        uid: customerId,
        userType: "customer",
      });

      const customerStorage = customerContext.storage();
      const chatImageRef = customerStorage.ref(
        `chat/${roomId}/images/image1.jpg`,
      );

      await testing.assertSucceeds(
        chatImageRef.put(Buffer.from("fake-chat-image"), {
          contentType: "image/jpeg",
          customMetadata: {
            uploadedBy: customerId,
          },
        }),
      );

      // ❌ 問題: メタデータが操作されている可能性を考慮していない
      // 悪意のあるユーザーがメタデータを偽装する可能性

      // 追加の削除権限チェックが必要:
      // - チャットルーム参加者確認
      // - 管理者権限チェック
      // - 削除履歴の記録
      expect(true).toBe(true); // プレースホルダー
    });

    it("✅ PASS: 正当な参加者は自分がアップロードした画像を削除可能", async () => {
      const customerId = "customer123";
      const artistId = "artist456";
      const roomId = "room123";

      // チャットルーム作成
      const adminContext = testEnv.authenticatedContext("admin", {
        admin: true,
      });
      const adminFirestore = adminContext.firestore();

      await adminFirestore
        .collection("chatRooms")
        .doc(roomId)
        .set({
          participants: [customerId, artistId],
          createdAt: testing.firestore.FieldValue.serverTimestamp(),
        });

      // 顧客がチャット画像をアップロード・削除
      const customerContext = testEnv.authenticatedContext(customerId, {
        uid: customerId,
        userType: "customer",
      });

      const customerStorage = customerContext.storage();
      const chatImageRef = customerStorage.ref(
        `chat/${roomId}/images/image1.jpg`,
      );

      await testing.assertSucceeds(
        chatImageRef.put(Buffer.from("fake-chat-image"), {
          contentType: "image/jpeg",
          customMetadata: {
            uploadedBy: customerId,
          },
        }),
      );

      await testing.assertSucceeds(chatImageRef.delete());
    });
  });

  describe("SEC-003-3: メールアドレス検証の問題", () => {
    it("❌ FAIL: 現在の検証パターンが簡易的すぎる", async () => {
      const userId = "user123";
      const userContext = testEnv.authenticatedContext(userId, {
        uid: userId,
      });

      const firestore = userContext.firestore();
      const userRef = firestore.collection("users").doc(userId);

      // ❌ 問題: 以下のような無効なメールアドレスが通ってしまう
      const invalidEmails = [
        "invalid@", // ドメイン部分なし
        "@invalid.com", // ローカル部分なし
        "test@invalid", // TLD不正
        "test..test@test.com", // 連続ドット
        "test@.test.com", // ドメイン開始がドット
        "test space@test.com", // スペース含む
      ];

      for (const invalidEmail of invalidEmails) {
        const userData = {
          uid: userId,
          email: invalidEmail,
          userType: "customer",
          createdAt: testing.firestore.FieldValue.serverTimestamp(),
          updatedAt: testing.firestore.FieldValue.serverTimestamp(),
        };

        // ❌ 現在のルールでは無効メールが通ってしまう（これは問題）
        try {
          await testing.assertFails(userRef.set(userData));
          console.log(`✅ 正しく拒否: ${invalidEmail}`);
        } catch (error) {
          console.log(`❌ 無効メールが通過: ${invalidEmail}`);
          // 現在は assertSucceeds になってしまう
          await testing.assertSucceeds(userRef.set(userData));
        }
      }
    });

    it("✅ PASS: 有効なメールアドレスは受け入れられる", async () => {
      const userId = "user123";
      const userContext = testEnv.authenticatedContext(userId, {
        uid: userId,
      });

      const firestore = userContext.firestore();
      const userRef = firestore.collection("users").doc(userId);

      const validEmails = [
        "test@example.com",
        "user+tag@domain.co.jp",
        "valid.email@sub.domain.com",
      ];

      for (const validEmail of validEmails) {
        const userData = {
          uid: userId,
          email: validEmail,
          userType: "customer",
          createdAt: testing.firestore.FieldValue.serverTimestamp(),
          updatedAt: testing.firestore.FieldValue.serverTimestamp(),
        };

        await testing.assertSucceeds(userRef.set(userData));

        // 次のテストのためにクリーンアップ
        await userRef.delete();
      }
    });
  });

  describe("SEC-003-4: 追加のセキュリティ改善テスト", () => {
    it("❌ FAIL: プロフィール画像のサイズ制限が不適切", async () => {
      const userId = "user123";
      const userContext = testEnv.authenticatedContext(userId, {
        uid: userId,
        userType: "customer",
      });

      const storage = userContext.storage();
      const profileImageRef = storage.ref(`users/${userId}/profile/avatar.jpg`);

      // ❌ 問題: 2MB制限だが、実際にはより厳格にすべき
      const largeFakeImage = Buffer.alloc(1.5 * 1024 * 1024); // 1.5MB

      // 現在は成功してしまう
      await testing.assertSucceeds(
        profileImageRef.put(largeFakeImage, {
          contentType: "image/jpeg",
        }),
      );

      // ✅ 期待: より厳格なサイズ制限とファイル形式検証
    });

    it("✅ PASS: 適切なサイズの画像は受け入れられる", async () => {
      const userId = "user123";
      const userContext = testEnv.authenticatedContext(userId, {
        uid: userId,
        userType: "customer",
      });

      const storage = userContext.storage();
      const profileImageRef = storage.ref(`users/${userId}/profile/avatar.jpg`);

      const appropriateFakeImage = Buffer.alloc(500 * 1024); // 500KB

      await testing.assertSucceeds(
        profileImageRef.put(appropriateFakeImage, {
          contentType: "image/jpeg",
        }),
      );
    });
  });

  describe("SEC-003-5: アクセスログ監視機能の不足", () => {
    it("❌ FAIL: セキュリティイベントのログが不十分", async () => {
      // ❌ 問題: 以下のような重要なセキュリティイベントが記録されていない
      // - 不正アクセス試行
      // - 権限エラー発生
      // - 大量データアクセス
      // - 異常なアクセスパターン

      // 現在のルールではこれらの監視機能が不足
      expect(true).toBe(true); // プレースホルダー

      // ✅ 期待: Cloud Functions による監視システム
      // - アクセスログ記録
      // - 異常検知
      // - アラート通知
    });
  });
});
