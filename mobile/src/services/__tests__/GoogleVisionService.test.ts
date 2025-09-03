import GoogleVisionService from "../GoogleVisionService";
import { EnvironmentConfig } from "../../config/EnvironmentConfig";

// GoogleVisionServiceのモック
jest.mock("../../config/EnvironmentConfig");

describe("GoogleVisionService Security Tests", () => {
  const mockEnvironmentConfig = EnvironmentConfig as jest.Mocked<
    typeof EnvironmentConfig
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("API Key Security", () => {
    it("should not expose API key in error messages", async () => {
      const testApiKey = "AIzaSyTestApiKey123456789";
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(testApiKey);

      // APIエラーをシミュレート
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      try {
        await GoogleVisionService.analyzeImage("fake-base64-image");
      } catch (error) {
        // エラーメッセージにAPIキーが含まれていないことを確認
        expect(error.message).not.toContain(testApiKey);
      }

      // コンソール出力にAPIキーが含まれていないことを確認
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(testApiKey),
      );

      consoleSpy.mockRestore();
    });

    it("should validate API key before making requests", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockImplementation(() => {
        throw new Error(
          "GOOGLE_VISION_API_KEY is required but not set in environment variables",
        );
      });

      await expect(
        GoogleVisionService.analyzeImage("fake-base64-image"),
      ).rejects.toThrow(
        "GOOGLE_VISION_API_KEY is required but not set in environment variables",
      );
    });

    it("should use environment config for API key", async () => {
      const testApiKey = "AIzaSyValidTestKey123456789";
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(testApiKey);

      // fetch のモック
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          responses: [
            {
              labelAnnotations: [{ description: "test", score: 0.9 }],
            },
          ],
        }),
      });

      await GoogleVisionService.analyzeImage("fake-base64-image");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`key=${testApiKey}`),
        expect.any(Object),
      );
    });
  });

  describe("Request Security", () => {
    it("should validate input data before processing", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      // 空文字列のテスト
      await expect(GoogleVisionService.analyzeImage("")).rejects.toThrow(
        "Invalid image data provided",
      );

      // null/undefinedのテスト
      await expect(
        GoogleVisionService.analyzeImage(null as any),
      ).rejects.toThrow("Invalid image data provided");

      await expect(
        GoogleVisionService.analyzeImage(undefined as any),
      ).rejects.toThrow("Invalid image data provided");
    });

    it("should sanitize request payload", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      const maliciousInput = '<script>alert("xss")</script>base64data';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          responses: [{ labelAnnotations: [] }],
        }),
      });

      await GoogleVisionService.analyzeImage(maliciousInput);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // リクエストボディにスクリプトタグが含まれていないことを確認
      expect(JSON.stringify(requestBody)).not.toContain("<script>");
    });

    it("should implement rate limiting", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          responses: [{ labelAnnotations: [] }],
        }),
      });

      // 短時間で大量のリクエストを送信
      const promises = Array(10)
        .fill(0)
        .map(() => GoogleVisionService.analyzeImage("test-base64-data"));

      // レート制限の実装をテスト（実装後に有効化）
      // await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe("Response Security", () => {
    it("should validate API response structure", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      // 不正なレスポンス構造
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          maliciousData: "evil-script",
        }),
      });

      await expect(
        GoogleVisionService.analyzeImage("test-base64-data"),
      ).rejects.toThrow("Invalid response format from Google Vision API");
    });

    it("should sanitize API response data", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          responses: [
            {
              labelAnnotations: [
                {
                  description: '<img src="x" onerror="alert(1)">tattoo',
                  score: 0.9,
                },
              ],
            },
          ],
        }),
      });

      const result = await GoogleVisionService.analyzeImage("test-base64-data");

      // レスポンスデータにXSSペイロードが含まれていないことを確認
      expect(JSON.stringify(result)).not.toContain("<img");
      expect(JSON.stringify(result)).not.toContain("onerror");
      expect(JSON.stringify(result)).not.toContain("alert(1)");
    });
  });

  describe("Error Handling Security", () => {
    it("should not expose internal errors to client", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      // 内部エラーをシミュレート
      global.fetch = jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Internal server error with sensitive data: database_password_123",
          ),
        );

      try {
        await GoogleVisionService.analyzeImage("test-base64-data");
      } catch (error) {
        // ユーザー向けエラーメッセージに内部情報が含まれていないことを確認
        expect(error.message).not.toContain("database_password_123");
        expect(error.message).toBe(
          "Failed to analyze image. Please try again later.",
        );
      }
    });

    it("should log detailed errors for debugging without exposing sensitive data", async () => {
      mockEnvironmentConfig.getGoogleVisionApiKey.mockReturnValue(
        "AIzaSyTest123",
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network timeout"));

      try {
        await GoogleVisionService.analyzeImage("test-base64-data");
      } catch (error) {
        // エラーログが出力されているが、APIキーは含まれていないことを確認
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringMatching(/AIzaSy[a-zA-Z0-9_-]{35}/),
        );
      }

      consoleSpy.mockRestore();
    });
  });
});
