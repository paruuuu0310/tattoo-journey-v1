# Tattoo Journey 2.0 - ファイル整理・クリーンアップ推奨案

## 📋 分析サマリー

プロジェクト内のファイル構造を分析し、重複ファイル、対策済みファイル、不要ファイルを特定しました。

## 🔥 緊急削除推奨（重複ファイル）

### 1. ドキュメント重複

```bash
# 削除対象（ルートに正式版が存在）
rm -rf docs/CLAUDE.md
rm -rf docs/CLAUDE.rule
rm -rf docs/PROJECT_TICKETS.md
```

**理由**: ルートディレクトリに正式版が存在し、`docs/`内は古いコピー

### 2. Android/iOSアプリ重複ディレクトリ

```bash
# 削除対象（名前に数字がついた不明なコピー）
rm -rf mobile/android/app\ 2/
rm -rf mobile/ios/TattooJourneyMobile\ 2/
```

**理由**: 開発中に誤って作成されたコピー。正常版のみ残す

## ⚠️ 慎重検討が必要（Firebase設定）

### Firebase環境別設定ファイル

現在の状態:

- `firebase.json` (メイン)
- `firebase.dev.json`, `firebase.staging.json`, `firebase.prod.json`, `firebase.emulator.json`
- `firestore.rules`, `firestore.dev.rules`, `firestore.staging.rules`, `firestore.prod.rules`
- `storage.rules`, `storage.dev.rules`, `storage.staging.rules`, `storage.prod.rules`

**推奨対応**:

1. **開発中**: 現状維持（環境別設定が必要）
2. **本番運用時**: 使用しない環境の設定ファイルを削除

## ✅ 保持推奨（機能完了済みだが重要）

### 完了済み重要ファイル

- `SECURITY_*` ファイル群 → **保持** (セキュリティ文書として重要)
- `TEST_README.md` → **保持** (テスト手順書として重要)
- `DEVELOPMENT_SETUP.md` → **保持** (開発環境構築ガイド)
- `test-execution/` ディレクトリ → **保持** (テストシステムとして重要)

## 🗑️ 安全に削除可能

### 1. node_modules (再生成可能)

```bash
# 削除後、npm installで復元可能
rm -rf node_modules/
rm -rf mobile/node_modules/
```

### 2. ビルド成果物 (再生成可能)

```bash
# iOS
rm -rf mobile/ios/build/
rm -rf mobile/ios/DerivedData/

# Android
rm -rf mobile/android/app/build/
rm -rf mobile/android/build/
rm -rf mobile/android/.gradle/
```

### 3. 一時ファイル・キャッシュ

```bash
# TypeScript
rm -f tsconfig.tsbuildinfo

# npm/yarn
rm -f package-lock.json  # npm install後に再生成
rm -f yarn.lock          # yarn install後に再生成
```

## 📦 .gitignore 更新推奨

重複作成を防ぐため、以下を`.gitignore`に追加:

```gitignore
# 重複防止
docs/CLAUDE.*
docs/PROJECT_TICKETS.md

# ビルド成果物
mobile/ios/build/
mobile/ios/DerivedData/
mobile/android/app/build/
mobile/android/build/
mobile/android/.gradle/

# 一時ファイル
tsconfig.tsbuildinfo
*.tmp
*\ 2/
```

## 🚀 実行手順

### Phase 1: 緊急削除（即座に実行可能）

```bash
cd "/Users/paru/Library/Mobile Documents/com~apple~CloudDocs/株式会社からもん/アプリ一覧/tattoo Journey 2.0"

# ドキュメント重複削除
rm -rf docs/CLAUDE.md docs/CLAUDE.rule docs/PROJECT_TICKETS.md

# アプリ重複ディレクトリ削除
rm -rf "mobile/android/app 2"
rm -rf "mobile/ios/TattooJourneyMobile 2"
```

### Phase 2: キャッシュ・ビルド成果物削除

```bash
# ビルド成果物削除
rm -rf mobile/ios/build mobile/ios/DerivedData
rm -rf mobile/android/app/build mobile/android/build mobile/android/.gradle

# 一時ファイル削除
rm -f tsconfig.tsbuildinfo
```

### Phase 3: node_modules再構築（必要時）

```bash
# 完全クリーン＆再インストール
rm -rf node_modules mobile/node_modules
npm install
cd mobile && npm install
```

## 📊 期待される効果

- **ディスクスペース削減**: 約1-2GB削減見込み
- **プロジェクト構造の明確化**: 重複による混乱解消
- **ビルド時間短縮**: 不要ファイルの除外
- **Git管理の効率化**: 追跡ファイル数の削減

## ⚠️ 注意事項

1. **バックアップ**: 削除前に重要データのバックアップ推奨
2. **段階実行**: Phase 1から順次実行し、各段階で動作確認
3. **チーム確認**: 他の開発者との調整が必要な場合は事前相談
4. **Firebase設定**: 環境別設定は本番運用開始まで保持推奨

## 🎯 最終目標

- クリーンで保守しやすいプロジェクト構造の実現
- 開発効率の向上
- デプロイメントプロセスの最適化
