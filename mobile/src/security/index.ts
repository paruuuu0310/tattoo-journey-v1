/**
 * 🔐 Tattoo Journey 2.0 - Security Module
 *
 * Centralized exports for practical security services
 * Appropriate security implementation for tattoo booking platform
 */

export { default as CryptoService } from "./CryptoService";
export { default as AuthService } from "./AuthService";
export { default as SecurityService } from "./SecurityService";

export type { EncryptionResult, KeyPair } from "./CryptoService";

export type { User, LoginSession, SecurityConfig } from "./AuthService";

export type { SecurityViolation, ValidationRule } from "./SecurityService";

// Re-export commonly used security utilities
export const SecurityUtils = {
  generateSecureToken: () =>
    require("./CryptoService").default.prototype.generateToken(32),
  validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  sanitizeInput: (input: string) =>
    require("./SecurityService").default.prototype.sanitizeInput(input),
};
