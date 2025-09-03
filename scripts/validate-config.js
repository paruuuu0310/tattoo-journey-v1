#!/usr/bin/env node

/**
 * Firebase Configuration Validation Script - SEC-007
 * 環境別設定ファイルの整合性チェック
 */

const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) =>
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENVIRONMENTS = ["dev", "staging", "prod"];

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * メインの検証プロセス
   */
  async validate() {
    log.info("🔍 Starting Firebase configuration validation...");

    // 1. 設定ファイルの存在確認
    this.validateConfigFilesExist();

    // 2. 設定ファイルの構造確認
    await this.validateConfigStructure();

    // 3. セキュリティルールファイルの確認
    this.validateSecurityRulesExist();

    // 4. セキュリティルールの構文確認
    await this.validateRulesSyntax();

    // 5. プロジェクトID整合性確認
    this.validateProjectIds();

    // 6. エミュレーター設定の確認
    this.validateEmulatorConfig();

    // 結果の表示
    this.displayResults();

    return this.errors.length === 0;
  }

  /**
   * 設定ファイルの存在確認
   */
  validateConfigFilesExist() {
    log.info("📁 Checking configuration files existence...");

    const requiredFiles = [
      ...ENVIRONMENTS.map((env) => `firebase.${env}.json`),
      "firebase.emulator.json",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing configuration file: ${file}`);
      } else {
        log.success(`✅ Found: ${file}`);
      }
    }
  }

  /**
   * 設定ファイルの構造確認
   */
  async validateConfigStructure() {
    log.info("🏗️  Validating configuration structure...");

    for (const env of ENVIRONMENTS) {
      const configPath = path.join(PROJECT_ROOT, `firebase.${env}.json`);

      if (!fs.existsSync(configPath)) continue;

      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        this.validateConfigFields(config, env);
      } catch (error) {
        this.errors.push(
          `Invalid JSON in firebase.${env}.json: ${error.message}`,
        );
      }
    }
  }

  /**
   * 個別設定ファイルのフィールド確認
   */
  validateConfigFields(config, env) {
    const requiredFields = ["projectId", "firestore", "storage", "functions"];
    const envSpecificRequirements = {
      dev: {
        shouldHave: ["emulators"],
        shouldNotHave: ["backup"],
      },
      staging: {
        shouldNotHave: ["emulators", "backup"],
      },
      prod: {
        shouldHave: ["firestore.backup"],
        shouldNotHave: ["emulators"],
      },
    };

    // 必須フィールドの確認
    for (const field of requiredFields) {
      if (!this.hasNestedProperty(config, field)) {
        this.errors.push(
          `firebase.${env}.json missing required field: ${field}`,
        );
      }
    }

    // 環境固有の要件確認
    const requirements = envSpecificRequirements[env];
    if (requirements) {
      // 必須フィールド
      if (requirements.shouldHave) {
        for (const field of requirements.shouldHave) {
          if (!this.hasNestedProperty(config, field)) {
            this.errors.push(
              `firebase.${env}.json should have field: ${field}`,
            );
          }
        }
      }

      // 不要フィールド
      if (requirements.shouldNotHave) {
        for (const field of requirements.shouldNotHave) {
          if (this.hasNestedProperty(config, field)) {
            this.warnings.push(
              `firebase.${env}.json should not have field: ${field} (environment: ${env})`,
            );
          }
        }
      }
    }

    // プロジェクトID形式確認
    if (config.projectId) {
      const expectedPattern =
        env === "prod" ? "tattoo-journey-v2" : `tattoo-journey-${env}`;
      if (config.projectId !== expectedPattern) {
        this.errors.push(
          `Invalid projectId in firebase.${env}.json. Expected: ${expectedPattern}, Got: ${config.projectId}`,
        );
      }
    }

    log.success(`✅ Configuration structure valid for ${env} environment`);
  }

  /**
   * ネストされたプロパティの存在確認
   */
  hasNestedProperty(obj, path) {
    return (
      path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj) !== undefined
    );
  }

  /**
   * セキュリティルールファイルの存在確認
   */
  validateSecurityRulesExist() {
    log.info("🔐 Checking security rules files...");

    const requiredRulesFiles = [
      ...ENVIRONMENTS.map((env) => `firestore.${env}.rules`),
      ...ENVIRONMENTS.map((env) => `storage.${env}.rules`),
      ...ENVIRONMENTS.map((env) => `database.${env}.rules.json`),
    ];

    for (const file of requiredRulesFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing security rules file: ${file}`);
      } else {
        log.success(`✅ Found: ${file}`);
      }
    }
  }

  /**
   * セキュリティルールの構文確認
   */
  async validateRulesSyntax() {
    log.info("📜 Validating security rules syntax...");

    for (const env of ENVIRONMENTS) {
      const firestoreRules = path.join(PROJECT_ROOT, `firestore.${env}.rules`);
      const storageRules = path.join(PROJECT_ROOT, `storage.${env}.rules`);

      // Firestore rules syntax check
      if (fs.existsSync(firestoreRules)) {
        try {
          const content = fs.readFileSync(firestoreRules, "utf8");
          this.validateFirestoreRulesSyntax(content, env);
        } catch (error) {
          this.errors.push(
            `Error reading firestore.${env}.rules: ${error.message}`,
          );
        }
      }

      // Storage rules syntax check
      if (fs.existsSync(storageRules)) {
        try {
          const content = fs.readFileSync(storageRules, "utf8");
          this.validateStorageRulesSyntax(content, env);
        } catch (error) {
          this.errors.push(
            `Error reading storage.${env}.rules: ${error.message}`,
          );
        }
      }
    }
  }

  /**
   * Firestoreルールの構文確認
   */
  validateFirestoreRulesSyntax(content, env) {
    // 基本的な構文チェック
    const requiredPatterns = [
      /rules_version = '2';/,
      /service cloud\.firestore/,
      /match \/databases\/\{database\}\/documents/,
    ];

    for (const pattern of requiredPatterns) {
      if (!pattern.test(content)) {
        this.errors.push(
          `firestore.${env}.rules missing required pattern: ${pattern.source}`,
        );
      }
    }

    // 環境固有のチェック
    if (env === "dev") {
      if (!content.includes("Development environment")) {
        this.warnings.push(
          `firestore.${env}.rules should include development environment comment`,
        );
      }
    }

    if (env === "prod") {
      if (!content.includes("Production environment")) {
        this.warnings.push(
          `firestore.${env}.rules should include production environment comment`,
        );
      }
      // 本番環境では緩いルールが含まれないことを確認
      if (content.includes("allow read: if true")) {
        this.errors.push(
          `firestore.${env}.rules contains overly permissive rule in production`,
        );
      }
    }

    log.success(`✅ Firestore rules syntax valid for ${env} environment`);
  }

  /**
   * Storageルールの構文確認
   */
  validateStorageRulesSyntax(content, env) {
    const requiredPatterns = [
      /rules_version = '2';/,
      /service firebase\.storage/,
      /match \/b\/\{bucket\}\/o/,
    ];

    for (const pattern of requiredPatterns) {
      if (!pattern.test(content)) {
        this.errors.push(
          `storage.${env}.rules missing required pattern: ${pattern.source}`,
        );
      }
    }

    log.success(`✅ Storage rules syntax valid for ${env} environment`);
  }

  /**
   * プロジェクトID整合性確認
   */
  validateProjectIds() {
    log.info("🆔 Validating project IDs consistency...");

    const expectedProjectIds = {
      dev: "tattoo-journey-dev",
      staging: "tattoo-journey-staging",
      prod: "tattoo-journey-v2",
    };

    for (const [env, expectedId] of Object.entries(expectedProjectIds)) {
      const configPath = path.join(PROJECT_ROOT, `firebase.${env}.json`);

      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
          if (config.projectId !== expectedId) {
            this.errors.push(
              `Project ID mismatch in ${env}: expected ${expectedId}, got ${config.projectId}`,
            );
          } else {
            log.success(
              `✅ Project ID correct for ${env}: ${config.projectId}`,
            );
          }
        } catch (error) {
          this.errors.push(
            `Error parsing firebase.${env}.json: ${error.message}`,
          );
        }
      }
    }
  }

  /**
   * エミュレーター設定の確認
   */
  validateEmulatorConfig() {
    log.info("🔧 Validating emulator configuration...");

    const emulatorConfigPath = path.join(
      PROJECT_ROOT,
      "firebase.emulator.json",
    );

    if (fs.existsSync(emulatorConfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(emulatorConfigPath, "utf8"));

        // 必須フィールド確認
        if (!config.emulators) {
          this.errors.push(
            "firebase.emulator.json missing emulators configuration",
          );
          return;
        }

        const requiredEmulators = ["auth", "firestore", "storage", "functions"];
        for (const emulator of requiredEmulators) {
          if (!config.emulators[emulator]) {
            this.errors.push(
              `firebase.emulator.json missing ${emulator} emulator config`,
            );
          }
        }

        // ポート重複確認
        const ports = [];
        for (const [name, emulatorConfig] of Object.entries(config.emulators)) {
          if (emulatorConfig.port) {
            if (ports.includes(emulatorConfig.port)) {
              this.errors.push(
                `Duplicate port ${emulatorConfig.port} in emulator config`,
              );
            } else {
              ports.push(emulatorConfig.port);
            }
          }
        }

        log.success("✅ Emulator configuration valid");
      } catch (error) {
        this.errors.push(
          `Error parsing firebase.emulator.json: ${error.message}`,
        );
      }
    } else {
      this.errors.push("Missing firebase.emulator.json");
    }
  }

  /**
   * 結果の表示
   */
  displayResults() {
    console.log("\n" + "=".repeat(60));
    log.info("📊 Validation Results");
    console.log("=".repeat(60));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success("🎉 All configurations are valid!");
    } else {
      if (this.errors.length > 0) {
        log.error(`❌ Found ${this.errors.length} error(s):`);
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

      if (this.warnings.length > 0) {
        log.warning(`⚠️  Found ${this.warnings.length} warning(s):`);
        this.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
      }
    }

    console.log("=".repeat(60) + "\n");
  }
}

// メイン実行
if (require.main === module) {
  const validator = new ConfigValidator();
  validator
    .validate()
    .then((isValid) => {
      process.exit(isValid ? 0 : 1);
    })
    .catch((error) => {
      log.error(`Validation failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = ConfigValidator;
