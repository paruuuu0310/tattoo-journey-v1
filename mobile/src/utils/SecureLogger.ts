import { EnvironmentConfig } from "../config/EnvironmentConfig";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  LOG = 2,
  WARN = 3,
  ERROR = 4,
}

interface LogOptions {
  level?: "critical" | "normal";
  includeTimestamp?: boolean;
  includeStack?: boolean;
  reportToService?: boolean;
  error?: Error;
}

interface TimerInstance {
  end: () => void;
}

type ErrorReporter = (data: {
  message: string;
  error?: Error;
  timestamp: string;
  environment: string;
}) => void;

export class SecureLogger {
  private static currentLogLevel: LogLevel = LogLevel.DEBUG;
  private static errorReporter: ErrorReporter | null = null;

  /**
   * セキュアなログレベル設定
   */
  static setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * 外部エラーレポーティングサービスの設定
   */
  static setErrorReporter(reporter: ErrorReporter): void {
    this.errorReporter = reporter;
  }

  /**
   * セキュアなログ出力 - DEBUG レベル
   */
  static debug(message: string, data?: any, options?: LogOptions): void {
    this.logWithLevel(LogLevel.DEBUG, "DEBUG", message, data, options);
  }

  /**
   * セキュアなログ出力 - INFO レベル
   */
  static info(message: string, data?: any, options?: LogOptions): void {
    this.logWithLevel(LogLevel.INFO, "INFO", message, data, options);
  }

  /**
   * セキュアなログ出力 - LOG レベル
   */
  static log(message: string, data?: any, options?: LogOptions): void {
    // dataがLogOptionsの場合の処理
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      ("includeTimestamp" in data ||
        "level" in data ||
        "includeStack" in data ||
        "reportToService" in data)
    ) {
      this.logWithLevel(
        LogLevel.LOG,
        "LOG",
        message,
        undefined,
        data as LogOptions,
      );
    } else {
      this.logWithLevel(LogLevel.LOG, "LOG", message, data, options);
    }
  }

  /**
   * セキュアなログ出力 - WARN レベル
   */
  static warn(message: string, data?: any, options?: LogOptions): void {
    this.logWithLevel(LogLevel.WARN, "WARN", message, data, options);
  }

  /**
   * セキュアなログ出力 - ERROR レベル
   */
  static error(message: string, data?: any, options?: LogOptions): void {
    // クリティカルエラーは本番環境でも出力
    const isCritical = options?.level === "critical";

    if (EnvironmentConfig.isProduction() && !isCritical) {
      // 本番環境では外部レポーティングサービスのみ
      this.reportToExternalService(message, data, options);
      return;
    }

    this.logWithLevel(LogLevel.ERROR, "ERROR", message, data, options);
  }

  /**
   * パフォーマンス測定用タイマー
   */
  static startTimer(operation: string): TimerInstance {
    const startTime = Date.now();

    return {
      end: () => {
        const duration = Date.now() - startTime;

        if (!EnvironmentConfig.isProduction()) {
          this.info(`Performance: ${operation} completed in ${duration}ms`);
        }
      },
    };
  }

  /**
   * レベルに基づくログ出力
   */
  private static logWithLevel(
    level: LogLevel,
    levelName: string,
    message: string,
    data?: any,
    options?: LogOptions,
  ): void {
    // 本番環境では基本的にログ出力を無効化
    if (EnvironmentConfig.isProduction() && level < LogLevel.ERROR) {
      return;
    }

    // ログレベルチェック
    if (level < this.currentLogLevel) {
      return;
    }

    // センシティブデータのマスキング
    const sanitizedMessage = this.sanitizeMessage(message);
    const sanitizedData = data ? this.sanitizeData(data) : undefined;

    // タイムスタンプの追加
    const finalMessage = options?.includeTimestamp
      ? `[${new Date().toISOString()}] ${sanitizedMessage}`
      : sanitizedMessage;

    // コンソール出力
    const logMethod = this.getConsoleMethod(level);
    const prefix = `[${levelName}]`;

    if (sanitizedData !== undefined) {
      logMethod(prefix, finalMessage, sanitizedData);
    } else {
      logMethod(prefix, finalMessage);
    }

    // 外部レポーティングサービスへの送信
    if (options?.reportToService && this.shouldReportToService()) {
      this.reportToExternalService(message, data, options);
    }
  }

  /**
   * センシティブ情報のマスキング - メッセージ
   */
  private static sanitizeMessage(message: string): string {
    let sanitized = message;

    // APIキーのマスキング
    sanitized = sanitized.replace(/AIzaSy[a-zA-Z0-9_-]+/g, "[API_KEY_MASKED]");

    // メールアドレスのマスキング
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "[EMAIL_MASKED]",
    );

    // パスワードのマスキング（一般的なパターン）
    sanitized = sanitized.replace(
      /password[=:]\s*[^\s,}]+/gi,
      "password=[PASSWORD_MASKED]",
    );
    sanitized = sanitized.replace(
      /pass[=:]\s*[^\s,}]+/gi,
      "pass=[PASSWORD_MASKED]",
    );

    // スクリプトタグの除去
    sanitized = sanitized.replace(
      /<script[^>]*>.*?<\/script>/gi,
      "[SCRIPT_CONTENT_REMOVED]",
    );

    return sanitized;
  }

  /**
   * センシティブ情報のマスキング - データオブジェクト
   */
  private static sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // プリミティブ型の場合
    if (typeof data === "string") {
      return this.sanitizeMessage(data);
    }

    if (typeof data !== "object") {
      return data;
    }

    // 循環参照の検出と処理
    try {
      JSON.stringify(data);
    } catch (error) {
      return "[CIRCULAR_REFERENCE_DETECTED]";
    }

    // オブジェクトの深いコピーとサニタイズ
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();

      // センシティブなキー名の検出
      if (lowerKey.includes("apikey") || lowerKey.includes("api_key")) {
        sanitized[key] = "[API_KEY_MASKED]";
      } else if (lowerKey.includes("password") || lowerKey.includes("pass")) {
        sanitized[key] = "[PASSWORD_MASKED]";
      } else if (lowerKey.includes("email")) {
        sanitized[key] = "[EMAIL_MASKED]";
      } else if (lowerKey.includes("token")) {
        sanitized[key] = "[TOKEN_MASKED]";
      } else if (typeof sanitized[key] === "object") {
        // 再帰的にサニタイズ
        sanitized[key] = this.sanitizeData(sanitized[key]);
      } else if (typeof sanitized[key] === "string") {
        sanitized[key] = this.sanitizeMessage(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * 適切なコンソールメソッドを取得
   */
  private static getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.LOG:
        return console.log;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 外部レポーティングサービスへの送信判定
   */
  private static shouldReportToService(): boolean {
    // 本番環境では自動的に送信、開発環境では明示的な指定が必要
    return EnvironmentConfig.isProduction();
  }

  /**
   * 外部レポーティングサービスへの送信
   */
  private static reportToExternalService(
    message: string,
    data?: any,
    options?: LogOptions,
  ): void {
    if (!this.errorReporter) {
      return;
    }

    const reportData = {
      message: this.sanitizeMessage(message),
      error: options?.error,
      timestamp: new Date().toISOString(),
      environment: EnvironmentConfig.isProduction()
        ? "production"
        : "development",
    };

    try {
      this.errorReporter(reportData);
    } catch (error) {
      // エラーレポーティング自体でエラーが発生した場合は、
      // 無限ループを避けるためコンソールに出力のみ
      if (!EnvironmentConfig.isProduction()) {
        console.error(
          "[SecureLogger] Failed to report to external service:",
          error,
        );
      }
    }
  }

  /**
   * 開発者向け：現在の設定を表示
   */
  static getConfiguration(): {
    logLevel: LogLevel;
    isProduction: boolean;
    hasErrorReporter: boolean;
  } {
    return {
      logLevel: this.currentLogLevel,
      isProduction: EnvironmentConfig.isProduction(),
      hasErrorReporter: this.errorReporter !== null,
    };
  }
}

export default SecureLogger;
