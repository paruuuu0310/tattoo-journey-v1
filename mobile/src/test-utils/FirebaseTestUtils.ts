import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import database from "@react-native-firebase/database";
import auth from "@react-native-firebase/auth";
import {
  testCustomer,
  testArtist,
  testPortfolioItems,
  testReviews,
} from "../test-data/testUsers";

interface FirebaseTestResult {
  service: string;
  operation: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export class FirebaseTestUtils {
  private static instance: FirebaseTestUtils;

  private constructor() {}

  public static getInstance(): FirebaseTestUtils {
    if (!FirebaseTestUtils.instance) {
      FirebaseTestUtils.instance = new FirebaseTestUtils();
    }
    return FirebaseTestUtils.instance;
  }

  /**
   * Firebase Firestore 接続テスト
   */
  async testFirestoreConnection(): Promise<FirebaseTestResult[]> {
    const results: FirebaseTestResult[] = [];
    const testCollectionRef = firestore().collection("test");

    // テスト1: Firestore 書き込み
    const writeStartTime = Date.now();
    try {
      const testDoc = {
        testId: `test-${Date.now()}`,
        message: "Hello from Tattoo Journey Test",
        timestamp: firestore.FieldValue.serverTimestamp(),
        testUser: testCustomer.uid,
      };

      const docRef = await testCollectionRef.add(testDoc);

      results.push({
        service: "Firestore",
        operation: "Write Document",
        success: true,
        duration: Date.now() - writeStartTime,
        data: { docId: docRef.id },
      });

      // テスト2: Firestore 読み込み
      const readStartTime = Date.now();
      const doc = await docRef.get();
      const data = doc.data();

      if (doc.exists && data?.testId) {
        results.push({
          service: "Firestore",
          operation: "Read Document",
          success: true,
          duration: Date.now() - readStartTime,
          data: { exists: doc.exists, hasData: !!data },
        });
      } else {
        results.push({
          service: "Firestore",
          operation: "Read Document",
          success: false,
          duration: Date.now() - readStartTime,
          error: "Document not found or invalid data",
        });
      }

      // テスト3: Firestore 更新
      const updateStartTime = Date.now();
      await docRef.update({
        updated: true,
        updateTime: firestore.FieldValue.serverTimestamp(),
      });

      results.push({
        service: "Firestore",
        operation: "Update Document",
        success: true,
        duration: Date.now() - updateStartTime,
      });

      // テスト4: Firestore クエリ
      const queryStartTime = Date.now();
      const querySnapshot = await testCollectionRef
        .where("testUser", "==", testCustomer.uid)
        .limit(1)
        .get();

      results.push({
        service: "Firestore",
        operation: "Query Documents",
        success: !querySnapshot.empty,
        duration: Date.now() - queryStartTime,
        data: { resultCount: querySnapshot.size },
      });

      // テスト5: Firestore 削除
      const deleteStartTime = Date.now();
      await docRef.delete();

      results.push({
        service: "Firestore",
        operation: "Delete Document",
        success: true,
        duration: Date.now() - deleteStartTime,
      });
    } catch (error) {
      results.push({
        service: "Firestore",
        operation: "Connection Test",
        success: false,
        duration: Date.now() - writeStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return results;
  }

  /**
   * Firebase Realtime Database 接続テスト
   */
  async testRealtimeDatabaseConnection(): Promise<FirebaseTestResult[]> {
    const results: FirebaseTestResult[] = [];
    const testRef = database().ref(`test/${testCustomer.uid}`);

    // テスト1: Realtime Database 書き込み
    const writeStartTime = Date.now();
    try {
      const testData = {
        testId: `test-${Date.now()}`,
        message: "Realtime Database Test",
        timestamp: database.ServerValue.TIMESTAMP,
      };

      await testRef.set(testData);

      results.push({
        service: "Realtime Database",
        operation: "Write Data",
        success: true,
        duration: Date.now() - writeStartTime,
      });

      // テスト2: Realtime Database 読み込み
      const readStartTime = Date.now();
      const snapshot = await testRef.once("value");
      const data = snapshot.val();

      results.push({
        service: "Realtime Database",
        operation: "Read Data",
        success: snapshot.exists() && data?.testId,
        duration: Date.now() - readStartTime,
        data: { exists: snapshot.exists(), hasTestId: !!data?.testId },
      });

      // テスト3: Realtime Database リスナー
      const listenerStartTime = Date.now();
      const unsubscribe = testRef.on("value", (snapshot) => {
        const data = snapshot.val();

        results.push({
          service: "Realtime Database",
          operation: "Real-time Listener",
          success: snapshot.exists() && !!data,
          duration: Date.now() - listenerStartTime,
        });

        unsubscribe();
      });

      // テスト4: Realtime Database 削除
      const deleteStartTime = Date.now();
      await testRef.remove();

      results.push({
        service: "Realtime Database",
        operation: "Delete Data",
        success: true,
        duration: Date.now() - deleteStartTime,
      });
    } catch (error) {
      results.push({
        service: "Realtime Database",
        operation: "Connection Test",
        success: false,
        duration: Date.now() - writeStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return results;
  }

  /**
   * Firebase Storage 接続テスト
   */
  async testStorageConnection(): Promise<FirebaseTestResult[]> {
    const results: FirebaseTestResult[] = [];

    // テスト用のダミーファイル（小さなテキストファイル）
    const testFileContent = "This is a test file for Tattoo Journey 2.0";
    const testFileName = `test-${Date.now()}.txt`;
    const storageRef = storage().ref(`test/${testFileName}`);

    // テスト1: Storage アップロード
    const uploadStartTime = Date.now();
    try {
      const uploadTask = storageRef.putString(testFileContent, "raw");
      const snapshot = await uploadTask;

      results.push({
        service: "Storage",
        operation: "Upload File",
        success: true,
        duration: Date.now() - uploadStartTime,
        data: {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        },
      });

      // テスト2: Storage ダウンロードURL取得
      const urlStartTime = Date.now();
      const downloadURL = await storageRef.getDownloadURL();

      results.push({
        service: "Storage",
        operation: "Get Download URL",
        success: !!downloadURL,
        duration: Date.now() - urlStartTime,
        data: { hasUrl: !!downloadURL },
      });

      // テスト3: Storage メタデータ取得
      const metadataStartTime = Date.now();
      const metadata = await storageRef.getMetadata();

      results.push({
        service: "Storage",
        operation: "Get Metadata",
        success: !!metadata,
        duration: Date.now() - metadataStartTime,
        data: {
          size: metadata.size,
          contentType: metadata.contentType,
        },
      });

      // テスト4: Storage ファイル削除
      const deleteStartTime = Date.now();
      await storageRef.delete();

      results.push({
        service: "Storage",
        operation: "Delete File",
        success: true,
        duration: Date.now() - deleteStartTime,
      });
    } catch (error) {
      results.push({
        service: "Storage",
        operation: "Connection Test",
        success: false,
        duration: Date.now() - uploadStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return results;
  }

  /**
   * Firebase Authentication テスト
   */
  async testAuthConnection(): Promise<FirebaseTestResult[]> {
    const results: FirebaseTestResult[] = [];

    // テスト1: 匿名認証
    const authStartTime = Date.now();
    try {
      const userCredential = await auth().signInAnonymously();
      const user = userCredential.user;

      results.push({
        service: "Authentication",
        operation: "Anonymous Sign In",
        success: !!user,
        duration: Date.now() - authStartTime,
        data: { uid: user?.uid, isAnonymous: user?.isAnonymous },
      });

      // テスト2: ユーザー状態確認
      const stateStartTime = Date.now();
      const currentUser = auth().currentUser;

      results.push({
        service: "Authentication",
        operation: "Get Current User",
        success: !!currentUser,
        duration: Date.now() - stateStartTime,
        data: { hasCurrentUser: !!currentUser },
      });

      // テスト3: サインアウト
      const signOutStartTime = Date.now();
      await auth().signOut();

      results.push({
        service: "Authentication",
        operation: "Sign Out",
        success: true,
        duration: Date.now() - signOutStartTime,
      });
    } catch (error) {
      results.push({
        service: "Authentication",
        operation: "Connection Test",
        success: false,
        duration: Date.now() - authStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return results;
  }

  /**
   * テストデータの投入
   */
  async seedTestData(): Promise<FirebaseTestResult[]> {
    const results: FirebaseTestResult[] = [];

    // テストユーザーデータの投入
    const userDataStartTime = Date.now();
    try {
      // お客様データ
      await firestore()
        .collection("users")
        .doc(testCustomer.uid)
        .set({
          ...testCustomer,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // アーティストデータ
      await firestore()
        .collection("users")
        .doc(testArtist.uid)
        .set({
          ...testArtist,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      results.push({
        service: "Firestore",
        operation: "Seed User Data",
        success: true,
        duration: Date.now() - userDataStartTime,
      });

      // ポートフォリオデータの投入
      const portfolioStartTime = Date.now();
      const batch = firestore().batch();

      testPortfolioItems.forEach((item) => {
        const docRef = firestore().collection("portfolios").doc(item.id);

        batch.set(docRef, {
          ...item,
          artistId: testArtist.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      results.push({
        service: "Firestore",
        operation: "Seed Portfolio Data",
        success: true,
        duration: Date.now() - portfolioStartTime,
        data: { itemCount: testPortfolioItems.length },
      });

      // レビューデータの投入
      const reviewStartTime = Date.now();
      for (const review of testReviews) {
        await firestore()
          .collection("reviews")
          .doc(review.id)
          .set({
            ...review,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      results.push({
        service: "Firestore",
        operation: "Seed Review Data",
        success: true,
        duration: Date.now() - reviewStartTime,
        data: { reviewCount: testReviews.length },
      });
    } catch (error) {
      results.push({
        service: "Firestore",
        operation: "Seed Test Data",
        success: false,
        duration: Date.now() - userDataStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return results;
  }

  /**
   * テストデータの削除
   */
  async cleanupTestData(): Promise<FirebaseTestResult[]> {
    const results: FirebaseTestResult[] = [];

    const cleanupStartTime = Date.now();
    try {
      const batch = firestore().batch();

      // テストユーザーの削除
      batch.delete(firestore().collection("users").doc(testCustomer.uid));
      batch.delete(firestore().collection("users").doc(testArtist.uid));

      // テストポートフォリオの削除
      testPortfolioItems.forEach((item) => {
        batch.delete(firestore().collection("portfolios").doc(item.id));
      });

      // テストレビューの削除
      testReviews.forEach((review) => {
        batch.delete(firestore().collection("reviews").doc(review.id));
      });

      await batch.commit();

      results.push({
        service: "Firestore",
        operation: "Cleanup Test Data",
        success: true,
        duration: Date.now() - cleanupStartTime,
      });
    } catch (error) {
      results.push({
        service: "Firestore",
        operation: "Cleanup Test Data",
        success: false,
        duration: Date.now() - cleanupStartTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return results;
  }

  /**
   * 全Firebase接続テストを実行
   */
  async runAllFirebaseTests(): Promise<FirebaseTestResult[]> {
    const allResults: FirebaseTestResult[] = [];

    console.log("🔥 Starting Firebase Connection Tests...");

    // Firestore テスト
    const firestoreResults = await this.testFirestoreConnection();
    allResults.push(...firestoreResults);

    // Realtime Database テスト
    const realtimeResults = await this.testRealtimeDatabaseConnection();
    allResults.push(...realtimeResults);

    // Storage テスト
    const storageResults = await this.testStorageConnection();
    allResults.push(...storageResults);

    // Authentication テスト
    const authResults = await this.testAuthConnection();
    allResults.push(...authResults);

    return allResults;
  }

  /**
   * Firebase テスト結果の表示
   */
  displayFirebaseTestResults(results: FirebaseTestResult[]): void {
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.success).length;
    const successRate =
      totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0";

    let summary = `🔥 Firebase Test Results\n`;
    summary += `Total Tests: ${totalTests}\n`;
    summary += `Passed: ${passedTests}\n`;
    summary += `Failed: ${totalTests - passedTests}\n`;
    summary += `Success Rate: ${successRate}%\n\n`;

    // サービス別グループ化
    const serviceGroups = results.reduce(
      (groups, result) => {
        if (!groups[result.service]) {
          groups[result.service] = [];
        }
        groups[result.service].push(result);
        return groups;
      },
      {} as Record<string, FirebaseTestResult[]>,
    );

    for (const [service, serviceResults] of Object.entries(serviceGroups)) {
      summary += `📂 ${service}\n`;

      for (const result of serviceResults) {
        const status = result.success ? "✅" : "❌";
        summary += `  ${status} ${result.operation} (${result.duration}ms)\n`;

        if (!result.success && result.error) {
          summary += `    Error: ${result.error}\n`;
        }

        if (result.data) {
          summary += `    Data: ${JSON.stringify(result.data)}\n`;
        }
      }
      summary += "\n";
    }

    console.log(summary);
  }
}

export default FirebaseTestUtils;
