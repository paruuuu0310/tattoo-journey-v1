# 🚀 Deployment Guide - Tattoo Journey Mobile App

## 📋 概要

このガイドは、Tattoo Journey React Nativeアプリケーションのデプロイメント手順を詳細に説明します。iOS（App Store）とAndroid（Google Play Store）の両プラットフォームでの本番リリースプロセスを網羅しています。

---

## 🏗️ 前提条件

### 必要なアカウント・ツール

- [x] Apple Developer Account（iOS用）
- [x] Google Play Console Account（Android用）
- [x] Firebase プロジェクト
- [x] GitHub リポジトリアクセス
- [x] Slack Webhook URL（通知用）

### 必要な環境

- [x] macOS（iOS開発用）
- [x] Node.js 18+
- [x] Xcode 最新版
- [x] Android Studio
- [x] Fastlane
- [x] Firebase CLI

---

## 📱 デプロイメント方法

### 🎯 Method 1: 自動デプロイ（推奨）

#### GitHub Actions による自動デプロイ

```bash
# main ブランチにマージすると自動で本番デプロイ
git checkout main
git pull origin main
git merge develop
git push origin main
# → 自動的にiOS App Store + Google Play Store デプロイ

# develop ブランチにマージするとステージングデプロイ
git checkout develop
git merge feature/new-feature
git push origin develop
# → 自動的にTestFlight + Google Play内部テスト デプロイ
```

#### 手動トリガーによるデプロイ

1. **GitHub ActionsのManual Deployを実行**
   - GitHubリポジトリの「Actions」タブを開く
   - 「Manual Deployment」ワークフローを選択
   - 「Run workflow」をクリック
   - 以下のパラメータを設定:
     - **Platform**: `both` (iOS + Android)
     - **Environment**: `production`
     - **Track**: `production` (Android用)

### 🎯 Method 2: ローカルデプロイ

#### 本番リリーススクリプト実行

```bash
# 本番デプロイスクリプトを実行
./scripts/deploy-production.sh

# ロールバックが必要な場合
./scripts/deploy-production.sh --rollback
```

#### 段階的デプロイ

```bash
cd mobile

# iOS のみデプロイ
bundle exec fastlane ios release

# Android のみデプロイ
bundle exec fastlane android release

# ステージングテスト
bundle exec fastlane ios beta
bundle exec fastlane android beta
```

---

## 🔧 デプロイ前チェックリスト

### ✅ コード品質

```bash
cd mobile

# 型チェック
npm run type-check

# リント
npm run lint

# テスト実行
npm run test
npm run test:security

# セキュリティ監査
npm audit --audit-level=high
```

### ✅ 設定ファイル確認

```bash
# 環境変数設定
cat .env.local

# Firebase設定確認
firebase projects:list
firebase use your-project-id

# Google Services設定
ls android/app/google-services.json
ls ios/GoogleService-Info.plist
```

### ✅ ビルド確認

```bash
# iOS ビルドテスト
npx react-native run-ios --configuration Release --dry-run

# Android ビルドテスト
npx react-native run-android --variant=release --dry-run
```

---

## 📊 環境別デプロイ詳細

### 🧪 Development Environment

```bash
# 開発環境での動作確認
cd mobile
npm start
npm run ios     # iOS シミュレーター
npm run android # Android エミュレーター
```

**特徴:**

- ホットリロード有効
- デバッグモード
- ローカルFirebase Emulator使用
- 詳細ログ出力

### 🔬 Staging Environment

```bash
# ステージング環境デプロイ
cd mobile
bundle exec fastlane ios beta     # TestFlight
bundle exec fastlane android beta # Internal Testing
```

**特徴:**

- 本番と同じFirebase設定
- 限定テスターのみアクセス
- CrashlyticsとAnalytics有効
- パフォーマンス監視有効

**デプロイ後確認:**

- [ ] TestFlightでiOSアプリが利用可能
- [ ] Google Play Console で内部テスト版が利用可能
- [ ] Firebase Analytics でイベント確認
- [ ] Crashlytics でクラッシュレポート確認

### 🚀 Production Environment

```bash
# 本番環境デプロイ
./scripts/deploy-production.sh
```

**特徴:**

- App Store と Google Play Store での一般公開
- 最高セキュリティ設定
- 最小限のログ出力
- パフォーマンス重視設定

**デプロイ後確認:**

- [ ] App Store でアプリが利用可能（審査通過後）
- [ ] Google Play Store でアプリが利用可能
- [ ] Firebase Analytics で本番ユーザー確認
- [ ] Performance Monitoring 正常動作確認

---

## 🔑 Secrets & Configuration

### GitHub Secrets 設定

#### Firebase設定

```bash
# Android Firebase設定 (Base64エンコード済み)
GOOGLE_SERVICES_JSON=<base64-encoded-google-services.json>
GOOGLE_SERVICES_JSON_STAGING=<base64-encoded-google-services-staging.json>

# iOS Firebase設定 (Base64エンコード済み)
GOOGLE_SERVICES_INFO_PLIST=<base64-encoded-GoogleService-Info.plist>
GOOGLE_SERVICES_INFO_PLIST_STAGING=<base64-encoded-GoogleService-Info-staging.plist>
```

#### iOS設定

```bash
APPLE_ID=your-apple-id@example.com
APPLE_TEAM_ID=ABC123DEF4
IOS_CERTIFICATES_P12=<base64-encoded-certificates.p12>
IOS_CERTIFICATES_PASSWORD=your-cert-password
IOS_PROVISIONING_PROFILE=<base64-encoded-profile.mobileprovision>
IOS_PROVISIONING_PROFILE_STAGING=<base64-encoded-staging-profile.mobileprovision>
```

#### Android設定

```bash
ANDROID_KEYSTORE=<base64-encoded-release.keystore>
ANDROID_KEYSTORE_PASSWORD=your-keystore-password
ANDROID_KEY_ALIAS=your-key-alias
ANDROID_KEY_PASSWORD=your-key-password
GOOGLE_PLAY_JSON_KEY=<base64-encoded-service-account.json>
```

### Base64エンコード例

```bash
# ファイルをBase64にエンコード
base64 -i android/app/google-services.json | pbcopy
base64 -i ios/GoogleService-Info.plist | pbcopy
base64 -i android/app/release.keystore | pbcopy
```

---

## 📈 リリース後の監視

### パフォーマンス監視

#### Firebase Performance

```bash
# パフォーマンス監視確認
firebase performance:get
```

**監視項目:**

- アプリ起動時間
- 画面読み込み時間
- ネットワークリクエスト時間
- カスタムパフォーマンストレース

#### Firebase Crashlytics

```bash
# クラッシュレポート確認
firebase crashlytics:get
```

**監視項目:**

- アプリクラッシュ率
- エラー発生頻度
- ユーザー影響度
- デバイス固有の問題

### ユーザー分析

#### Firebase Analytics

**重要メトリクス:**

- アクティブユーザー数（DAU/MAU）
- セッション継続時間
- ユーザー保持率
- コンバージョンファネル

#### カスタムイベント監視

```typescript
// 重要なビジネスメトリクス
-auth_login_success -
  search_completed -
  booking_confirmed -
  review_submitted -
  error_occurred;
```

---

## 🆘 トラブルシューティング & ロールバック

### よくある問題と解決策

#### iOS デプロイエラー

**証明書の問題**

```bash
# 証明書の確認・更新
fastlane match --readonly
fastlane match development --force_for_new_devices
```

**Xcode ビルドエラー**

```bash
# キャッシュクリア
rm -rf ~/Library/Developer/Xcode/DerivedData/*
cd mobile/ios && rm -rf Pods Podfile.lock && pod install
```

#### Android デプロイエラー

**署名の問題**

```bash
# Keystore確認
keytool -list -v -keystore android/app/release.keystore

# Gradle キャッシュクリア
cd mobile/android && ./gradlew clean
```

**Google Play Console エラー**

```bash
# AABファイル確認
ls -la android/app/build/outputs/bundle/release/
```

### 緊急ロールバック手順

#### 1. 自動ロールバック

```bash
# デプロイスクリプトのロールバック機能
./scripts/deploy-production.sh --rollback
```

#### 2. マニュアルロールバック

**iOS (App Store Connect)**

1. App Store Connect にログイン
2. 該当アプリを選択
3. 「App Store」タブ → 以前のバージョンを選択
4. 「このバージョンを送信」

**Android (Google Play Console)**

1. Google Play Console にログイン
2. 該当アプリを選択
3. 「リリース管理」→「アプリリリース」
4. 以前のリリースを「本番環境にロールアウト」

#### 3. 緊急通知

```bash
# Slack通知（手動）
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 緊急: アプリのロールバックを実行しました"}' \
    $SLACK_WEBHOOK_URL
```

---

## 📋 デプロイ後チェックリスト

### ✅ 技術的確認

- [ ] アプリストアでの可用性確認
- [ ] 主要機能の動作テスト
- [ ] Firebase接続確認
- [ ] プッシュ通知テスト
- [ ] パフォーマンス指標確認
- [ ] エラーレート監視

### ✅ ビジネス確認

- [ ] ユーザー登録フロー
- [ ] マッチングアルゴリズム
- [ ] チャット機能
- [ ] 予約システム
- [ ] 支払いフロー（将来実装）
- [ ] レビューシステム

### ✅ 監視設定

- [ ] Crashlytics アラート設定
- [ ] Analytics ダッシュボード確認
- [ ] Performance 閾値設定
- [ ] エラー通知設定

---

## 📞 サポート・連絡先

### 開発チーム

- **テクニカル**: dev-team@karamon.co.jp
- **インフラ**: infra@karamon.co.jp
- **緊急対応**: emergency@karamon.co.jp

### 外部サービス

- **Apple Developer Support**: developer.apple.com/support
- **Google Play Support**: support.google.com/googleplay/android-developer
- **Firebase Support**: firebase.google.com/support

---

## 📚 関連ドキュメント

- [INFRASTRUCTURE_README.md](./INFRASTRUCTURE_README.md) - インフラ全体ドキュメント
- [CLAUDE.md](./CLAUDE.md) - プロジェクト仕様書
- [SECURITY\_\*.md](./docs/security/) - セキュリティガイド
- [mobile/README.md](./mobile/README.md) - アプリ開発ガイド

---

**🎯 Happy Deploying! - 株式会社からもん**
