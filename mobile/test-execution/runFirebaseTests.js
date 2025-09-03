/**
 * Firebase接続テスト実行スクリプト
 * Tattoo Journey 2.0 Mobile App
 */

import { FirebaseTestUtils } from "../src/test-utils/FirebaseTestUtils.js";

async function main() {
  console.log("🔥 Firebase接続テスト開始");
  console.log("================================\n");

  try {
    const firebaseTestUtils = FirebaseTestUtils.getInstance();

    // テストデータ投入
    console.log("📊 テストデータ投入中...");
    const seedResults = await firebaseTestUtils.seedTestData();
    firebaseTestUtils.displayFirebaseTestResults(seedResults);

    // 全Firebase接続テスト実行
    console.log("🚀 Firebase接続テスト実行中...");
    const testResults = await firebaseTestUtils.runAllFirebaseTests();
    firebaseTestUtils.displayFirebaseTestResults(testResults);

    // テストデータクリーンアップ
    console.log("🧹 テストデータクリーンアップ中...");
    const cleanupResults = await firebaseTestUtils.cleanupTestData();
    firebaseTestUtils.displayFirebaseTestResults(cleanupResults);

    console.log("\n✅ Firebase接続テスト完了");
  } catch (error) {
    console.error("❌ Firebase接続テスト失敗:", error);
    process.exit(1);
  }
}

// Node.js環境での実行
if (typeof require !== "undefined" && require.main === module) {
  main();
}

export { main as runFirebaseTests };
