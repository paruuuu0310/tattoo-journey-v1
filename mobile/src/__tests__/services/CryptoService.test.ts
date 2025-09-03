/**
 * 🧪 CryptoService Test Suite
 */

import CryptoService from "../../security/CryptoService";

describe("CryptoService", () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
  });

  describe("generateSecureKey", () => {
    it("should generate key of specified length", () => {
      const key = cryptoService.generateSecureKey(32);
      expect(key).toHaveLength(32);
    });

    it("should generate different keys each time", () => {
      const key1 = cryptoService.generateSecureKey();
      const key2 = cryptoService.generateSecureKey();
      expect(key1).not.toEqual(key2);
    });
  });

  describe("AES-256-GCM Encryption/Decryption", () => {
    it("should encrypt and decrypt data successfully", () => {
      const plaintext = "Hello, Tattoo Journey!";
      const key = cryptoService.generateSecureKey();

      const encrypted = cryptoService.encryptAES256GCM(plaintext, key);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.algorithm).toBe("AES-256-GCM");

      const decrypted = cryptoService.decryptAES256GCM(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it("should fail with wrong key", () => {
      const plaintext = "Secret message";
      const key1 = cryptoService.generateSecureKey();
      const key2 = cryptoService.generateSecureKey();

      const encrypted = cryptoService.encryptAES256GCM(plaintext, key1);

      expect(() => {
        cryptoService.decryptAES256GCM(encrypted, key2);
      }).toThrow();
    });
  });

  describe("PBKDF2 Key Derivation", () => {
    it("should derive consistent keys from same input", () => {
      const password = "test-password";
      const salt = cryptoService.generateSalt();

      const key1 = cryptoService.deriveKey(password, salt, 100000);
      const key2 = cryptoService.deriveKey(password, salt, 100000);

      expect(key1).toEqual(key2);
    });

    it("should derive different keys with different salts", () => {
      const password = "test-password";
      const salt1 = cryptoService.generateSalt();
      const salt2 = cryptoService.generateSalt();

      const key1 = cryptoService.deriveKey(password, salt1);
      const key2 = cryptoService.deriveKey(password, salt2);

      expect(key1).not.toEqual(key2);
    });
  });

  describe("RSA Key Pair Generation", () => {
    it("should generate valid key pair", () => {
      const keyPair = cryptoService.generateRSAKeyPair();

      expect(keyPair.publicKey).toContain("BEGIN PUBLIC KEY");
      expect(keyPair.privateKey).toContain("BEGIN RSA PRIVATE KEY");
      expect(keyPair.fingerprint).toBeDefined();
    });
  });

  describe("Digital Signatures", () => {
    it("should sign and verify data correctly", () => {
      const data = "Important document";
      const keyPair = cryptoService.generateRSAKeyPair();

      const signature = cryptoService.sign(data, keyPair.privateKey);
      expect(signature).toBeDefined();

      const isValid = cryptoService.verifySignature(
        data,
        signature,
        keyPair.publicKey,
      );
      expect(isValid).toBe(true);
    });

    it("should fail verification with tampered data", () => {
      const originalData = "Original document";
      const tamperedData = "Tampered document";
      const keyPair = cryptoService.generateRSAKeyPair();

      const signature = cryptoService.sign(originalData, keyPair.privateKey);

      const isValid = cryptoService.verifySignature(
        tamperedData,
        signature,
        keyPair.publicKey,
      );
      expect(isValid).toBe(false);
    });
  });

  describe("Hash Function", () => {
    it("should generate consistent hashes", () => {
      const data = "test data";
      const hash1 = cryptoService.hash(data);
      const hash2 = cryptoService.hash(data);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different data", () => {
      const hash1 = cryptoService.hash("data1");
      const hash2 = cryptoService.hash("data2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("User Data Encryption", () => {
    it("should encrypt and decrypt user data", () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
      };
      const password = "user-password";

      const encrypted = cryptoService.encryptUserData(userData, password);
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.salt).toBeDefined();

      const decrypted = cryptoService.decryptUserData(
        encrypted.encryptedData,
        encrypted.salt,
        password,
      );

      expect(decrypted).toEqual(userData);
    });
  });

  describe("Token Generation", () => {
    it("should generate tokens of correct length", () => {
      const token = cryptoService.generateToken(16);
      // Base64 encoded 16 bytes should be ~24 characters
      expect(token.length).toBeGreaterThan(20);
    });

    it("should generate unique tokens", () => {
      const token1 = cryptoService.generateToken();
      const token2 = cryptoService.generateToken();
      expect(token1).not.toBe(token2);
    });
  });
});
