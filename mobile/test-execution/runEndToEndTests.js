/**
 * エンドツーエンドテスト実行スクリプト
 * Tattoo Journey 2.0 Mobile App
 */

import { TestRunner } from "../src/test-utils/TestRunner";
import { FirebaseTestUtils } from "../src/test-utils/FirebaseTestUtils";

async function main() {
  console.log("🧪 エンドツーエンドテスト開始");
  console.log("================================\n");

  let testRunner;
  let firebaseTestUtils;

  try {
    // テストランナーとFirebaseテストユーティリティ初期化
    testRunner = TestRunner.getInstance();
    firebaseTestUtils = FirebaseTestUtils.getInstance();

    // Phase 1: Firebase接続テスト
    console.log("📋 Phase 1: Firebase接続とデータ永続化テスト");
    console.log("-----------------------------------------------");

    const firebaseResults = await firebaseTestUtils.runAllFirebaseTests();
    firebaseTestUtils.displayFirebaseTestResults(firebaseResults);

    const firebaseSuccessRate =
      firebaseResults.filter((r) => r.success).length / firebaseResults.length;
    if (firebaseSuccessRate < 0.8) {
      throw new Error(
        `Firebase接続テスト成功率が低すぎます: ${(firebaseSuccessRate * 100).toFixed(1)}%`,
      );
    }

    // Phase 2: アプリケーション機能テスト
    console.log("\n📋 Phase 2: アプリケーション機能テスト");
    console.log("-----------------------------------------------");

    await testRunner.runAllTests();

    // Phase 3: データ整合性テスト
    console.log("\n📋 Phase 3: データ整合性確認");
    console.log("-----------------------------------------------");

    const seedResults = await firebaseTestUtils.seedTestData();
    console.log("✅ テストデータ投入完了");

    // 実際のテストランナーでデータ取得テスト
    const testSuites = [
      "ai", // AI画像解析
      "matching", // マッチング機能
      "booking", // 予約フロー
      "chat", // チャット機能
      "review", // レビュー機能
      "location", // 位置情報
    ];

    for (const suite of testSuites) {
      console.log(`\n🔍 ${suite} テストスイート実行中...`);
      await testRunner.runSingleTestSuite(suite);
    }

    // Phase 4: クリーンアップ
    console.log("\n📋 Phase 4: テストデータクリーンアップ");
    console.log("-----------------------------------------------");

    const cleanupResults = await firebaseTestUtils.cleanupTestData();
    firebaseTestUtils.displayFirebaseTestResults(cleanupResults);

    console.log("\n🎉 全テスト完了！");
    console.log("================================");
    console.log("✅ Firebase接続テスト: 完了");
    console.log("✅ アプリケーション機能テスト: 完了");
    console.log("✅ データ整合性テスト: 完了");
    console.log("✅ クリーンアップ: 完了");
  } catch (error) {
    console.error("\n❌ エンドツーエンドテスト失敗:", error);

    // エラー発生時もクリーンアップ実行
    if (firebaseTestUtils) {
      try {
        console.log("\n🧹 エラー発生のため緊急クリーンアップ実行...");
        await firebaseTestUtils.cleanupTestData();
      } catch (cleanupError) {
        console.error("クリーンアップにも失敗:", cleanupError);
      }
    }

    process.exit(1);
  }
}

// Node.js環境での実行
if (typeof require !== "undefined" && require.main === module) {
  main();
}

export { main as runEndToEndTests };
