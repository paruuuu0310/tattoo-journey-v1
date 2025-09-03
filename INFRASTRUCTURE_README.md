# 🏗️ Tattoo Journey - Infrastructure Documentation

## 📱 プロジェクト概要

**Tattoo Journey 2.0** は株式会社からもんが開発するAI搭載のタトゥーアーティストマッチングプラットフォームです。React Nativeで構築されたモバイルアプリケーションで、iOS/Android両対応のクロスプラットフォームソリューションです。

---

## 🏛️ インフラ構成

### アーキテクチャ概要

```
┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │
│   iOS App       │    │   Android App   │
│                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────┐
          │                 │
          │  React Native   │
          │   Application   │
          │                 │
          └─────────┬───────┘
                    │
          ┌─────────────────┐
          │                 │
          │   Firebase      │
          │   Backend       │
          │                 │
          └─────────┬───────┘
                    │
┌─────────────────────────────────────┐
│           Google Cloud              │
│  • Cloud Vision API                 │
│  • Cloud Functions                  │
│  • Cloud Storage                    │
│  • Cloud Firestore                  │
└─────────────────────────────────────┘
```

### 技術スタック

- **フロントエンド**: React Native 0.81+ with TypeScript
- **バックエンド**: Firebase (Firestore + Cloud Functions)
- **AI分析**: Google Cloud Vision API
- **認証**: Firebase Authentication
- **ストレージ**: Firebase Storage
- **分析**: Firebase Analytics + Crashlytics
- **地図**: Google Maps API
- **CI/CD**: GitHub Actions
- **デプロイ**: Fastlane (iOS/Android)

---

## 🚀 開発環境セットアップ

### 必要な環境

#### macOS (iOS開発必須)

- **Node.js**: 18.0.0以上
- **Xcode**: 最新安定版
- **Android Studio**: 最新安定版
- **Java**: OpenJDK 17
- **CocoaPods**: iOS依存関係管理
- **Ruby**: 3.2以上 (Fastlane用)

### 自動セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd tattoo-journey-2.0

# 開発環境を自動セットアップ
chmod +x scripts/setup-dev-env-new.sh
./scripts/setup-dev-env-new.sh
```

### 手動セットアップ

1. **Node.js依存関係をインストール**

```bash
cd mobile
npm ci
```

2. **iOS依存関係をインストール (macOSのみ)**

```bash
cd ios
pod install
cd ..
```

3. **環境設定ファイルを作成**

```bash
cp .env.example .env.local
# .env.localを編集してFirebase設定を追加
```

4. **Firebase設定**

```bash
# Firebaseプロジェクトにログイン
firebase login

# プロジェクトを初期化
firebase init
```

---

## 🔧 ビルド・デプロイ設定

### 環境別設定

#### Development (開発環境)

```bash
cd mobile
npm run android  # Android開発ビルド
npm run ios       # iOS開発ビルド
```

#### Staging (ステージング環境)

```bash
cd mobile
bundle exec fastlane ios beta     # iOS TestFlightデプロイ
bundle exec fastlane android beta # Google Play内部テスト
```

#### Production (本番環境)

```bash
# 本番デプロイスクリプト実行
./scripts/deploy-production.sh
```

### Fastlane設定

#### iOS設定 (`mobile/fastlane/Fastfile`)

- **beta**: TestFlightへの自動デプロイ
- **release**: App Storeへの自動デプロイ
- コード署名とプロビジョニングプロファイル管理

#### Android設定

- **beta**: Google Play Console内部テストへの自動デプロイ
- **release**: Google Play Store本番リリース
- Keystoreとサイニング設定

---

## 🔄 CI/CD パイプライン

### GitHub Actions ワークフロー

#### メインCI/CD (`.github/workflows/ci.yml`)

- **トリガー**: `main`、`develop`ブランチへのPush/PR
- **ジョブ**:
  1. `lint-and-test`: コード品質チェックとテスト
  2. `security-scan`: セキュリティスキャン
  3. `ios-build`: iOS TestFlight/App Storeデプロイ
  4. `android-build`: Google Play Console デプロイ
  5. `notify`: Slack通知

#### 手動デプロイ (`.github/workflows/manual-deploy.yml`)

- **トリガー**: GitHub Actions手動実行
- **オプション**: Platform選択 (iOS/Android/Both)
- **環境**: Staging/Production選択

### 必要なGitHub Secrets

#### Firebase設定

- `GOOGLE_SERVICES_JSON`: Android Firebase設定
- `GOOGLE_SERVICES_JSON_STAGING`: Android Staging Firebase設定
- `GOOGLE_SERVICES_INFO_PLIST`: iOS Firebase設定
- `GOOGLE_SERVICES_INFO_PLIST_STAGING`: iOS Staging Firebase設定

#### iOS設定

- `APPLE_ID`: Apple Developer アカウント
- `APPLE_TEAM_ID`: Apple Team ID
- `IOS_CERTIFICATES_P12`: iOS証明書 (Base64エンコード)
- `IOS_CERTIFICATES_PASSWORD`: iOS証明書パスワード
- `IOS_PROVISIONING_PROFILE`: プロビジョニングプロファイル (Base64)
- `IOS_PROVISIONING_PROFILE_STAGING`: Staging用プロビジョニングプロファイル

#### Android設定

- `ANDROID_KEYSTORE`: Androidキーストア (Base64エンコード)
- `ANDROID_KEYSTORE_PASSWORD`: キーストアパスワード
- `ANDROID_KEY_ALIAS`: キーエイリアス
- `ANDROID_KEY_PASSWORD`: キーパスワード
- `GOOGLE_PLAY_JSON_KEY`: Google Play Service Account JSON (Base64)

#### 通知設定

- `SLACK_WEBHOOK_URL`: Slack Webhook URL
- `CODECOV_TOKEN`: Codecovトークン

---

## 📊 監視・運用

### Firebase監視

#### Crashlytics (クラッシュレポート)

- **本番環境**: 全クラッシュレポートの収集
- **ステージング**: デバッグ情報付きレポート
- **開発環境**: ローカルログのみ

#### Analytics (分析)

- **ユーザー行動分析**: 画面遷移、機能利用率
- **パフォーマンス監視**: 読み込み時間、レスポンス時間
- **カスタムイベント**: マッチング、予約、レビュー

#### Performance Monitoring

- **ネットワーク**: API呼び出しのレスポンス時間
- **画面描画**: 画面読み込み時間
- **カスタムトレース**: 重要な処理のパフォーマンス

### 監視設定ファイル

#### メイン監視ライブラリ (`mobile/src/lib/monitoring.ts`)

- `PerformanceMonitor`: パフォーマンス追跡
- `ErrorMonitor`: エラーログとクラッシュレポート
- `AnalyticsMonitor`: ユーザー行動分析
- `HealthMonitor`: アプリヘルスチェック
- `NetworkMonitor`: ネットワークリクエスト監視

#### 設定ファイル (`mobile/src/config/monitoring.config.ts`)

- 環境別監視設定 (Development/Staging/Production)
- イベント定義とパフォーマンストレース設定
- エラーカテゴリとカスタム属性

---

## 🔒 セキュリティ設定

### Firebase Security Rules

#### Firestore Rules (`firestore.rules`)

- ユーザー認証ベースのアクセス制御
- ロールベース権限管理 (顧客/アーティスト/管理者)
- データ検証とサニタイゼーション

#### Storage Rules (`storage.rules`)

- 認証済みユーザーのみアップロード許可
- ファイルサイズとタイプ制限
- ユーザー固有パスアクセス制御

#### Database Rules (`database.rules.json`)

- リアルタイムチャット用アクセス制御
- メッセージ履歴の適切な権限設定

### 環境分離

#### 開発環境

- 緩いセキュリティ設定（デバッグ用）
- テストデータアクセス許可
- 詳細ログ有効

#### ステージング環境

- 本番と同等のセキュリティ設定
- テスターアカウントのみアクセス
- 分析データ収集有効

#### 本番環境

- 最強セキュリティ設定
- 本番ユーザーのみアクセス
- 最小限のログ出力

---

## 🛠️ 開発ワークフロー

### ブランチ戦略

```
main (本番)
├── develop (開発)
│   ├── feature/auth-system
│   ├── feature/ai-matching
│   └── feature/chat-system
├── hotfix/critical-fix
└── release/v1.0.0
```

### 開発プロセス

1. **Feature Branch作成**: `feature/新機能名`
2. **開発**: ローカル開発とテスト
3. **PR作成**: `develop`ブランチへPull Request
4. **CI実行**: 自動テストとコード品質チェック
5. **レビュー**: コードレビューと承認
6. **Merge**: `develop`ブランチにマージ
7. **Staging Deploy**: 自動ステージングデプロイ
8. **QAテスト**: ステージング環境でのテスト
9. **Release PR**: `main`ブランチへPull Request
10. **Production Deploy**: 本番環境への自動デプロイ

### 品質管理

- **ESLint**: コード品質とスタイル統一
- **TypeScript**: 型安全性の確保
- **Jest**: 単体テストとカバレッジ
- **Detox** (将来): E2Eテスト
- **Husky**: Git Hooks でプリコミットチェック

---

## 📚 追加リソース

### ドキュメント

- [CLAUDE.md](./CLAUDE.md): プロジェクト全体仕様
- [CLAUDE.rule](./CLAUDE.rule): 開発ルールとガイドライン
- [SECURITY\_\*.md](./docs/security/): セキュリティ実装詳細
- [TICKET_MANAGEMENT.md](./TICKET_MANAGEMENT.md): タスク管理

### スクリプト

- `scripts/setup-dev-env-new.sh`: 開発環境自動セットアップ
- `scripts/deploy-production.sh`: 本番デプロイスクリプト
- `scripts/validate-config.js`: 設定ファイル検証

### 設定ファイル

- `mobile/.env.example`: 環境変数テンプレート
- `mobile/app.config.js`: Expo/React Native設定
- `mobile/eas.json`: EAS Build設定
- `firebase.json`: Firebase プロジェクト設定

---

## 🆘 トラブルシューティング

### よくある問題と解決策

#### iOS Build エラー

```bash
# CocoaPodsキャッシュクリア
cd mobile/ios
rm -rf Pods Podfile.lock
pod install

# Xcodeキャッシュクリア
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

#### Android Build エラー

```bash
# Gradleキャッシュクリア
cd mobile/android
./gradlew clean
cd ..

# Metro キャッシュクリア
npx react-native start --reset-cache
```

#### Firebase接続エラー

```bash
# Firebase再ログイン
firebase logout
firebase login

# プロジェクト設定確認
firebase projects:list
firebase use project-id
```

### サポート連絡先

- **開発チーム**: dev-team@karamon.co.jp
- **インフラチーム**: infra@karamon.co.jp
- **緊急対応**: emergency@karamon.co.jp

---

## 📄 ライセンス

このプロジェクトは株式会社からもんの所有物です。無断複製・転載を禁じます。

---

**🎨 Happy Coding! - 株式会社からもん開発チーム**
