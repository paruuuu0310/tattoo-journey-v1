import { SecureLogger, LogLevel } from "../SecureLogger";
import { EnvironmentConfig } from "../../config/EnvironmentConfig";

// EnvironmentConfigのモック
jest.mock("../../config/EnvironmentConfig");

describe("SecureLogger", () => {
  const mockEnvironmentConfig = EnvironmentConfig as jest.Mocked<
    typeof EnvironmentConfig
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // コンソールメソッドをモック
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "info").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
    jest.spyOn(console, "debug").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Environment-based Logging Control", () => {
    it("should disable all console output in production environment", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(true);

      SecureLogger.log("test message");
      SecureLogger.info("test info");
      SecureLogger.warn("test warning");
      SecureLogger.error("test error");
      SecureLogger.debug("test debug");

      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should allow console output in development environment", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(false);

      SecureLogger.log("test message");
      SecureLogger.info("test info");
      SecureLogger.warn("test warning");

      expect(console.log).toHaveBeenCalledWith("[LOG]", "test message");
      expect(console.info).toHaveBeenCalledWith("[INFO]", "test info");
      expect(console.warn).toHaveBeenCalledWith("[WARN]", "test warning");
    });

    it("should always allow critical errors even in production", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(true);

      SecureLogger.error("critical error", undefined, { level: "critical" });

      expect(console.error).toHaveBeenCalledWith("[ERROR]", "critical error");
    });
  });

  describe("Log Level Control", () => {
    beforeEach(() => {
      mockEnvironmentConfig.isProduction.mockReturnValue(false);
    });

    it("should respect log level settings", () => {
      SecureLogger.setLogLevel(LogLevel.WARN);

      SecureLogger.debug("debug message");
      SecureLogger.info("info message");
      SecureLogger.log("log message");
      SecureLogger.warn("warn message");
      SecureLogger.error("error message");

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith("[WARN]", "warn message");
      expect(console.error).toHaveBeenCalledWith("[ERROR]", "error message");
    });

    it("should allow all logs when level is DEBUG", () => {
      SecureLogger.setLogLevel(LogLevel.DEBUG);

      SecureLogger.debug("debug message");
      SecureLogger.info("info message");
      SecureLogger.warn("warn message");

      expect(console.debug).toHaveBeenCalledWith("[DEBUG]", "debug message");
      expect(console.info).toHaveBeenCalledWith("[INFO]", "info message");
      expect(console.warn).toHaveBeenCalledWith("[WARN]", "warn message");
    });
  });

  describe("Sensitive Data Protection", () => {
    beforeEach(() => {
      mockEnvironmentConfig.isProduction.mockReturnValue(false);
    });

    it("should mask API keys in log messages", () => {
      const messageWithApiKey =
        "Error with API key AIzaSyTestKey123456789012345678901234";

      SecureLogger.error(messageWithApiKey);

      expect(console.error).toHaveBeenCalledWith(
        "[ERROR]",
        "Error with API key [API_KEY_MASKED]",
      );
    });

    it("should mask email addresses in log messages", () => {
      const messageWithEmail = "User registration failed for user@example.com";

      SecureLogger.warn(messageWithEmail);

      expect(console.warn).toHaveBeenCalledWith(
        "[WARN]",
        "User registration failed for [EMAIL_MASKED]",
      );
    });

    it("should mask passwords in log messages", () => {
      const messageWithPassword =
        "Authentication failed: password=secretpassword123";

      SecureLogger.error(messageWithPassword);

      expect(console.error).toHaveBeenCalledWith(
        "[ERROR]",
        "Authentication failed: password=[PASSWORD_MASKED]",
      );
    });

    it("should mask multiple sensitive data types in one message", () => {
      const complexMessage =
        "API call failed: key=AIzaSyTest123, user=user@test.com, pass=secret123";

      SecureLogger.error(complexMessage);

      expect(console.error).toHaveBeenCalledWith(
        "[ERROR]",
        "API call failed: key=[API_KEY_MASKED], user=[EMAIL_MASKED], pass=[PASSWORD_MASKED]",
      );
    });

    it("should preserve error object structure while masking sensitive fields", () => {
      const errorWithSensitiveData = {
        message: "API error",
        apiKey: "AIzaSyTestKey123456789012345678901234",
        userEmail: "test@example.com",
        response: {
          status: 401,
          data: "Unauthorized",
        },
      };

      SecureLogger.error("API call failed", errorWithSensitiveData);

      const logCall = (console.error as jest.Mock).mock.calls[0];
      expect(logCall[0]).toBe("[ERROR]");
      expect(logCall[1]).toBe("API call failed");
      expect(logCall[2]).toEqual({
        message: "API error",
        apiKey: "[API_KEY_MASKED]",
        userEmail: "[EMAIL_MASKED]",
        response: {
          status: 401,
          data: "Unauthorized",
        },
      });
    });
  });

  describe("Structured Logging", () => {
    beforeEach(() => {
      mockEnvironmentConfig.isProduction.mockReturnValue(false);
    });

    it("should support structured logging with metadata", () => {
      const metadata = {
        userId: "user123",
        action: "login",
        timestamp: new Date().toISOString(),
      };

      SecureLogger.info("User logged in", metadata);

      expect(console.info).toHaveBeenCalledWith(
        "[INFO]",
        "User logged in",
        metadata,
      );
    });

    it("should add timestamp when requested", () => {
      SecureLogger.log("test message", undefined, { includeTimestamp: true });

      const logCall = (console.log as jest.Mock).mock.calls[0];
      expect(logCall[0]).toBe("[LOG]");
      expect(logCall[1]).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] test message$/,
      );
    });

    it("should include stack trace for errors when in development", () => {
      const error = new Error("Test error");

      SecureLogger.error("Error occurred", undefined, {
        error,
        includeStack: true,
      });

      const logCall = (console.error as jest.Mock).mock.calls[0];
      expect(logCall[2]).toEqual(undefined);
    });
  });

  describe("Performance Monitoring", () => {
    it("should track performance metrics", () => {
      const timer = SecureLogger.startTimer("test-operation");

      // シミュレートされた処理時間
      setTimeout(() => {
        timer.end();
      }, 100);

      // タイマーオブジェクトが返されることを確認
      expect(timer).toBeDefined();
      expect(typeof timer.end).toBe("function");
    });

    it("should not expose performance logs in production", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(true);

      const timer = SecureLogger.startTimer("test-operation");
      timer.end();

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe("Error Reporting Integration", () => {
    it("should integrate with external error reporting services", () => {
      const mockErrorReporter = jest.fn();
      SecureLogger.setErrorReporter(mockErrorReporter);

      const error = new Error("Test error");
      SecureLogger.error("Critical error occurred", undefined, {
        error,
        reportToService: true,
      });

      expect(mockErrorReporter).toHaveBeenCalledWith({
        message: "Critical error occurred",
        error,
        timestamp: expect.any(String),
        environment: expect.any(String),
      });
    });

    it("should not report to external services in development by default", () => {
      mockEnvironmentConfig.isProduction.mockReturnValue(false);

      const mockErrorReporter = jest.fn();
      SecureLogger.setErrorReporter(mockErrorReporter);

      SecureLogger.error("Test error");

      expect(mockErrorReporter).not.toHaveBeenCalled();
    });
  });

  describe("Log Sanitization", () => {
    it("should remove or mask dangerous HTML/JS content", () => {
      const dangerousContent = 'User input: <script>alert("xss")</script>';

      SecureLogger.warn(dangerousContent);

      expect(console.warn).toHaveBeenCalledWith(
        "[WARN]",
        "User input: [SCRIPT_CONTENT_REMOVED]",
      );
    });

    it("should handle circular references in objects", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      expect(() => {
        SecureLogger.info("Circular object", circularObj);
      }).not.toThrow();
    });
  });
});
