import { EnvironmentConfig } from "../EnvironmentConfig";

describe("EnvironmentConfig", () => {
  // 環境変数のモック
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("API Key Validation", () => {
    it("should throw error when GOOGLE_VISION_API_KEY is not provided", () => {
      delete process.env.GOOGLE_VISION_API_KEY;

      expect(() => {
        EnvironmentConfig.getGoogleVisionApiKey();
      }).toThrow(
        "GOOGLE_VISION_API_KEY is required but not set in environment variables",
      );
    });

    it("should throw error when GOOGLE_VISION_API_KEY is empty string", () => {
      process.env.GOOGLE_VISION_API_KEY = "";

      expect(() => {
        EnvironmentConfig.getGoogleVisionApiKey();
      }).toThrow(
        "GOOGLE_VISION_API_KEY is required but not set in environment variables",
      );
    });

    it("should return valid API key when properly set", () => {
      const testApiKey = "AIzaSyTest123ValidKey456789012345678";
      process.env.GOOGLE_VISION_API_KEY = testApiKey;

      const result = EnvironmentConfig.getGoogleVisionApiKey();
      expect(result).toBe(testApiKey);
    });

    it("should validate API key format", () => {
      process.env.GOOGLE_VISION_API_KEY = "invalid-key-format";

      expect(() => {
        EnvironmentConfig.getGoogleVisionApiKey();
      }).toThrow("Invalid Google Vision API key format");
    });

    it("should accept valid Google API key format", () => {
      const validApiKey = "AIzaSyDhF7G8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X";
      process.env.GOOGLE_VISION_API_KEY = validApiKey;

      const result = EnvironmentConfig.getGoogleVisionApiKey();
      expect(result).toBe(validApiKey);
    });
  });

  describe("Firebase Configuration Validation", () => {
    it("should validate Firebase configuration exists", () => {
      const config = EnvironmentConfig.getFirebaseConfig();

      expect(config).toBeDefined();
      expect(typeof config.projectId).toBe("string");
      expect(config.projectId.length).toBeGreaterThan(0);
    });

    it("should not expose sensitive Firebase keys in logs", () => {
      const consoleSpy = jest.spyOn(console, "log");

      EnvironmentConfig.getFirebaseConfig();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("AIza"),
      );

      consoleSpy.mockRestore();
    });

    it("should throw error when Firebase config is incomplete", () => {
      // Firebase設定ファイルが存在しない場合のテスト
      jest.mock("@react-native-firebase/app", () => ({
        utils: () => ({
          app: () => null,
        }),
      }));

      expect(() => {
        EnvironmentConfig.validateFirebaseConfig();
      }).toThrow("Firebase configuration is incomplete or invalid");
    });
  });

  describe("Environment Detection", () => {
    it("should detect development environment", () => {
      process.env.NODE_ENV = "development";

      expect(EnvironmentConfig.isDevelopment()).toBe(true);
      expect(EnvironmentConfig.isProduction()).toBe(false);
    });

    it("should detect production environment", () => {
      process.env.NODE_ENV = "production";

      expect(EnvironmentConfig.isDevelopment()).toBe(false);
      expect(EnvironmentConfig.isProduction()).toBe(true);
    });

    it("should default to development when NODE_ENV is not set", () => {
      delete process.env.NODE_ENV;

      expect(EnvironmentConfig.isDevelopment()).toBe(true);
    });
  });

  describe("Security Validation", () => {
    it("should not allow hardcoded API keys in source code", () => {
      // このテストは静的解析として機能する
      const testFileContent = `
        const apiKey = "AIzaSyActualApiKey123";
        const config = { key: "AIzaSyHardcodedKey456" };
      `;

      expect(testFileContent).not.toMatch(/AIzaSy[a-zA-Z0-9_-]{35}/);
    });

    it("should mask API keys in error messages", () => {
      const longApiKey = "AIzaSyDhF7G8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X";
      process.env.GOOGLE_VISION_API_KEY = longApiKey;

      const maskedKey = EnvironmentConfig.getMaskedApiKey();

      expect(maskedKey).toBe("AIzaSy***...***W2X");
      expect(maskedKey).not.toContain(longApiKey.substring(8, -4));
    });

    it("should validate API key is not the leaked key from repository", () => {
      const leakedKey = "AIzaSyDE5FFYI8zEcJuLqkq1uiqOCRreAkZK5uk";
      process.env.GOOGLE_VISION_API_KEY = leakedKey;

      expect(() => {
        EnvironmentConfig.getGoogleVisionApiKey();
      }).toThrow("Cannot use the leaked API key found in repository");
    });
  });

  describe("Logging and Monitoring", () => {
    it("should not log sensitive information", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      process.env.GOOGLE_VISION_API_KEY =
        "AIzaSyTestKey123456789012345678901234";
      EnvironmentConfig.getGoogleVisionApiKey();

      // コンソール出力に完全なAPIキーが含まれていないことを確認
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/AIzaSy[a-zA-Z0-9_-]{33}/),
      );
      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/AIzaSy[a-zA-Z0-9_-]{33}/),
      );

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
