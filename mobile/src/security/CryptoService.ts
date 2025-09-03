/**
 * 🔐 Tattoo Journey 2.0 - Practical Crypto Service
 *
 * Appropriate encryption for tattoo booking application
 * Standards: AES-256-GCM, RSA-2048, SHA-256
 */

import CryptoJS from "crypto-js";
import * as forge from "node-forge";

export interface EncryptionResult {
  ciphertext: string;
  iv: string;
  tag: string;
  algorithm: string;
  timestamp: number;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}

/**
 * Practical encryption service for tattoo booking platform
 * Provides industry-standard security without excessive complexity
 */
export class CryptoService {
  private readonly AES_KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly RSA_KEY_SIZE = 2048; // Industry standard

  /**
   * Generate secure random key
   */
  public generateSecureKey(length: number = this.AES_KEY_LENGTH): Buffer {
    return Buffer.from(forge.random.getBytesSync(length), "binary");
  }

  /**
   * AES-256-GCM Encryption
   * Suitable for user data, booking details, chat messages
   */
  public encryptAES256GCM(
    plaintext: string | Buffer,
    key: Buffer,
  ): EncryptionResult {
    const iv = forge.random.getBytesSync(this.IV_LENGTH);
    const cipher = forge.cipher.createCipher("AES-GCM", key.toString("binary"));

    cipher.start({ iv });
    const input = Buffer.isBuffer(plaintext) ? plaintext.toString() : plaintext;
    cipher.update(forge.util.createBuffer(input));
    cipher.finish();

    const tag = cipher.mode.tag.getBytes();

    return {
      ciphertext: forge.util.encode64(cipher.output.getBytes()),
      iv: forge.util.encode64(iv),
      tag: forge.util.encode64(tag),
      algorithm: "AES-256-GCM",
      timestamp: Date.now(),
    };
  }

  /**
   * AES-256-GCM Decryption
   */
  public decryptAES256GCM(
    encryptedData: EncryptionResult,
    key: Buffer,
  ): string {
    const ciphertext = forge.util.decode64(encryptedData.ciphertext);
    const iv = forge.util.decode64(encryptedData.iv);
    const tag = forge.util.decode64(encryptedData.tag);

    const decipher = forge.cipher.createDecipher(
      "AES-GCM",
      key.toString("binary"),
    );
    decipher.start({ iv, tag });
    decipher.update(forge.util.createBuffer(ciphertext));

    if (!decipher.finish()) {
      throw new Error(
        "Decryption failed: Authentication tag verification failed",
      );
    }

    return decipher.output.toString();
  }

  /**
   * PBKDF2 Key Derivation
   * For password-based encryption
   */
  public deriveKey(
    password: string,
    salt: Buffer,
    iterations: number = 100000,
  ): Buffer {
    const derivedKey = forge.pkcs5.pbkdf2(
      password,
      salt.toString("binary"),
      iterations,
      this.AES_KEY_LENGTH,
      "sha256",
    );

    return Buffer.from(derivedKey, "binary");
  }

  /**
   * Generate RSA-2048 Key Pair
   * For digital signatures and key exchange
   */
  public generateRSAKeyPair(): KeyPair {
    const keyPair = forge.pki.rsa.generateKeyPair({
      bits: this.RSA_KEY_SIZE,
      workers: -1,
    });

    const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);

    // Generate fingerprint
    const hash = forge.md.sha256.create();
    hash.update(publicKeyPem);
    const fingerprint = forge.util.encode64(hash.digest().bytes());

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem,
      fingerprint,
    };
  }

  /**
   * Digital Signature with RSA-2048 + SHA-256
   */
  public sign(data: string | Buffer, privateKeyPem: string): string {
    const input = Buffer.isBuffer(data) ? data.toString() : data;
    const hash = forge.md.sha256.create();
    hash.update(input);

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const signature = privateKey.sign(hash);

    return forge.util.encode64(signature);
  }

  /**
   * Verify Digital Signature
   */
  public verifySignature(
    data: string | Buffer,
    signature: string,
    publicKeyPem: string,
  ): boolean {
    try {
      const input = Buffer.isBuffer(data) ? data.toString() : data;
      const hash = forge.md.sha256.create();
      hash.update(input);

      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const sig = forge.util.decode64(signature);

      return publicKey.verify(hash.digest().bytes(), sig);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate secure random salt
   */
  public generateSalt(length: number = 32): Buffer {
    return Buffer.from(forge.random.getBytesSync(length), "binary");
  }

  /**
   * Hash data with SHA-256
   */
  public hash(data: string | Buffer): string {
    const input = Buffer.isBuffer(data) ? data.toString() : data;
    const hash = forge.md.sha256.create();
    hash.update(input);
    return forge.util.encode64(hash.digest().bytes());
  }

  /**
   * Generate secure random token
   */
  public generateToken(length: number = 32): string {
    const bytes = forge.random.getBytesSync(length);
    return forge.util.encode64(bytes);
  }

  /**
   * Encrypt sensitive user data (PII)
   * For storing user profiles, payment info
   */
  public encryptUserData(
    userData: any,
    userPassword: string,
  ): {
    encryptedData: EncryptionResult;
    salt: string;
  } {
    const salt = this.generateSalt();
    const key = this.deriveKey(userPassword, salt);
    const encryptedData = this.encryptAES256GCM(JSON.stringify(userData), key);

    return {
      encryptedData,
      salt: forge.util.encode64(salt.toString("binary")),
    };
  }

  /**
   * Decrypt sensitive user data
   */
  public decryptUserData(
    encryptedData: EncryptionResult,
    salt: string,
    userPassword: string,
  ): any {
    const saltBuffer = Buffer.from(forge.util.decode64(salt), "binary");
    const key = this.deriveKey(userPassword, saltBuffer);
    const decryptedJson = this.decryptAES256GCM(encryptedData, key);

    return JSON.parse(decryptedJson);
  }
}

export default CryptoService;
