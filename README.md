# Tattoo Journey 2.0 🎨

AI-powered tattoo artist matching and booking platform - 次世代タトゥーアーティスト検索・予約プラットフォーム

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/karamon/tattoo-journey-2.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%26%20Mobile-orange.svg)](#platforms)

## 🌟 概要

**Tattoo Journey 2.0**は、AIを活用してお客様と最適なタトゥーアーティストをマッチングし、スムーズな予約体験を提供するプラットフォームです。

### ✨ 主要機能

- 🤖 **AI画像解析**: Google Vision APIによる参考画像の自動スタイル判定
- 🎯 **スマートマッチング**: アーティストの専門性・評価・距離を総合評価
- 📱 **クロスプラットフォーム**: Web（Next.js）+ モバイル（React Native）
- 💬 **リアルタイムチャット**: Firebase Realtime Databaseによる即座の連絡
- ⭐ **5段階評価システム**: 技術・コミュニケーション・清潔感など多角的評価
- 📍 **位置情報検索**: 最大検索範囲内での地図ベース検索

## 🏗️ プロジェクト構造

```
tattoo-journey-2.0/
├── 🌐 web/                    # Next.js Webアプリ
│   ├── src/                   # Web専用ソースコード
│   ├── package.json           # Web依存関係
│   └── next.config.js         # Next.js設定
├── 📱 mobile/                 # React Native モバイルアプリ
│   ├── src/                   # モバイル専用ソースコード
│   ├── android/               # Android固有設定
│   ├── ios/                   # iOS固有設定
│   └── package.json           # モバイル依存関係
├── 🔗 shared/                 # プラットフォーム間共通コード
│   └── types.ts               # 共通型定義
├── 🏭 infrastructure/         # Firebase・デプロイ設定
│   ├── configs/               # 環境別Firebase設定
│   ├── rules/                 # Firebaseセキュリティルール
│   ├── functions/             # Cloud Functions
│   └── deploy.sh              # 環境別デプロイスクリプト
├── 📚 docs/                   # プロジェクト文書
│   ├── setup/                 # セットアップガイド
│   ├── architecture/          # アーキテクチャ設計
│   ├── security/              # セキュリティ仕様
│   ├── testing/               # テスト指針
│   └── project-management/    # プロジェクト管理
└── 🛠️ scripts/               # ビルド・開発用スクリプト
```

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0+
- npm 8.0+
- React Native CLI
- Android Studio（Android開発時）
- Xcode（iOS開発時）
- Firebase CLI

### 1. プロジェクトセットアップ

```bash
# リポジトリクローン
git clone https://github.com/karamon/tattoo-journey-2.0.git
cd tattoo-journey-2.0

# 全依存関係インストール
npm run install:all

# 開発環境セットアップ
npm run setup
```

### 2. 開発サーバー起動

**Web開発**:

```bash
npm run dev:web
# → http://localhost:3000
```

**モバイル開発**:

```bash
# iOS
npm run dev:mobile:ios

# Android
npm run dev:mobile:android

# Metro bundler only
npm run dev:mobile
```

## 🧪 テスト実行

### 包括的テストスイート

```bash
# 全プラットフォームテスト
npm run test

# Firebase接続テスト
npm run test:firebase

# エンドツーエンドテスト
npm run test:e2e

# ユーザージャーニーテスト
npm run test:journey
```

## 🚢 デプロイ

### 環境別デプロイ

```bash
# 開発環境
npm run deploy:dev

# ステージング環境
npm run deploy:staging

# 本番環境
npm run deploy:prod
```

## 🛠️ 技術スタック

### フロントエンド

- **Web**: Next.js 15.5, React 19, TypeScript, Tailwind CSS
- **モバイル**: React Native 0.81, TypeScript

### バックエンド・インフラ

- **Database**: Firebase Firestore, Realtime Database
- **Authentication**: Firebase Auth
- **Storage**: Firebase Cloud Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Firebase Hosting

### AI・外部API

- **画像解析**: Google Cloud Vision API
- **地図**: Google Maps API
- **位置情報**: React Native Geolocation

### 開発・品質管理

- **Testing**: Jest, Firebase Test SDK
- **Linting**: ESLint, Prettier
- **Git Hooks**: Husky, lint-staged
- **CI/CD**: Firebase CLI, GitHub Actions

## 📖 詳細ドキュメント

| カテゴリー           | ドキュメント                                       | 説明                   |
| -------------------- | -------------------------------------------------- | ---------------------- |
| **セットアップ**     | [開発環境構築](docs/setup/DEVELOPMENT_SETUP.md)    | 開発環境の構築手順     |
| **アーキテクチャ**   | [システム設計](docs/architecture/DESIGN_SYSTEM.md) | UI/UXデザインシステム  |
| **セキュリティ**     | [セキュリティガイド](docs/security/)               | セキュリティ実装仕様   |
| **テスト**           | [テスト戦略](docs/testing/TEST_README.md)          | 包括的テスト戦略       |
| **プロジェクト管理** | [チケット管理](docs/project-management/)           | 開発チケット・進捗管理 |

## 🔧 主要コマンド

```bash
# 開発
npm run dev:web              # Web開発サーバー
npm run dev:mobile:ios       # iOSシミュレーター
npm run dev:mobile:android   # Androidエミュレーター

# ビルド
npm run build:web            # Web本番ビルド
npm run build:mobile         # モバイルアプリビルド

# 品質チェック
npm run lint                 # コード品質チェック
npm run type-check           # TypeScript型チェック
npm run format               # コード整形

# テスト
npm run test                 # 全テスト実行
npm run test:firebase        # Firebase接続テスト
npm run test:e2e             # エンドツーエンドテスト

# メンテナンス
npm run clean                # キャッシュ・ビルド成果物削除
npm run install:all          # 全依存関係再インストール
```

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

1. **Issue報告**: バグ・機能要望は[Issues](https://github.com/karamon/tattoo-journey-2.0/issues)で報告
2. **Pull Request**: 機能追加・修正は[PR](https://github.com/karamon/tattoo-journey-2.0/pulls)で送信
3. **コーディング規約**: ESLint・Prettier設定に準拠
4. **コミット規約**: Conventional Commits形式

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 📞 サポート

- **開発会社**: [株式会社からもん](https://karamon.co.jp)
- **技術サポート**: [GitHub Issues](https://github.com/karamon/tattoo-journey-2.0/issues)
- **ビジネス問い合わせ**: contact@karamon.co.jp

---

**Tattoo Journey 2.0** - 次世代のタトゥーアーティスト検索体験を提供 🎨✨
