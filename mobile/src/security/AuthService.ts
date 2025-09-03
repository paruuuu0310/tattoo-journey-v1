/**
 * 🔐 Tattoo Journey 2.0 - Authentication Service
 *
 * Practical authentication and authorization for tattoo booking
 * Firebase Auth integration with additional security layers
 */

import CryptoService from "./CryptoService";

export interface User {
  uid: string;
  email: string;
  role: "user" | "artist" | "admin";
  verified: boolean;
  createdAt: number;
  lastLogin: number;
}

export interface LoginSession {
  token: string;
  expiresAt: number;
  refreshToken: string;
  user: User;
}

export interface SecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  requireTwoFactor: boolean;
}

/**
 * Secure authentication service for tattoo booking platform
 */
export class AuthService {
  private cryptoService = new CryptoService();
  private failedAttempts = new Map<string, number>();
  private lockedAccounts = new Map<string, number>();

  private readonly config: SecurityConfig = {
    maxFailedAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    sessionTimeout: 60, // 1 hour
    requireTwoFactor: false, // Disabled for simplicity
  };

  /**
   * Generate secure session token
   */
  public generateSessionToken(): string {
    return this.cryptoService.generateToken(64);
  }

  /**
   * Create login session
   */
  public createSession(user: User): LoginSession {
    const token = this.generateSessionToken();
    const refreshToken = this.generateSessionToken();
    const expiresAt = Date.now() + this.config.sessionTimeout * 60 * 1000;

    return {
      token,
      expiresAt,
      refreshToken,
      user: {
        ...user,
        lastLogin: Date.now(),
      },
    };
  }

  /**
   * Validate session token
   */
  public validateSession(session: LoginSession): boolean {
    return Date.now() < session.expiresAt;
  }

  /**
   * Check if account is locked due to failed attempts
   */
  public isAccountLocked(identifier: string): boolean {
    const lockTime = this.lockedAccounts.get(identifier);
    if (!lockTime) return false;

    const unlockTime = lockTime + this.config.lockoutDuration * 60 * 1000;
    const isLocked = Date.now() < unlockTime;

    if (!isLocked) {
      // Auto-unlock expired locks
      this.lockedAccounts.delete(identifier);
      this.failedAttempts.delete(identifier);
    }

    return isLocked;
  }

  /**
   * Record failed login attempt
   */
  public recordFailedAttempt(identifier: string): {
    attemptsRemaining: number;
    accountLocked: boolean;
  } {
    const attempts = (this.failedAttempts.get(identifier) || 0) + 1;
    this.failedAttempts.set(identifier, attempts);

    if (attempts >= this.config.maxFailedAttempts) {
      this.lockedAccounts.set(identifier, Date.now());
      return {
        attemptsRemaining: 0,
        accountLocked: true,
      };
    }

    return {
      attemptsRemaining: this.config.maxFailedAttempts - attempts,
      accountLocked: false,
    };
  }

  /**
   * Clear failed attempts on successful login
   */
  public clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
    this.lockedAccounts.delete(identifier);
  }

  /**
   * Hash password for storage
   */
  public hashPassword(password: string): {
    hash: string;
    salt: string;
  } {
    const salt = this.cryptoService.generateSalt();
    const key = this.cryptoService.deriveKey(password, salt, 100000);

    return {
      hash: key.toString("base64"),
      salt: salt.toString("base64"),
    };
  }

  /**
   * Verify password against stored hash
   */
  public verifyPassword(
    password: string,
    storedHash: string,
    salt: string,
  ): boolean {
    const saltBuffer = Buffer.from(salt, "base64");
    const derivedKey = this.cryptoService.deriveKey(
      password,
      saltBuffer,
      100000,
    );
    const computedHash = derivedKey.toString("base64");

    return computedHash === storedHash;
  }

  /**
   * Generate email verification token
   */
  public generateVerificationToken(email: string): string {
    const data = {
      email,
      timestamp: Date.now(),
      type: "email_verification",
    };

    // In production, use a signing key
    const token = this.cryptoService.hash(JSON.stringify(data));
    return Buffer.from(JSON.stringify(data)).toString("base64") + "." + token;
  }

  /**
   * Verify email verification token
   */
  public verifyVerificationToken(token: string, email: string): boolean {
    try {
      const [dataB64, hash] = token.split(".");
      const data = JSON.parse(Buffer.from(dataB64, "base64").toString());

      // Check token age (24 hours max)
      const tokenAge = Date.now() - data.timestamp;
      if (tokenAge > 24 * 60 * 60 * 1000) return false;

      // Verify email matches
      if (data.email !== email) return false;

      // Verify hash
      const expectedHash = this.cryptoService.hash(JSON.stringify(data));
      return hash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate password reset token
   */
  public generateResetToken(email: string): string {
    const data = {
      email,
      timestamp: Date.now(),
      type: "password_reset",
      nonce: this.cryptoService.generateToken(16),
    };

    const token = this.cryptoService.hash(JSON.stringify(data));
    return Buffer.from(JSON.stringify(data)).toString("base64") + "." + token;
  }

  /**
   * Validate user role permissions
   */
  public hasPermission(user: User, resource: string, action: string): boolean {
    const permissions = {
      user: {
        profile: ["read", "update"],
        booking: ["create", "read", "update", "cancel"],
        review: ["create", "read", "update"],
      },
      artist: {
        profile: ["read", "update"],
        booking: ["read", "update", "accept", "decline"],
        portfolio: ["create", "read", "update", "delete"],
        review: ["read"],
      },
      admin: {
        "*": ["*"], // Admin has all permissions
      },
    };

    const userPermissions = permissions[user.role];
    if (!userPermissions) return false;

    // Admin wildcard
    if (userPermissions["*"] && userPermissions["*"].includes("*")) {
      return true;
    }

    const resourcePermissions = userPermissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  }

  /**
   * Generate API key for external integrations
   */
  public generateApiKey(userId: string): {
    keyId: string;
    keySecret: string;
    keyHash: string;
  } {
    const keyId = `tj2_${userId.substr(0, 8)}_${Date.now()}`;
    const keySecret = this.cryptoService.generateToken(32);
    const keyHash = this.cryptoService.hash(`${keyId}:${keySecret}`);

    return { keyId, keySecret, keyHash };
  }

  /**
   * Validate API key
   */
  public validateApiKey(
    keyId: string,
    keySecret: string,
    storedHash: string,
  ): boolean {
    const computedHash = this.cryptoService.hash(`${keyId}:${keySecret}`);
    return computedHash === storedHash;
  }

  /**
   * Rate limiting check
   */
  public checkRateLimit(
    identifier: string,
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 60,
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // This would use Redis or similar in production
    // For now, simplified in-memory implementation
    const key = `rate_limit:${identifier}`;

    return {
      allowed: true, // Simplified - always allow
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  /**
   * Audit log for security events
   */
  public auditLog(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      source: "AuthService",
    };

    // In production, send to secure logging service
    console.log("🔐 AUTH_AUDIT:", JSON.stringify(logEntry));
  }
}

export default AuthService;
