// Firebase import - テスト環境では自動的にモックが使用される
let firebase: any;
try {
  firebase = require("@react-native-firebase/app").firebase;
} catch (error) {
  // テスト環境やFirebaseが利用できない場合のフォールバック
  firebase = {
    app: () => ({
      options: {
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.FIREBASE_APP_ID || "",
      },
    }),
  };
}

export class EnvironmentConfig {
  private static readonly GOOGLE_API_KEY_PATTERN =
    /^AIzaSy[a-zA-Z0-9_-]{33,39}$/;
  private static readonly LEAKED_API_KEYS = [
    "AIzaSyDE5FFYI8zEcJuLqkq1uiqOCRreAkZK5uk", // 無効化済み - Android
    "AIzaSyB4bUcAa9yPF0-AdpVB3_uPtA33Q5lG6NY", // 無効化済み - iOS
  ];

  /**
   * Google Vision APIキーを環境変数から取得
   * セキュリティチェック付き
   */
  static getGoogleVisionApiKey(): string {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    // APIキーの存在確認
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "GOOGLE_VISION_API_KEY is required but not set in environment variables",
      );
    }

    // APIキー形式の検証
    if (!this.GOOGLE_API_KEY_PATTERN.test(apiKey)) {
      throw new Error("Invalid Google Vision API key format");
    }

    // 漏洩したAPIキーの使用禁止
    if (this.LEAKED_API_KEYS.includes(apiKey)) {
      throw new Error("Cannot use the leaked API key found in repository");
    }

    return apiKey;
  }

  /**
   * Firebase設定を取得
   * センシティブ情報のログ出力を防止
   */
  static getFirebaseConfig() {
    try {
      const app = firebase.app();
      const config = {
        projectId: app.options.projectId || "",
        storageBucket: app.options.storageBucket || "",
        messagingSenderId: app.options.messagingSenderId || "",
        appId: app.options.appId || "",
        // APIキーはログに出力されないよう除外
      };

      if (!config.projectId) {
        throw new Error("Firebase configuration is incomplete or invalid");
      }

      return config;
    } catch (error) {
      throw new Error("Firebase configuration is incomplete or invalid");
    }
  }

  /**
   * Firebase設定の検証
   */
  static validateFirebaseConfig(): void {
    try {
      const config = this.getFirebaseConfig();

      if (!config.projectId || !config.appId) {
        throw new Error("Firebase configuration is incomplete or invalid");
      }
    } catch (error) {
      throw new Error("Firebase configuration is incomplete or invalid");
    }
  }

  /**
   * 開発環境の判定
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV !== "production";
  }

  /**
   * 本番環境の判定
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  /**
   * APIキーをマスクして安全に表示
   */
  static getMaskedApiKey(): string {
    try {
      const apiKey = this.getGoogleVisionApiKey();
      if (apiKey.length < 12) return "***";

      return `${apiKey.substring(0, 6)}***...***${apiKey.substring(apiKey.length - 4)}`;
    } catch (error) {
      return "***KEY_NOT_SET***";
    }
  }

  /**
   * 環境変数の設定状況を安全に確認
   */
  static getConfigStatus() {
    return {
      googleVisionApiKey: !!process.env.GOOGLE_VISION_API_KEY,
      nodeEnv: process.env.NODE_ENV || "development",
      isProduction: this.isProduction(),
      // APIキーの値は絶対に返さない
    };
  }

  /**
   * セキュリティチェック付きで環境変数を初期化
   */
  static validateEnvironment(): void {
    if (this.isProduction()) {
      // 本番環境では必須のAPIキーをチェック
      this.getGoogleVisionApiKey();
      this.validateFirebaseConfig();
    } else {
      // 開発環境では警告のみ
      try {
        this.getGoogleVisionApiKey();
      } catch (error) {
        console.warn("⚠️  Development: Google Vision API key not configured");
      }
    }
  }

  /**
   * 開発用のモック設定を提供（テスト環境でのみ使用）
   */
  static setMockApiKey(mockKey: string): void {
    if (process.env.NODE_ENV === "test") {
      process.env.GOOGLE_VISION_API_KEY = mockKey;
    } else {
      throw new Error("Mock API key can only be set in test environment");
    }
  }
}

// 初期化時に環境変数を検証
if (typeof jest === "undefined") {
  // Jest環境以外で実行時のみ検証
  EnvironmentConfig.validateEnvironment();
}
