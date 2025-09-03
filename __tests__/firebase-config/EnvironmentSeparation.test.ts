/**
 * Firebase Environment Separation Tests - SEC-007
 * TDD Red Phase: Firebase設定ファイル環境分離テストケース作成
 *
 * テスト対象の問題点:
 * 1. 開発・本番環境の設定混在
 * 2. エミュレーター設定の本番環境への影響
 * 3. 環境別プロジェクト管理の不適切性
 * 4. デプロイスクリプトの環境判定不足
 * 5. 設定管理自動化の不備
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

describe("SEC-007: Firebase設定ファイルの環境分離", () => {
  const projectRoot = resolve(__dirname, "../..");

  describe("SEC-007-1: 環境別設定ファイルの存在確認", () => {
    it("✅ PASS: 開発環境専用の設定ファイルが存在する", () => {
      const devConfigPath = resolve(projectRoot, "firebase.dev.json");

      // ✅ 期待: 開発環境設定ファイルが存在する
      expect(existsSync(devConfigPath)).toBe(true);

      if (existsSync(devConfigPath)) {
        const devConfig = JSON.parse(readFileSync(devConfigPath, "utf8"));

        // ✅ 開発環境設定にはエミュレーター設定が含まれる
        expect(devConfig.emulators).toBeDefined();
        expect(devConfig.emulators.firestore).toBeDefined();
        expect(devConfig.emulators.auth).toBeDefined();
        expect(devConfig.emulators.storage).toBeDefined();

        // ✅ 開発環境設定には開発専用のプロジェクトIDが含まれる
        expect(devConfig.projectId).toBe("tattoo-journey-dev");
      }
    });

    it("✅ PASS: ステージング環境専用の設定ファイルが存在する", () => {
      const stagingConfigPath = resolve(projectRoot, "firebase.staging.json");

      // ✅ 期待: ステージング環境設定ファイルが存在する
      expect(existsSync(stagingConfigPath)).toBe(true);

      if (existsSync(stagingConfigPath)) {
        const stagingConfig = JSON.parse(
          readFileSync(stagingConfigPath, "utf8"),
        );

        // ✅ ステージング環境設定
        expect(stagingConfig.projectId).toBe("tattoo-journey-staging");
        expect(stagingConfig.emulators).toBeUndefined(); // エミュレーター設定なし

        // ✅ ステージング環境にはテスト用の設定が含まれる
        expect(stagingConfig.hosting).toBeDefined();
        expect(stagingConfig.firestore.rules).toBe("firestore.staging.rules");
      }
    });

    it("✅ PASS: 本番環境専用の設定ファイルが存在する", () => {
      const prodConfigPath = resolve(projectRoot, "firebase.prod.json");

      // ✅ 期待: 本番環境設定ファイルが存在する
      expect(existsSync(prodConfigPath)).toBe(true);

      if (existsSync(prodConfigPath)) {
        const prodConfig = JSON.parse(readFileSync(prodConfigPath, "utf8"));

        // ✅ 本番環境設定の要件
        expect(prodConfig.projectId).toBe("tattoo-journey-v2");
        expect(prodConfig.emulators).toBeUndefined(); // エミュレーター設定なし

        // ✅ 本番環境にはセキュリティ強化設定が含まれる
        expect(prodConfig.firestore.rules).toBe("firestore.prod.rules");
        expect(prodConfig.storage.rules).toBe("storage.prod.rules");

        // ✅ 本番環境にはバックアップ設定が含まれる
        expect(prodConfig.firestore.backup).toBeDefined();
      }
    });

    it("❌ FAIL: 現在は環境分離されていない", () => {
      const currentConfig = resolve(projectRoot, "firebase.json");
      const config = JSON.parse(readFileSync(currentConfig, "utf8"));

      // ❌ 問題: 現在の設定では環境分離がされていない
      expect(config.emulators).toBeDefined(); // エミュレーター設定が混在
      expect(config.projectId).toBeUndefined(); // プロジェクトID分離なし
    });
  });

  describe("SEC-007-2: 環境別セキュリティルールの分離", () => {
    it("✅ PASS: 開発環境は緩いセキュリティルール", () => {
      const devRulesPath = resolve(projectRoot, "firestore.dev.rules");

      if (existsSync(devRulesPath)) {
        const devRules = readFileSync(devRulesPath, "utf8");

        // ✅ 開発環境では一部制限が緩い
        expect(devRules).toContain(
          "// Development environment - relaxed rules",
        );
        expect(devRules).toContain("allow read: if true"); // テスト用の緩い読み取り
      }
    });

    it("✅ PASS: 本番環境は最も厳格なセキュリティルール", () => {
      const prodRulesPath = resolve(projectRoot, "firestore.prod.rules");

      if (existsSync(prodRulesPath)) {
        const prodRules = readFileSync(prodRulesPath, "utf8");

        // ✅ 本番環境では最も厳格
        expect(prodRules).toContain(
          "// Production environment - strict security",
        );
        expect(prodRules).not.toContain("allow read: if true"); // 緩い設定なし
        expect(prodRules).toContain("isAuthenticated()"); // 認証必須
      }
    });

    it("✅ PASS: ステージング環境は本番に近いルール", () => {
      const stagingRulesPath = resolve(projectRoot, "firestore.staging.rules");

      if (existsSync(stagingRulesPath)) {
        const stagingRules = readFileSync(stagingRulesPath, "utf8");

        // ✅ ステージング環境は本番に近いが一部テスト用設定
        expect(stagingRules).toContain(
          "// Staging environment - production-like with test data",
        );
        expect(stagingRules).toContain("isTestUser()"); // テストユーザー許可
      }
    });

    it("❌ FAIL: 現在は単一のセキュリティルールファイル", () => {
      // ❌ 問題: 現在はfirestore.rules一つのみ
      const devRulesExists = existsSync(
        resolve(projectRoot, "firestore.dev.rules"),
      );
      const prodRulesExists = existsSync(
        resolve(projectRoot, "firestore.prod.rules"),
      );

      expect(devRulesExists).toBe(false); // まだ存在しない
      expect(prodRulesExists).toBe(false); // まだ存在しない
    });
  });

  describe("SEC-007-3: デプロイスクリプトの環境判定", () => {
    it("✅ PASS: 環境変数による自動設定選択", () => {
      const deployScriptPath = resolve(projectRoot, "scripts/deploy.sh");

      if (existsSync(deployScriptPath)) {
        const deployScript = readFileSync(deployScriptPath, "utf8");

        // ✅ 環境変数でFirebase設定を切り替え
        expect(deployScript).toContain("NODE_ENV=development");
        expect(deployScript).toContain("NODE_ENV=staging");
        expect(deployScript).toContain("NODE_ENV=production");

        // ✅ 適切な設定ファイル選択
        expect(deployScript).toContain("firebase.dev.json");
        expect(deployScript).toContain("firebase.staging.json");
        expect(deployScript).toContain("firebase.prod.json");
      }
    });

    it("✅ PASS: 本番環境へのデプロイ時の確認プロンプト", () => {
      const deployScriptPath = resolve(projectRoot, "scripts/deploy.sh");

      if (existsSync(deployScriptPath)) {
        const deployScript = readFileSync(deployScriptPath, "utf8");

        // ✅ 本番環境デプロイ時の確認
        expect(deployScript).toContain(
          'read -p "Deploy to PRODUCTION? (yes/no): "',
        );
        expect(deployScript).toContain('if [ "$REPLY" != "yes" ]');

        // ✅ デプロイ前のセキュリティチェック
        expect(deployScript).toContain("npm run test:security");
        expect(deployScript).toContain("npm run lint");
      }
    });

    it("✅ PASS: Firebase プロジェクト自動切り替え", () => {
      const deployScriptPath = resolve(projectRoot, "scripts/deploy.sh");

      if (existsSync(deployScriptPath)) {
        const deployScript = readFileSync(deployScriptPath, "utf8");

        // ✅ Firebase プロジェクト切り替えコマンド
        expect(deployScript).toContain("firebase use tattoo-journey-dev");
        expect(deployScript).toContain("firebase use tattoo-journey-staging");
        expect(deployScript).toContain("firebase use tattoo-journey-v2");
      }
    });

    it("❌ FAIL: 現在はデプロイスクリプトが環境対応していない", () => {
      const deployScriptPath = resolve(projectRoot, "scripts/deploy.sh");

      // ❌ 問題: 現在はデプロイスクリプトが存在しないか環境対応していない
      const exists = existsSync(deployScriptPath);
      expect(exists).toBe(false); // まだ存在しない予想
    });
  });

  describe("SEC-007-4: エミュレーター設定の独立化", () => {
    it("✅ PASS: 開発環境専用エミュレーター設定", () => {
      const emulatorConfigPath = resolve(projectRoot, "firebase.emulator.json");

      if (existsSync(emulatorConfigPath)) {
        const emulatorConfig = JSON.parse(
          readFileSync(emulatorConfigPath, "utf8"),
        );

        // ✅ エミュレーター専用設定
        expect(emulatorConfig.emulators).toBeDefined();
        expect(emulatorConfig.emulators.singleProjectMode).toBe(true);

        // ✅ 開発用の高速設定
        expect(emulatorConfig.emulators.firestore.port).toBe(8080);
        expect(emulatorConfig.emulators.auth.port).toBe(9099);

        // ✅ デバッグ用の詳細ログ設定
        expect(emulatorConfig.emulators.logging).toBeDefined();
        expect(emulatorConfig.emulators.ui.enabled).toBe(true);
      }
    });

    it("✅ PASS: エミュレーター起動スクリプト", () => {
      const startEmulatorPath = resolve(
        projectRoot,
        "scripts/start-emulator.sh",
      );

      if (existsSync(startEmulatorPath)) {
        const script = readFileSync(startEmulatorPath, "utf8");

        // ✅ エミュレーター専用設定ファイル使用
        expect(script).toContain(
          "firebase emulators:start --config firebase.emulator.json",
        );

        // ✅ データインポート機能
        expect(script).toContain("--import ./emulator-data");
        expect(script).toContain("--export-on-exit ./emulator-data");
      }
    });

    it("✅ PASS: 本番設定にはエミュレーター設定が含まれない", () => {
      const prodConfigPath = resolve(projectRoot, "firebase.prod.json");

      if (existsSync(prodConfigPath)) {
        const prodConfig = JSON.parse(readFileSync(prodConfigPath, "utf8"));

        // ✅ 本番環境にはエミュレーター設定なし
        expect(prodConfig.emulators).toBeUndefined();
        expect(prodConfig).not.toHaveProperty("emulators");
      }
    });

    it("❌ FAIL: 現在はエミュレーター設定が混在", () => {
      const currentConfig = resolve(projectRoot, "firebase.json");
      const config = JSON.parse(readFileSync(currentConfig, "utf8"));

      // ❌ 問題: 現在はメイン設定ファイルにエミュレーター設定が混在
      expect(config.emulators).toBeDefined();
    });
  });

  describe("SEC-007-5: 設定管理の自動化", () => {
    it("✅ PASS: 環境設定検証スクリプト", () => {
      const validateConfigPath = resolve(
        projectRoot,
        "scripts/validate-config.js",
      );

      if (existsSync(validateConfigPath)) {
        const script = readFileSync(validateConfigPath, "utf8");

        // ✅ 設定ファイル整合性チェック
        expect(script).toContain("validateFirebaseConfig");
        expect(script).toContain("checkRequiredFields");
        expect(script).toContain("validateProjectIds");

        // ✅ セキュリティルール整合性チェック
        expect(script).toContain("validateSecurityRules");
        expect(script).toContain("checkRuleSyntax");
      }
    });

    it("✅ PASS: 設定ファイル生成スクリプト", () => {
      const generateConfigPath = resolve(
        projectRoot,
        "scripts/generate-config.js",
      );

      if (existsSync(generateConfigPath)) {
        const script = readFileSync(generateConfigPath, "utf8");

        // ✅ 環境別設定ファイル生成
        expect(script).toContain("generateDevConfig");
        expect(script).toContain("generateStagingConfig");
        expect(script).toContain("generateProdConfig");

        // ✅ テンプレートベース生成
        expect(script).toContain("configTemplate");
        expect(script).toContain("applyEnvironmentOverrides");
      }
    });

    it("✅ PASS: CI/CDでの自動設定切り替え", () => {
      const githubWorkflowPath = resolve(
        projectRoot,
        ".github/workflows/deploy.yml",
      );

      if (existsSync(githubWorkflowPath)) {
        const workflow = readFileSync(githubWorkflowPath, "utf8");

        // ✅ ブランチ別自動デプロイ
        expect(workflow).toContain("if: github.ref == 'refs/heads/develop'");
        expect(workflow).toContain("if: github.ref == 'refs/heads/staging'");
        expect(workflow).toContain("if: github.ref == 'refs/heads/main'");

        // ✅ 環境別Firebase設定使用
        expect(workflow).toContain(
          "firebase deploy --config firebase.dev.json",
        );
        expect(workflow).toContain(
          "firebase deploy --config firebase.staging.json",
        );
        expect(workflow).toContain(
          "firebase deploy --config firebase.prod.json",
        );
      }
    });

    it("❌ FAIL: 現在は手動設定管理", () => {
      // ❌ 問題: 自動化スクリプトが存在しない
      const validateExists = existsSync(
        resolve(projectRoot, "scripts/validate-config.js"),
      );
      const generateExists = existsSync(
        resolve(projectRoot, "scripts/generate-config.js"),
      );

      expect(validateExists).toBe(false); // まだ存在しない予想
      expect(generateExists).toBe(false); // まだ存在しない予想
    });
  });

  describe("SEC-007-6: 環境切り替えのテスト", () => {
    it("✅ PASS: NPMスクリプトでの環境切り替え", () => {
      const packageJsonPath = resolve(projectRoot, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      // ✅ 環境別デプロイスクリプト
      expect(packageJson.scripts["deploy:dev"]).toBeDefined();
      expect(packageJson.scripts["deploy:staging"]).toBeDefined();
      expect(packageJson.scripts["deploy:prod"]).toBeDefined();

      // ✅ 環境別エミュレーター起動
      expect(packageJson.scripts["emulator:dev"]).toBeDefined();
      expect(packageJson.scripts["emulator:staging"]).toBeDefined();

      // ✅ 設定検証スクリプト
      expect(packageJson.scripts["config:validate"]).toBeDefined();
      expect(packageJson.scripts["config:generate"]).toBeDefined();
    });

    it("✅ PASS: 環境変数での動的設定選択", () => {
      // Node.js環境での設定選択テスト
      process.env.NODE_ENV = "development";
      const devConfig = require("../../scripts/config-selector");
      expect(devConfig.configFile).toBe("firebase.dev.json");

      process.env.NODE_ENV = "production";
      const prodConfig = require("../../scripts/config-selector");
      expect(prodConfig.configFile).toBe("firebase.prod.json");
    });

    it("❌ FAIL: 現在のpackage.jsonには環境別スクリプトがない", () => {
      const packageJsonPath = resolve(projectRoot, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      // ❌ 問題: 現在は環境別デプロイスクリプトがない
      expect(packageJson.scripts["deploy:dev"]).toBeUndefined();
      expect(packageJson.scripts["deploy:staging"]).toBeUndefined();
      expect(packageJson.scripts["deploy:prod"]).toBeUndefined();
    });
  });
});
