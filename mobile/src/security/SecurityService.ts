/**
 * 🛡️ Tattoo Journey 2.0 - Security Service
 *
 * Centralized security service for practical application security
 * Input validation, sanitization, and security monitoring
 */

import CryptoService from "./CryptoService";
import AuthService from "./AuthService";

export interface SecurityViolation {
  type:
    | "INPUT_VALIDATION"
    | "RATE_LIMIT"
    | "UNAUTHORIZED_ACCESS"
    | "SUSPICIOUS_ACTIVITY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  timestamp: number;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  customValidator?: (value: any) => boolean;
}

/**
 * Comprehensive security service for tattoo booking platform
 */
export class SecurityService {
  private cryptoService = new CryptoService();
  private authService = new AuthService();
  private violations: SecurityViolation[] = [];

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  public sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") return "";

    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags and content
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers with quotes
      .replace(/on\w+\s*=\s*[^"'\s>]*/gi, "") // Remove event handlers without quotes
      .replace(/script/gi, "") // Remove script references
      .trim();
  }

  /**
   * Validate input against rules
   */
  public validateInput(
    data: Record<string, any>,
    rules: ValidationRule[],
  ): {
    valid: boolean;
    errors: string[];
    sanitizedData: Record<string, any>;
  } {
    const errors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const rule of rules) {
      const value = data[rule.field];

      // Required field check
      if (
        rule.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation for optional empty fields
      if (
        !rule.required &&
        (value === undefined || value === null || value === "")
      ) {
        continue;
      }

      // Length validation
      if (
        rule.minLength &&
        typeof value === "string" &&
        value.length < rule.minLength
      ) {
        errors.push(
          `${rule.field} must be at least ${rule.minLength} characters`,
        );
      }

      if (
        rule.maxLength &&
        typeof value === "string" &&
        value.length > rule.maxLength
      ) {
        errors.push(
          `${rule.field} must be no more than ${rule.maxLength} characters`,
        );
      }

      // Pattern validation
      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        errors.push(`${rule.field} format is invalid`);
      }

      // Custom validation
      if (rule.customValidator && !rule.customValidator(value)) {
        errors.push(`${rule.field} validation failed`);
      }

      // Sanitization
      if (rule.sanitize && typeof value === "string") {
        sanitizedData[rule.field] = this.sanitizeInput(value);
      } else {
        sanitizedData[rule.field] = value;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData,
    };
  }

  /**
   * Common validation rules for the application
   */
  public getCommonRules(): Record<string, ValidationRule[]> {
    return {
      userRegistration: [
        {
          field: "email",
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          sanitize: true,
        },
        {
          field: "password",
          required: true,
          minLength: 8,
          customValidator: (value) => this.validatePasswordStrength(value),
        },
        {
          field: "name",
          required: true,
          minLength: 2,
          maxLength: 50,
          sanitize: true,
        },
      ],
      bookingCreation: [
        {
          field: "artistId",
          required: true,
          pattern: /^[a-zA-Z0-9_-]+$/,
        },
        {
          field: "designDescription",
          required: true,
          minLength: 10,
          maxLength: 500,
          sanitize: true,
        },
        {
          field: "preferredDate",
          required: true,
          customValidator: (value) => new Date(value) > new Date(),
        },
        {
          field: "budget",
          required: true,
          customValidator: (value) => typeof value === "number" && value > 0,
        },
      ],
      artistProfile: [
        {
          field: "bio",
          required: false,
          maxLength: 1000,
          sanitize: true,
        },
        {
          field: "specialties",
          required: true,
          customValidator: (value) => Array.isArray(value) && value.length > 0,
        },
        {
          field: "hourlyRate",
          required: true,
          customValidator: (value) => typeof value === "number" && value >= 50,
        },
      ],
    };
  }

  /**
   * Validate password strength
   */
  public validatePasswordStrength(password: string): boolean {
    if (!password || password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(
      password,
    );

    const criteriaMet = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    return criteriaMet >= 3; // At least 3 out of 4 criteria
  }

  /**
   * Check for suspicious patterns in user input
   */
  public detectSuspiciousActivity(input: string): {
    suspicious: boolean;
    patterns: string[];
  } {
    const suspiciousPatterns = [
      {
        name: "SQL Injection",
        pattern: /(union|select|insert|update|delete|drop|exec|script)/i,
      },
      { name: "XSS Attempt", pattern: /<script|javascript:|on\w+=/i },
      { name: "Path Traversal", pattern: /\.\.\//g },
      { name: "Command Injection", pattern: /(\||&|;|`|\$\()/g },
    ];

    const detectedPatterns: string[] = [];

    for (const { name, pattern } of suspiciousPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(name);
      }
    }

    return {
      suspicious: detectedPatterns.length > 0,
      patterns: detectedPatterns,
    };
  }

  /**
   * Record security violation
   */
  public recordViolation(
    violation: Omit<SecurityViolation, "timestamp">,
  ): void {
    const fullViolation: SecurityViolation = {
      ...violation,
      timestamp: Date.now(),
    };

    this.violations.push(fullViolation);

    // Log to audit system
    console.log("🚨 SECURITY_VIOLATION:", JSON.stringify(fullViolation));

    // Alert on critical violations
    if (violation.severity === "CRITICAL") {
      this.alertSecurityTeam(fullViolation);
    }
  }

  /**
   * Generate Content Security Policy header
   */
  public generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.tattoo-journey.app",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");
  }

  /**
   * Validate file upload security
   */
  public validateFileUpload(file: {
    name: string;
    size: number;
    type: string;
  }): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    // File size check
    if (file.size > maxSize) {
      errors.push("File size exceeds 5MB limit");
    }

    // MIME type check
    if (!allowedTypes.includes(file.type)) {
      errors.push("File type not allowed");
    }

    // Extension check
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !allowedExtensions.includes(`.${extension}`)) {
      errors.push("File extension not allowed");
    }

    // Suspicious filename check
    const suspiciousNames = ["index", "admin", "config", "login", "api"];
    const baseName = file.name.toLowerCase().split(".")[0];
    if (suspiciousNames.includes(baseName)) {
      errors.push("Filename not allowed");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure headers for HTTP responses
   */
  public getSecurityHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy": this.generateCSPHeader(),
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    };
  }

  /**
   * Monitor security metrics
   */
  public getSecurityMetrics(): {
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    recentViolations: SecurityViolation[];
    topViolationTypes: Array<{ type: string; count: number }>;
  } {
    const violationsBySeverity = this.violations.reduce(
      (acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentViolations = this.violations
      .filter((v) => Date.now() - v.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.timestamp - a.timestamp);

    const violationTypeCounts = this.violations.reduce(
      (acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topViolationTypes = Object.entries(violationTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalViolations: this.violations.length,
      violationsBySeverity,
      recentViolations,
      topViolationTypes,
    };
  }

  /**
   * Clean up old violation records
   */
  public cleanupViolations(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.violations = this.violations.filter(
      (v) => v.timestamp > thirtyDaysAgo,
    );
  }

  /**
   * Alert security team (placeholder)
   */
  private alertSecurityTeam(violation: SecurityViolation): void {
    // In production, this would send alerts to security team
    console.log("🚨 CRITICAL_SECURITY_ALERT:", JSON.stringify(violation));

    // Could send to Slack, email, PagerDuty, etc.
  }
}

export default SecurityService;
