# Tattoo Journey 2.0 Mobile App - テスト実行ガイド

## 概要

このドキュメントは、Tattoo Journey 2.0 Mobile Appの包括的なテストシステムについて説明します。

## テストアーキテクチャ

### テストの種類

1. **Firebase接続テスト** - データベース、ストレージ、認証機能のテスト
2. **アプリケーション機能テスト** - AI解析、マッチング、予約、チャット、レビューなどの機能テスト
3. **エンドツーエンドテスト** - アプリケーション全体の統合テスト
4. **ユーザージャーニーテスト** - 実際のユーザー使用パターンの完全な再現テスト

### テストデータ

- **テストユーザー**: `src/test-data/testUsers.ts`
  - お客様: 田中太郎 (test-customer-001)
  - アーティスト: 鈴木美咲 (test-artist-001)
  - その他競合アーティスト

- **モックAIレスポンス**: `src/test-data/mockAIResponses.ts`
  - Google Vision API のモックレスポンス
  - 各タトゥースタイルの期待される解析結果

## テスト実行方法

### 1. 個別テスト実行

```bash
# Firebase接続テスト
npm run test:firebase

# アプリケーション機能テスト
npm run test:e2e

# ユーザージャーニーテスト
npm run test:journey
```

### 2. 全テスト実行

```bash
# 全てのテストを順次実行
npm run test:all
```

### 3. Jest単体テスト

```bash
# 通常のJestテスト
npm run test
```

## テストファイル構成

```
mobile/
├── src/
│   ├── test-data/
│   │   ├── testUsers.ts           # テストユーザーデータ
│   │   └── mockAIResponses.ts     # モックAIレスポンス
│   ├── test-utils/
│   │   ├── TestRunner.ts          # メインテストランナー
│   │   └── FirebaseTestUtils.ts   # Firebase接続テストユーティリティ
│   └── services/
│       └── CrashlyticsService.ts  # エラーレポーティング
├── test-execution/
│   ├── runFirebaseTests.js        # Firebase接続テスト実行スクリプト
│   ├── runEndToEndTests.js        # エンドツーエンドテスト実行スクリプト
│   ├── userJourneyTest.js         # ユーザージャーニーテスト
│   └── testResults.json          # テスト結果記録
└── TEST_README.md                # このファイル
```

## テストシナリオ詳細

### 1. Firebase接続テスト

**対象サービス:**

- Firestore（CRUD操作、クエリ）
- Realtime Database（読み書き、リアルタイムリスナー）
- Storage（アップロード、ダウンロード、メタデータ）
- Authentication（匿名認証、ユーザー状態管理）

**テスト内容:**

- 各サービスの接続確認
- CRUD操作の動作確認
- パフォーマンス測定
- エラーハンドリング確認

### 2. アプリケーション機能テスト

**テストスイート:**

#### AI画像解析テスト

- ミニマル・ライン解析
- 和彫り（桜）解析
- レタリング・スクリプト解析

#### マッチング機能テスト

- 基本マッチングアルゴリズム
- 距離フィルタリング（最大20km）
- 価格フィルタリング（予算内）

#### 予約フローテスト

- 予約リクエスト作成
- アーティストによる予約確認

#### チャット機能テスト

- チャットルーム作成
- メッセージ送受信

#### レビュー機能テスト

- レビュー投稿
- アーティストレビュー取得

#### 位置情報機能テスト

- 現在位置取得
- アーティストとの距離計算

### 3. ユーザージャーニーテスト

**完全なユーザーフロー:**

1. **お客様登録**: テストユーザー作成とプロフィール設定
2. **画像アップロード**: 参考画像をアップロードしAI解析実行
3. **アーティスト検索**: AI解析結果に基づくマッチング実行
4. **アーティスト選択**: マッチ度の高いアーティストを選択
5. **予約作成**: 希望日時での予約リクエスト作成
6. **チャット開始**: アーティストとの詳細相談
7. **予約確定**: アーティストによる予約承認
8. **サービス完了**: タトゥー施術完了の模擬
9. **レビュー投稿**: 5段階評価とコメント投稿

## テスト結果の確認

### コンソール出力

各テスト実行時に詳細な進捗とテスト結果がコンソールに表示されます：

```
🧪 エンドツーエンドテスト開始
================================

📋 Phase 1: Firebase接続とデータ永続化テスト
-----------------------------------------------
🔥 Firebase Test Results
Total Tests: 20
Passed: 19
Failed: 1
Success Rate: 95.0%
...
```

### テスト結果ファイル

`test-execution/testResults.json`に詳細なテスト結果が記録されます。

## 環境要件

### 開発環境

- Node.js >= 18
- React Native 0.81.0
- Firebase SDK 23.1.2
- TypeScript 5.8.3

### Firebase設定

- Firebase プロジェクト設定
- Firestore Database
- Realtime Database
- Storage
- Authentication

### 必要な権限

- 位置情報アクセス権限
- カメラ/画像ライブラリアクセス権限
- インターネット接続

## トラブルシューティング

### よくある問題

1. **Firebase接続エラー**
   - `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)の配置確認
   - Firebase プロジェクト設定の確認

2. **テストデータが見つからない**
   - `npm run test:firebase`でテストデータの投入確認

3. **権限エラー**
   - 位置情報、カメラの権限設定確認

### ログ確認

詳細なエラー情報は以下で確認できます：

- React Native デバッガー
- Firebase Console
- CrashlyticsService によるクラッシュレポート

## 継続的インテグレーション (CI)

### GitHub Actions (推奨設定)

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm run test:all
```

## 成功基準

### 合格基準

- Firebase接続テスト: 成功率 95% 以上
- アプリケーション機能テスト: 全テスト合格
- ユーザージャーニーテスト: 全ステップ完了

### パフォーマンス基準

- AI画像解析: 5秒以内
- マッチング処理: 3秒以内
- Firebase操作: 2秒以内

## 更新履歴

- v2.0.0: 包括的テストシステム実装
- テストデータ、モックレスポンス、Firebase接続テスト追加
- ユーザージャーニーテスト完全実装
- CrashlyticsService によるエラー追跡機能追加
