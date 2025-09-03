/**
 * 🧪 SecurityService Test Suite
 */

import SecurityService from "../../security/SecurityService";

describe("SecurityService", () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = new SecurityService();
  });

  describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = securityService.sanitizeInput(input);
      expect(sanitized).toBe("Hello World");
    });

    it("should remove javascript: protocol", () => {
      const input = 'javascript:alert("xss")';
      const sanitized = securityService.sanitizeInput(input);
      expect(sanitized).toBe('alert("xss")');
    });

    it("should remove event handlers", () => {
      const input = 'onclick="alert()" onmouseover="evil()"';
      const sanitized = securityService.sanitizeInput(input);
      expect(sanitized).toBe("");
    });

    it("should handle null/undefined input", () => {
      expect(securityService.sanitizeInput(null as any)).toBe("");
      expect(securityService.sanitizeInput(undefined as any)).toBe("");
    });
  });

  describe("validateInput", () => {
    it("should validate required fields", () => {
      const data = { name: "John", email: "" };
      const rules = [
        { field: "name", required: true },
        { field: "email", required: true },
      ];

      const result = securityService.validateInput(data, rules);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("email is required");
    });

    it("should validate field length", () => {
      const data = { password: "123" };
      const rules = [{ field: "password", required: true, minLength: 8 }];

      const result = securityService.validateInput(data, rules);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("password must be at least 8 characters");
    });

    it("should validate patterns", () => {
      const data = { email: "invalid-email" };
      const rules = [
        {
          field: "email",
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      ];

      const result = securityService.validateInput(data, rules);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("email format is invalid");
    });

    it("should sanitize input when requested", () => {
      const data = { comment: '<script>alert("xss")</script>Nice tattoo!' };
      const rules = [{ field: "comment", required: true, sanitize: true }];

      const result = securityService.validateInput(data, rules);

      expect(result.valid).toBe(true);
      expect(result.sanitizedData.comment).toBe("Nice tattoo!");
    });

    it("should use custom validators", () => {
      const data = { age: 15 };
      const rules = [
        {
          field: "age",
          required: true,
          customValidator: (value: number) => value >= 18,
        },
      ];

      const result = securityService.validateInput(data, rules);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("age validation failed");
    });
  });

  describe("validatePasswordStrength", () => {
    it("should accept strong passwords", () => {
      const strongPassword = "MyStr0ng!Pass";
      expect(securityService.validatePasswordStrength(strongPassword)).toBe(
        true,
      );
    });

    it("should reject weak passwords", () => {
      const weakPasswords = [
        "12345678", // only numbers
        "password", // only lowercase
        "PASSWORD", // only uppercase
        "Pass1", // too short
        "", // empty
      ];

      weakPasswords.forEach((password) => {
        expect(securityService.validatePasswordStrength(password)).toBe(false);
      });
    });
  });

  describe("detectSuspiciousActivity", () => {
    it("should detect SQL injection attempts", () => {
      const input = "'; DROP TABLE users; --";
      const result = securityService.detectSuspiciousActivity(input);

      expect(result.suspicious).toBe(true);
      expect(result.patterns).toContain("SQL Injection");
    });

    it("should detect XSS attempts", () => {
      const input = '<script>alert("xss")</script>';
      const result = securityService.detectSuspiciousActivity(input);

      expect(result.suspicious).toBe(true);
      expect(result.patterns).toContain("XSS Attempt");
    });

    it("should detect path traversal", () => {
      const input = "../../../etc/passwd";
      const result = securityService.detectSuspiciousActivity(input);

      expect(result.suspicious).toBe(true);
      expect(result.patterns).toContain("Path Traversal");
    });

    it("should detect command injection", () => {
      const input = "filename.txt; rm -rf /";
      const result = securityService.detectSuspiciousActivity(input);

      expect(result.suspicious).toBe(true);
      expect(result.patterns).toContain("Command Injection");
    });

    it("should not flag clean input", () => {
      const input = "I want a beautiful cherry blossom tattoo";
      const result = securityService.detectSuspiciousActivity(input);

      expect(result.suspicious).toBe(false);
      expect(result.patterns).toHaveLength(0);
    });
  });

  describe("validateFileUpload", () => {
    it("should accept valid image files", () => {
      const file = {
        name: "tattoo-design.jpg",
        size: 2 * 1024 * 1024, // 2MB
        type: "image/jpeg",
      };

      const result = securityService.validateFileUpload(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject files that are too large", () => {
      const file = {
        name: "large-image.jpg",
        size: 10 * 1024 * 1024, // 10MB
        type: "image/jpeg",
      };

      const result = securityService.validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("File size exceeds 5MB limit");
    });

    it("should reject disallowed file types", () => {
      const file = {
        name: "malicious.exe",
        size: 1024,
        type: "application/exe",
      };

      const result = securityService.validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("File type not allowed");
    });

    it("should reject suspicious filenames", () => {
      const file = {
        name: "admin.jpg",
        size: 1024,
        type: "image/jpeg",
      };

      const result = securityService.validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Filename not allowed");
    });
  });

  describe("getCommonRules", () => {
    it("should provide user registration rules", () => {
      const rules = securityService.getCommonRules();

      expect(rules.userRegistration).toBeDefined();
      expect(rules.userRegistration.length).toBeGreaterThan(0);

      const emailRule = rules.userRegistration.find((r) => r.field === "email");
      expect(emailRule?.required).toBe(true);
      expect(emailRule?.pattern).toBeDefined();
    });

    it("should provide booking creation rules", () => {
      const rules = securityService.getCommonRules();

      expect(rules.bookingCreation).toBeDefined();
      expect(rules.bookingCreation.length).toBeGreaterThan(0);
    });

    it("should provide artist profile rules", () => {
      const rules = securityService.getCommonRules();

      expect(rules.artistProfile).toBeDefined();
      expect(rules.artistProfile.length).toBeGreaterThan(0);
    });
  });

  describe("generateCSPHeader", () => {
    it("should generate valid CSP header", () => {
      const csp = securityService.generateCSPHeader();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("script-src");
    });
  });

  describe("getSecurityHeaders", () => {
    it("should provide comprehensive security headers", () => {
      const headers = securityService.getSecurityHeaders();

      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
      expect(headers["Strict-Transport-Security"]).toContain("max-age=");
      expect(headers["Content-Security-Policy"]).toBeDefined();
    });
  });

  describe("recordViolation", () => {
    it("should record security violations", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      securityService.recordViolation({
        type: "INPUT_VALIDATION",
        severity: "HIGH",
        description: "XSS attempt detected",
        userId: "test-user-123",
      });

      const metrics = securityService.getSecurityMetrics();
      expect(metrics.totalViolations).toBe(1);
      expect(metrics.violationsBySeverity.HIGH).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe("getSecurityMetrics", () => {
    it("should provide security metrics", () => {
      const metrics = securityService.getSecurityMetrics();

      expect(metrics.totalViolations).toBeDefined();
      expect(metrics.violationsBySeverity).toBeDefined();
      expect(metrics.recentViolations).toBeDefined();
      expect(metrics.topViolationTypes).toBeDefined();
    });
  });
});
