import { Alert } from "react-native";
import testUsers, {
  testCustomer,
  testArtist,
  competitorArtists,
  testReferenceImages,
} from "../test-data/testUsers";
import mockAIResponses, {
  mockVisionAPIResponses,
  expectedAIAnalysis,
} from "../test-data/mockAIResponses";
import { GoogleVisionService } from "../services/GoogleVisionService";
import { ImageAnalysisService } from "../services/ImageAnalysisService";
import { MatchingService } from "../services/MatchingService";
import { LocationService } from "../services/LocationService";
import { ChatService } from "../services/ChatService";
import { ReviewService } from "../services/ReviewService";
import { BookingService } from "../services/BookingService";
import { AnalyticsService } from "../services/AnalyticsService";
import { CrashlyticsService } from "../services/CrashlyticsService";

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
  error?: Error;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  totalDuration: number;
}

export class TestRunner {
  private static instance: TestRunner;
  private testResults: TestSuite[] = [];
  private isTestMode: boolean = false;

  private constructor() {}

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  /**
   * テストモードを有効にする（モックデータを使用）
   */
  enableTestMode(): void {
    this.isTestMode = true;
    this.setupMocks();
  }

  /**
   * テストモードを無効にする
   */
  disableTestMode(): void {
    this.isTestMode = false;
  }

  /**
   * モックサービスの設定
   */
  private setupMocks(): void {
    // Google Vision API のモック
    const originalAnalyzeImage = GoogleVisionService.getInstance().analyzeImage;
    GoogleVisionService.getInstance().analyzeImage = async (
      imageBase64: string,
    ) => {
      // Base64データに基づいてモックレスポンスを返す
      if (imageBase64.includes("minimal")) {
        return mockVisionAPIResponses.minimalLine;
      } else if (imageBase64.includes("japanese")) {
        return mockVisionAPIResponses.japaneseSakura;
      } else if (imageBase64.includes("script")) {
        return mockVisionAPIResponses.scriptLettering;
      }
      return mockVisionAPIResponses.minimalLine; // デフォルト
    };

    // 位置情報サービスのモック
    const originalGetCurrentLocation =
      LocationService.getInstance().getCurrentLocation;
    LocationService.getInstance().getCurrentLocation = async () => {
      return {
        latitude: testCustomer.profile.location.latitude,
        longitude: testCustomer.profile.location.longitude,
        address: {
          formattedAddress: testCustomer.profile.location.address,
        },
        timestamp: Date.now(),
      };
    };
  }

  /**
   * 単一テストの実行
   */
  private async runSingleTest(
    testName: string,
    testFunction: () => Promise<void>,
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      await testFunction();
      const duration = Date.now() - startTime;

      return {
        testName,
        passed: true,
        details: `Test completed successfully in ${duration}ms`,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        testName,
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * AI画像解析テスト
   */
  async testAIImageAnalysis(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "AI Image Analysis Tests",
      results: [],
      totalTests: 0,
      passedTests: 0,
      totalDuration: 0,
    };

    // テスト1: ミニマル・ライン解析
    const test1 = await this.runSingleTest(
      "Minimal Line Analysis",
      async () => {
        const analysisService = ImageAnalysisService.getInstance();
        const result = await analysisService.analyzeImage(
          testReferenceImages[0].uri,
          "data:image/png;base64,minimal-line-data",
        );

        if (result.style !== "ミニマル") {
          throw new Error(`Expected style 'ミニマル', got '${result.style}'`);
        }
        if (result.isColorful !== false) {
          throw new Error(
            `Expected isColorful to be false, got ${result.isColorful}`,
          );
        }
        if (result.confidence < 0.8) {
          throw new Error(
            `Expected confidence > 0.8, got ${result.confidence}`,
          );
        }
      },
    );

    // テスト2: 和彫り解析
    const test2 = await this.runSingleTest(
      "Japanese Style Analysis",
      async () => {
        const analysisService = ImageAnalysisService.getInstance();
        const result = await analysisService.analyzeImage(
          testReferenceImages[1].uri,
          "data:image/png;base64,japanese-sakura-data",
        );

        if (result.style !== "ジャパニーズ") {
          throw new Error(
            `Expected style 'ジャパニーズ', got '${result.style}'`,
          );
        }
        if (
          !result.motifs.some(
            (motif) => motif.includes("桜") || motif.includes("花"),
          )
        ) {
          throw new Error("Expected motifs to include 桜 or 花");
        }
      },
    );

    // テスト3: レタリング解析
    const test3 = await this.runSingleTest("Lettering Analysis", async () => {
      const analysisService = ImageAnalysisService.getInstance();
      const result = await analysisService.analyzeImage(
        testReferenceImages[2].uri,
        "data:image/png;base64,script-lettering-data",
      );

      if (result.style !== "レタリング") {
        throw new Error(`Expected style 'レタリング', got '${result.style}'`);
      }
      if (
        !result.motifs.some(
          (motif) => motif.includes("文字") || motif.includes("スクリプト"),
        )
      ) {
        throw new Error("Expected motifs to include 文字 or スクリプト");
      }
    });

    suite.results = [test1, test2, test3];
    suite.totalTests = 3;
    suite.passedTests = suite.results.filter((r) => r.passed).length;
    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);

    return suite;
  }

  /**
   * マッチング機能テスト
   */
  async testMatchingFunction(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Matching Function Tests",
      results: [],
      totalTests: 0,
      passedTests: 0,
      totalDuration: 0,
    };

    // テスト1: 基本マッチング
    const test1 = await this.runSingleTest("Basic Matching", async () => {
      const matchingService = MatchingService.getInstance();

      const matchingRequest = {
        customerId: testCustomer.uid,
        referenceImages: [testReferenceImages[0].uri],
        desiredStyle: "ミニマル" as const,
        size: "small" as const,
        budget: { min: 30000, max: 50000 },
        location: testCustomer.profile.location,
        maxDistance: 20,
        description: "手首にミニマルなタトゥーを入れたいです",
        aiAnalysis: expectedAIAnalysis.minimalLine,
      };

      const results =
        await matchingService.findMatchingArtists(matchingRequest);

      if (results.length === 0) {
        throw new Error("No matching artists found");
      }
      if (results[0].matchScore < 0.5) {
        throw new Error(`Low match score: ${results[0].matchScore}`);
      }
    });

    // テスト2: 距離フィルタリング
    const test2 = await this.runSingleTest("Distance Filtering", async () => {
      const matchingService = MatchingService.getInstance();

      const matchingRequest = {
        customerId: testCustomer.uid,
        referenceImages: [testReferenceImages[0].uri],
        desiredStyle: "ミニマル" as const,
        size: "small" as const,
        budget: { min: 30000, max: 50000 },
        location: testCustomer.profile.location,
        maxDistance: 5, // 5km以内
        description: "テスト",
        aiAnalysis: expectedAIAnalysis.minimalLine,
      };

      const results =
        await matchingService.findMatchingArtists(matchingRequest);

      // 5km以内のアーティストのみが返されることを確認
      for (const result of results) {
        if (result.distance > 5) {
          throw new Error(
            `Artist found outside distance limit: ${result.distance}km`,
          );
        }
      }
    });

    // テスト3: 価格フィルタリング
    const test3 = await this.runSingleTest("Price Filtering", async () => {
      const matchingService = MatchingService.getInstance();

      const matchingRequest = {
        customerId: testCustomer.uid,
        referenceImages: [testReferenceImages[0].uri],
        desiredStyle: "ミニマル" as const,
        size: "small" as const,
        budget: { min: 20000, max: 40000 },
        location: testCustomer.profile.location,
        maxDistance: 50,
        description: "テスト",
        aiAnalysis: expectedAIAnalysis.minimalLine,
      };

      const results =
        await matchingService.findMatchingArtists(matchingRequest);

      // 予算内の見積もりのみが返されることを確認
      for (const result of results) {
        if (result.estimatedPrice > 40000) {
          throw new Error(
            `Estimated price exceeds budget: ¥${result.estimatedPrice}`,
          );
        }
      }
    });

    suite.results = [test1, test2, test3];
    suite.totalTests = 3;
    suite.passedTests = suite.results.filter((r) => r.passed).length;
    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);

    return suite;
  }

  /**
   * 予約フローテスト
   */
  async testBookingFlow(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Booking Flow Tests",
      results: [],
      totalTests: 0,
      passedTests: 0,
      totalDuration: 0,
    };

    // テスト1: 予約リクエスト作成
    const test1 = await this.runSingleTest(
      "Create Booking Request",
      async () => {
        const bookingService = BookingService.getInstance();

        const bookingRequest = {
          customerId: testCustomer.uid,
          artistId: testArtist.uid,
          requestedDate: new Date("2024-09-01"),
          requestedTime: "14:00",
          estimatedDuration: 3,
          tattooDetails: {
            style: "ミニマル" as const,
            size: "small" as const,
            placement: "手首",
            description: "ミニマルなライン作品",
            referenceImages: [testReferenceImages[0].uri],
          },
          estimatedPrice: 35000,
          notes: "初回のタトゥーです。よろしくお願いします。",
        };

        const booking =
          await bookingService.createBookingRequest(bookingRequest);

        if (!booking.id) {
          throw new Error("Booking ID not generated");
        }
        if (booking.status !== "pending") {
          throw new Error(`Expected status 'pending', got '${booking.status}'`);
        }
      },
    );

    // テスト2: 予約確認
    const test2 = await this.runSingleTest("Confirm Booking", async () => {
      const bookingService = BookingService.getInstance();

      // まず予約を作成
      const bookingRequest = {
        customerId: testCustomer.uid,
        artistId: testArtist.uid,
        requestedDate: new Date("2024-09-02"),
        requestedTime: "10:00",
        estimatedDuration: 2,
        tattooDetails: {
          style: "ミニマル" as const,
          size: "small" as const,
          placement: "手首",
          description: "テスト予約",
          referenceImages: [],
        },
        estimatedPrice: 30000,
        notes: "テスト",
      };

      const booking = await bookingService.createBookingRequest(bookingRequest);

      // 予約を確認
      const confirmedBooking = await bookingService.confirmBooking(
        booking.id,
        testArtist.uid,
        {
          finalPrice: 32000,
          confirmedDate: new Date("2024-09-02"),
          confirmedTime: "10:30",
          duration: 2.5,
          notes: "少し時間を調整させていただきました",
        },
      );

      if (confirmedBooking.status !== "confirmed") {
        throw new Error(
          `Expected status 'confirmed', got '${confirmedBooking.status}'`,
        );
      }
    });

    suite.results = [test1, test2];
    suite.totalTests = 2;
    suite.passedTests = suite.results.filter((r) => r.passed).length;
    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);

    return suite;
  }

  /**
   * チャット機能テスト
   */
  async testChatFunction(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Chat Function Tests",
      results: [],
      totalTests: 0,
      passedTests: 0,
      totalDuration: 0,
    };

    // テスト1: チャットルーム作成
    const test1 = await this.runSingleTest("Create Chat Room", async () => {
      const chatService = ChatService.getInstance();

      const roomData = {
        participants: [testCustomer.uid, testArtist.uid],
        bookingId: "test-booking-001",
        roomType: "booking" as const,
      };

      const room = await chatService.createChatRoom(roomData);

      if (!room.roomId) {
        throw new Error("Chat room ID not generated");
      }
      if (room.participants.length !== 2) {
        throw new Error(
          `Expected 2 participants, got ${room.participants.length}`,
        );
      }
    });

    // テスト2: メッセージ送信
    const test2 = await this.runSingleTest("Send Message", async () => {
      const chatService = ChatService.getInstance();

      const roomData = {
        participants: [testCustomer.uid, testArtist.uid],
        bookingId: "test-booking-002",
        roomType: "booking" as const,
      };

      const room = await chatService.createChatRoom(roomData);

      const message = await chatService.sendMessage(
        room.roomId,
        testCustomer.uid,
        {
          type: "text",
          content: "はじめまして！よろしくお願いします。",
        },
      );

      if (!message.messageId) {
        throw new Error("Message ID not generated");
      }
      if (message.senderId !== testCustomer.uid) {
        throw new Error("Incorrect sender ID");
      }
    });

    suite.results = [test1, test2];
    suite.totalTests = 2;
    suite.passedTests = suite.results.filter((r) => r.passed).length;
    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);

    return suite;
  }

  /**
   * レビュー機能テスト
   */
  async testReviewFunction(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Review Function Tests",
      results: [],
      totalTests: 0,
      passedTests: 0,
      totalDuration: 0,
    };

    // テスト1: レビュー投稿
    const test1 = await this.runSingleTest("Submit Review", async () => {
      const reviewService = ReviewService.getInstance();

      const reviewData = {
        artistId: testArtist.uid,
        customerId: testCustomer.uid,
        bookingId: "test-booking-003",
        overallRating: 5,
        categoryRatings: {
          technical: 5,
          communication: 4,
          cleanliness: 5,
          atmosphere: 5,
          value: 4,
        },
        comment: "とても満足しています！",
        images: [],
        isAnonymous: false,
      };

      const review = await reviewService.submitReview(reviewData);

      if (!review.reviewId) {
        throw new Error("Review ID not generated");
      }
      if (review.overallRating !== 5) {
        throw new Error(`Expected rating 5, got ${review.overallRating}`);
      }
    });

    // テスト2: レビュー取得
    const test2 = await this.runSingleTest("Get Artist Reviews", async () => {
      const reviewService = ReviewService.getInstance();

      const reviews = await reviewService.getArtistReviews(testArtist.uid, {
        limit: 10,
        offset: 0,
      });

      if (!Array.isArray(reviews)) {
        throw new Error("Expected reviews array");
      }
      // 少なくとも先ほど投稿したレビューが含まれているはず
      if (reviews.length === 0) {
        throw new Error("No reviews found");
      }
    });

    suite.results = [test1, test2];
    suite.totalTests = 2;
    suite.passedTests = suite.results.filter((r) => r.passed).length;
    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);

    return suite;
  }

  /**
   * 位置情報・地図機能テスト
   */
  async testLocationFunction(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: "Location Function Tests",
      results: [],
      totalTests: 0,
      passedTests: 0,
      totalDuration: 0,
    };

    // テスト1: 現在位置取得
    const test1 = await this.runSingleTest("Get Current Location", async () => {
      const locationService = LocationService.getInstance();

      const location = await locationService.getCurrentLocation();

      if (!location.latitude || !location.longitude) {
        throw new Error("Location coordinates not obtained");
      }
      if (
        Math.abs(location.latitude - testCustomer.profile.location.latitude) >
        0.1
      ) {
        throw new Error("Unexpected latitude value");
      }
    });

    // テスト2: 距離計算
    const test2 = await this.runSingleTest("Calculate Distance", async () => {
      const locationService = LocationService.getInstance();

      const distance = locationService.calculateDistance(
        testCustomer.profile.location.latitude,
        testCustomer.profile.location.longitude,
        testArtist.profile.location.latitude,
        testArtist.profile.location.longitude,
      );

      if (distance < 0) {
        throw new Error("Distance should be positive");
      }
      if (distance > 50) {
        throw new Error("Distance seems unreasonably large for Tokyo area");
      }
    });

    suite.results = [test1, test2];
    suite.totalTests = 2;
    suite.passedTests = suite.results.filter((r) => r.passed).length;
    suite.totalDuration = suite.results.reduce((sum, r) => sum + r.duration, 0);

    return suite;
  }

  /**
   * 全テストスイートを実行
   */
  async runAllTests(): Promise<void> {
    this.enableTestMode();
    this.testResults = [];

    console.log("🧪 Starting Tattoo Journey 2.0 End-to-End Tests...");

    try {
      // AI画像解析テスト
      const aiTest = await this.testAIImageAnalysis();
      this.testResults.push(aiTest);

      // マッチング機能テスト
      const matchingTest = await this.testMatchingFunction();
      this.testResults.push(matchingTest);

      // 予約フローテスト
      const bookingTest = await this.testBookingFlow();
      this.testResults.push(bookingTest);

      // チャット機能テスト
      const chatTest = await this.testChatFunction();
      this.testResults.push(chatTest);

      // レビュー機能テスト
      const reviewTest = await this.testReviewFunction();
      this.testResults.push(reviewTest);

      // 位置情報テスト
      const locationTest = await this.testLocationFunction();
      this.testResults.push(locationTest);

      // テスト結果の表示
      this.displayTestResults();
    } catch (error) {
      console.error("❌ Test execution failed:", error);
      Alert.alert("Test Error", `Test execution failed: ${error}`);
    } finally {
      this.disableTestMode();
    }
  }

  /**
   * テスト結果の表示
   */
  private displayTestResults(): void {
    const totalTests = this.testResults.reduce(
      (sum, suite) => sum + suite.totalTests,
      0,
    );
    const totalPassed = this.testResults.reduce(
      (sum, suite) => sum + suite.passedTests,
      0,
    );
    const totalDuration = this.testResults.reduce(
      (sum, suite) => sum + suite.totalDuration,
      0,
    );

    const successRate =
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0";

    let summary = `📊 Test Results Summary\n`;
    summary += `Total Tests: ${totalTests}\n`;
    summary += `Passed: ${totalPassed}\n`;
    summary += `Failed: ${totalTests - totalPassed}\n`;
    summary += `Success Rate: ${successRate}%\n`;
    summary += `Total Duration: ${totalDuration}ms\n\n`;

    // 各テストスイートの結果
    for (const suite of this.testResults) {
      summary += `📂 ${suite.suiteName}\n`;
      summary += `  Passed: ${suite.passedTests}/${suite.totalTests}\n`;

      for (const result of suite.results) {
        const status = result.passed ? "✅" : "❌";
        summary += `  ${status} ${result.testName}\n`;
        if (!result.passed && result.error) {
          summary += `    Error: ${result.error.message}\n`;
        }
      }
      summary += "\n";
    }

    console.log(summary);

    // ユーザーにもテスト結果を表示
    const alertTitle =
      totalPassed === totalTests
        ? "🎉 All Tests Passed!"
        : "⚠️ Some Tests Failed";
    Alert.alert(
      alertTitle,
      `${totalPassed}/${totalTests} tests passed (${successRate}%)\n\nCheck console for detailed results.`,
      [{ text: "OK" }],
    );
  }

  /**
   * 個別のテストスイートを実行
   */
  async runSingleTestSuite(suiteName: string): Promise<void> {
    this.enableTestMode();

    try {
      let suite: TestSuite;

      switch (suiteName) {
        case "ai":
          suite = await this.testAIImageAnalysis();
          break;
        case "matching":
          suite = await this.testMatchingFunction();
          break;
        case "booking":
          suite = await this.testBookingFlow();
          break;
        case "chat":
          suite = await this.testChatFunction();
          break;
        case "review":
          suite = await this.testReviewFunction();
          break;
        case "location":
          suite = await this.testLocationFunction();
          break;
        default:
          throw new Error(`Unknown test suite: ${suiteName}`);
      }

      console.log(`Test suite '${suite.suiteName}' completed:`);
      console.log(`Passed: ${suite.passedTests}/${suite.totalTests}`);

      Alert.alert(
        "Test Complete",
        `${suite.suiteName}\nPassed: ${suite.passedTests}/${suite.totalTests}`,
      );
    } catch (error) {
      console.error(`Test suite '${suiteName}' failed:`, error);
      Alert.alert("Test Error", `Test suite failed: ${error}`);
    } finally {
      this.disableTestMode();
    }
  }
}

export default TestRunner;
