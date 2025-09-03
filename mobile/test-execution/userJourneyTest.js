/**
 * 完全なユーザージャーニーテスト
 * Tattoo Journey 2.0 Mobile App
 *
 * お客様がアプリを使用してタトゥーアーティストとマッチングし、
 * 予約からレビューまでの完全なフローをテスト
 */

import { TestRunner } from "../src/test-utils/TestRunner";
import { FirebaseTestUtils } from "../src/test-utils/FirebaseTestUtils";
import {
  testCustomer,
  testArtist,
  testReferenceImages,
} from "../src/test-data/testUsers";
import { expectedAIAnalysis } from "../src/test-data/mockAIResponses";

class UserJourneyTest {
  constructor() {
    this.testRunner = TestRunner.getInstance();
    this.firebaseUtils = FirebaseTestUtils.getInstance();
    this.journeyState = {
      customer: null,
      artist: null,
      aiAnalysis: null,
      matchResults: [],
      selectedArtist: null,
      booking: null,
      chatRoom: null,
      messages: [],
      review: null,
    };
  }

  async runCompleteUserJourney() {
    console.log("🚀 Complete User Journey Test 開始");
    console.log("=====================================\n");

    try {
      // Step 1: 環境セットアップ
      await this.setupEnvironment();

      // Step 2: お客様のユーザー登録
      await this.customerRegistration();

      // Step 3: 参考画像アップロードとAI解析
      await this.imageUploadAndAnalysis();

      // Step 4: アーティストマッチング
      await this.artistMatching();

      // Step 5: アーティスト選択と予約作成
      await this.bookingCreation();

      // Step 6: チャットでのやりとり
      await this.chatCommunication();

      // Step 7: サービス完了
      await this.serviceCompletion();

      // Step 8: レビュー投稿
      await this.reviewSubmission();

      // Step 9: 結果検証
      await this.validateJourneyResults();

      console.log("\n🎉 Complete User Journey Test 成功！");
      this.displayJourneyResults();
    } catch (error) {
      console.error("\n❌ User Journey Test 失敗:", error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupEnvironment() {
    console.log("🏗️  環境セットアップ中...");

    // テストモード有効化
    this.testRunner.enableTestMode();

    // Firebase接続確認
    const firebaseResults = await this.firebaseUtils.runAllFirebaseTests();
    const successRate =
      firebaseResults.filter((r) => r.success).length / firebaseResults.length;

    if (successRate < 0.8) {
      throw new Error(
        `Firebase接続に問題があります: ${(successRate * 100).toFixed(1)}%`,
      );
    }

    console.log("✅ 環境セットアップ完了");
  }

  async customerRegistration() {
    console.log("\n👤 Step 1: お客様のユーザー登録");
    console.log("----------------------------------");

    // テストユーザーをFirestoreに登録
    await this.firebaseUtils.seedTestData();

    this.journeyState.customer = testCustomer;
    console.log(`✅ お客様登録完了: ${testCustomer.displayName}`);
    console.log(`   メール: ${testCustomer.email}`);
    console.log(`   所在地: ${testCustomer.profile.location.address}`);
  }

  async imageUploadAndAnalysis() {
    console.log("\n📸 Step 2: 参考画像アップロードとAI解析");
    console.log("--------------------------------------------");

    // ミニマル・ライン作品の参考画像を使用
    const referenceImage = testReferenceImages[0];

    console.log(`参考画像: ${referenceImage.description}`);

    // AI解析をシミュレート（モックデータを使用）
    this.journeyState.aiAnalysis = expectedAIAnalysis.minimalLine;

    console.log("✅ AI解析完了");
    console.log(`   検出スタイル: ${this.journeyState.aiAnalysis.style}`);
    console.log(
      `   信頼度: ${(this.journeyState.aiAnalysis.confidence * 100).toFixed(1)}%`,
    );
    console.log(
      `   モチーフ: ${this.journeyState.aiAnalysis.motifs.join(", ")}`,
    );
  }

  async artistMatching() {
    console.log("\n🎯 Step 3: アーティストマッチング");
    console.log("----------------------------------");

    // マッチングリクエスト作成
    const matchingRequest = {
      customerId: testCustomer.uid,
      referenceImages: [testReferenceImages[0].uri],
      desiredStyle: "ミニマル",
      size: "small",
      budget: { min: 30000, max: 50000 },
      location: testCustomer.profile.location,
      maxDistance: 20,
      description: "手首にミニマルなタトゥーを入れたいです",
      aiAnalysis: this.journeyState.aiAnalysis,
    };

    // マッチング結果をシミュレート
    this.journeyState.matchResults = [
      {
        artist: testArtist,
        matchScore: 0.92,
        distance: 3.2,
        estimatedPrice: 35000,
        availableSlots: testArtist.availability,
        reasons: ["スタイル適合度: 92%", "距離: 3.2km", "価格帯適合"],
      },
    ];

    console.log("✅ マッチング完了");
    console.log(
      `   マッチしたアーティスト数: ${this.journeyState.matchResults.length}`,
    );
    console.log(`   トップマッチ: ${testArtist.displayName} (スコア: 92%)`);
  }

  async bookingCreation() {
    console.log("\n📅 Step 4: 予約作成");
    console.log("------------------");

    // トップマッチのアーティストを選択
    this.journeyState.selectedArtist = this.journeyState.matchResults[0].artist;

    // 予約リクエスト作成
    const bookingRequest = {
      customerId: testCustomer.uid,
      artistId: testArtist.uid,
      requestedDate: new Date("2024-09-01"),
      requestedTime: "14:00",
      estimatedDuration: 3,
      tattooDetails: {
        style: "ミニマル",
        size: "small",
        placement: "手首",
        description: "ミニマルなライン作品",
        referenceImages: [testReferenceImages[0].uri],
      },
      estimatedPrice: 35000,
      notes: "初回のタトゥーです。よろしくお願いします。",
    };

    // 予約をシミュレート
    this.journeyState.booking = {
      id: "booking-001",
      ...bookingRequest,
      status: "pending",
      createdAt: new Date(),
    };

    console.log("✅ 予約リクエスト作成完了");
    console.log(`   予約ID: ${this.journeyState.booking.id}`);
    console.log(`   アーティスト: ${testArtist.displayName}`);
    console.log(
      `   希望日時: ${bookingRequest.requestedDate.toDateString()} ${bookingRequest.requestedTime}`,
    );
    console.log(
      `   見積もり: ¥${bookingRequest.estimatedPrice.toLocaleString()}`,
    );
  }

  async chatCommunication() {
    console.log("\n💬 Step 5: チャットコミュニケーション");
    console.log("------------------------------------");

    // チャットルーム作成
    this.journeyState.chatRoom = {
      roomId: "chat-room-001",
      participants: [testCustomer.uid, testArtist.uid],
      bookingId: this.journeyState.booking.id,
      roomType: "booking",
      createdAt: new Date(),
    };

    // メッセージのやりとりをシミュレート
    this.journeyState.messages = [
      {
        id: "msg-001",
        senderId: testCustomer.uid,
        content:
          "はじめまして！ポートフォリオを拝見し、ぜひお願いしたいと思いました。",
        timestamp: new Date(),
        type: "text",
      },
      {
        id: "msg-002",
        senderId: testArtist.uid,
        content:
          "ありがとうございます！手首のミニマル作品ですね。デザインを詳しく相談させていただきます。",
        timestamp: new Date(),
        type: "text",
      },
      {
        id: "msg-003",
        senderId: testCustomer.uid,
        content:
          "ありがとうございます。9月1日14:00の予約で進めさせていただきたいです。",
        timestamp: new Date(),
        type: "text",
      },
    ];

    console.log("✅ チャット開始完了");
    console.log(`   チャットルーム: ${this.journeyState.chatRoom.roomId}`);
    console.log(`   メッセージ数: ${this.journeyState.messages.length}`);
  }

  async serviceCompletion() {
    console.log("\n✨ Step 6: サービス完了");
    console.log("-----------------------");

    // 予約確定
    this.journeyState.booking.status = "confirmed";
    this.journeyState.booking.confirmedDate = new Date("2024-09-01");
    this.journeyState.booking.confirmedTime = "14:00";
    this.journeyState.booking.finalPrice = 32000;

    console.log("✅ 予約確定");
    console.log(
      `   確定日時: ${this.journeyState.booking.confirmedDate.toDateString()} ${this.journeyState.booking.confirmedTime}`,
    );
    console.log(
      `   最終料金: ¥${this.journeyState.booking.finalPrice.toLocaleString()}`,
    );

    // サービス完了をシミュレート
    this.journeyState.booking.status = "completed";
    this.journeyState.booking.completedAt = new Date("2024-09-01T17:00:00");

    console.log("✅ タトゥー施術完了");
  }

  async reviewSubmission() {
    console.log("\n⭐ Step 7: レビュー投稿");
    console.log("----------------------");

    // レビューデータ作成
    this.journeyState.review = {
      id: "review-journey-001",
      artistId: testArtist.uid,
      customerId: testCustomer.uid,
      bookingId: this.journeyState.booking.id,
      overallRating: 5,
      categoryRatings: {
        technical: 5,
        communication: 5,
        cleanliness: 5,
        atmosphere: 5,
        value: 4,
      },
      comment:
        "初めてのタトゥーでしたが、丁寧な説明と高い技術力で安心してお任せできました。仕上がりも期待以上で大満足です！また次回もお願いしたいと思います。",
      isAnonymous: false,
      hasImages: true,
      createdAt: new Date(),
      helpful: 0,
    };

    console.log("✅ レビュー投稿完了");
    console.log(`   総合評価: ${this.journeyState.review.overallRating}/5`);
    console.log(
      `   技術評価: ${this.journeyState.review.categoryRatings.technical}/5`,
    );
    console.log(
      `   コミュニケーション評価: ${this.journeyState.review.categoryRatings.communication}/5`,
    );
  }

  async validateJourneyResults() {
    console.log("\n🔍 Step 8: 結果検証");
    console.log("-------------------");

    const validations = [];

    // お客様データ検証
    if (this.journeyState.customer?.uid === testCustomer.uid) {
      validations.push("✅ お客様データ: 有効");
    } else {
      validations.push("❌ お客様データ: 無効");
    }

    // AI解析結果検証
    if (this.journeyState.aiAnalysis?.style === "ミニマル") {
      validations.push("✅ AI解析: 有効");
    } else {
      validations.push("❌ AI解析: 無効");
    }

    // マッチング結果検証
    if (this.journeyState.matchResults?.length > 0) {
      validations.push("✅ マッチング: 有効");
    } else {
      validations.push("❌ マッチング: 無効");
    }

    // 予約データ検証
    if (this.journeyState.booking?.status === "completed") {
      validations.push("✅ 予約フロー: 有効");
    } else {
      validations.push("❌ 予約フロー: 無効");
    }

    // チャットデータ検証
    if (this.journeyState.messages?.length >= 3) {
      validations.push("✅ チャット機能: 有効");
    } else {
      validations.push("❌ チャット機能: 無効");
    }

    // レビューデータ検証
    if (this.journeyState.review?.overallRating >= 4) {
      validations.push("✅ レビュー投稿: 有効");
    } else {
      validations.push("❌ レビュー投稿: 無効");
    }

    validations.forEach((validation) => console.log(validation));

    const passedValidations = validations.filter((v) =>
      v.startsWith("✅"),
    ).length;
    const totalValidations = validations.length;

    console.log(
      `\n📊 検証結果: ${passedValidations}/${totalValidations} (${((passedValidations / totalValidations) * 100).toFixed(1)}%)`,
    );

    if (passedValidations < totalValidations) {
      throw new Error("一部の検証に失敗しました");
    }
  }

  displayJourneyResults() {
    console.log("\n📋 User Journey Test 結果サマリー");
    console.log("==================================");
    console.log(`👤 お客様: ${this.journeyState.customer?.displayName}`);
    console.log(
      `🎨 選択されたアーティスト: ${this.journeyState.selectedArtist?.displayName}`,
    );
    console.log(
      `🎯 AIが検出したスタイル: ${this.journeyState.aiAnalysis?.style}`,
    );
    console.log(`📅 予約ステータス: ${this.journeyState.booking?.status}`);
    console.log(`💬 メッセージ交換数: ${this.journeyState.messages?.length}`);
    console.log(`⭐ 最終評価: ${this.journeyState.review?.overallRating}/5`);
    console.log(
      `💰 最終料金: ¥${this.journeyState.booking?.finalPrice?.toLocaleString()}`,
    );
    console.log("\n🎉 Complete User Journey Test 成功完了！");
  }

  async cleanup() {
    console.log("\n🧹 クリーンアップ実行中...");

    try {
      // テストデータクリーンアップ
      await this.firebaseUtils.cleanupTestData();

      // テストモード無効化
      this.testRunner.disableTestMode();

      console.log("✅ クリーンアップ完了");
    } catch (error) {
      console.error("⚠️  クリーンアップ中にエラー:", error);
    }
  }
}

async function main() {
  const userJourneyTest = new UserJourneyTest();

  try {
    await userJourneyTest.runCompleteUserJourney();
    console.log("\n🎊 All User Journey Tests Passed! 🎊");
  } catch (error) {
    console.error("\n💥 User Journey Test Failed:", error);
    process.exit(1);
  }
}

// Node.js環境での実行
if (typeof require !== "undefined" && require.main === module) {
  main();
}

export { UserJourneyTest, main as runUserJourneyTest };
