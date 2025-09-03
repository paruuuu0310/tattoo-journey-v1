# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

**Tattoo Journey 2.0** - 株式会社からもんが開発するTattooレコメンド機能に特化したマッチングプラットフォーム（React Nativeモバイルアプリ）

## 要件定義

### 基本ビジネス要件

#### 1. ユーザータイプ

- **お客様**: タトゥーを入れたい人
- **アーティスト**: タトゥー施術者
- **オーナー**: スタジオ経営者

#### 2. コアレコメンド機能

AIによる画像解析とタグベースのマッチングシステム:

- **デザインスタイル**: リアリズム、トラディショナル、ジャパニーズ等の分析
- **場所/地域**: GPS連携による位置情報マッチング
- **予算帯**: 価格適合度によるフィルタリング
- **サイズ感**: タトゥーサイズの分析・マッチング
- **アーティストの経験年数/評価**: レビューシステム統合
- **過去の作品の類似度**: AI画像解析による類似度判定

#### 3. AIレコメンドアルゴリズム

**マッチングスコア算出方式**:

- **デザイン類似度**: 40% (AI画像解析)
- **アーティスト評価**: 30% (レビュー・経験)
- **料金適合度**: 20% (予算マッチング)
- **距離**: 10% (GPS位置)

#### 4. AI画像解析詳細

**Google Cloud Vision API**を使用:

- **対象画像**: お客様アップロード画像 + アーティストポートフォリオ
- **解析要素**:
  - スタイル分類 (リアリズム、オールドスクール、ネオトラディショナル等)
  - 色彩パターン (カラー/モノクロ、使用色)
  - モチーフ/テーマ (動物、花、文字等)
  - 複雑さレベル (シンプル/複雑)

### 技術要件

#### 技術スタック

- **フロントエンド**: React Native 0.81+ with TypeScript
- **バックエンド**: Firebase (Firestore + Authentication + Storage + Realtime)
- **AI解析**: Google Cloud Vision API
- **マップ**: Google Maps API
- **画像**: Firebase Storage
- **言語**: TypeScript (完全型安全性)
- **プラットフォーム**: iOS & Android ネイティブアプリ

#### アーキテクチャ仕様

- **データベース**: Firestore (NoSQL) with セキュリティルール
- **認証**: Firebase Authentication (Email/Password + Google)
- **ファイル ストレージ**: Firebase Storage (画像・ポートフォリオ)
- **リアルタイム**: Firebase Realtime Database (メッセージング)
- **API設計**: Firebase SDK + Google Cloud Vision API
- **状態管理**: React Context + カスタムフック

### 機能要件

#### 1. 認証・ユーザー管理

- **ユーザー登録**: 自由登録制（審査なし）
- **ユーザータイプ**: お客様・アーティスト・オーナー
- **プロフィール管理**: 位置情報・連絡先・自己紹介
- **Firebase認証**: Email/Password + Google Sign-In

#### 2. アーティスト機能

- **ポートフォリオ管理**: 最低10枚の作品画像
- **自動タグ付け**: Google Cloud Vision APIによる画像解析
- **半自動タグ調整**: アーティストによる手動補正
- **スケジュール管理**: 空き時間設定
- **料金設定**: サイズ別・時間別料金
- **得意スタイル設定**: 専門分野の自己申告

#### 3. マッチング・レコメンド機能

- **画像アップロード**: お客様の希望デザイン
- **AI画像解析**: Google Cloud Vision API
- **スコア算出**: デザイン40% + アーティスト30% + 料金20% + 距離10%
- **結果表示**: マッチしたアーティスト一覧

#### 4. 位置情報機能

- **GPS連携**: 現在地取得
- **距離計算**: アーティストとの距離測定
- **日本全国対応**: 地域限定なし（将来的に地域別機能追加予定）

#### 5. コミュニケーション機能

- **リアルタイムメッセージング**: Firebase Realtime Database
- **問い合わせフォーム**: 決済機能の代替
- **予約調整**: メッセージベースでの打ち合わせ

#### 6. レビュー・評価システム

- **評価システム**: 5段階評価
- **レビュー投稿**: コメント付き評価
- **自動スコア更新**: アーティスト評価の自動計算

### 非機能要件

#### パフォーマンス

- **アプリ起動時間**: 初回起動 < 3秒
- **画像最適化**: Firebase Storage自動圧縮
- **AI解析レスポンス**: Google Vision API < 2秒
- **リアルタイムメッセージ**: Firebase Realtime < 1秒

#### セキュリティ

- **データ保護**: Firebase セキュリティルール
- **認証セキュリティ**: Firebase Auth統合
- **画像セキュリティ**: 安全なアップロード処理
- **API セキュリティ**: Firebase SDK組み込みセキュリティ

#### デザインシステム

- **テイスト**: アート・クリエイティブ系デザイン
- **カラーパレット**: ダークテーマベース (#1a1a1a背景)
- **アクセントカラー**: #ff6b6b (レッド系)
- **コンポーネント**: React Native標準 + カスタムスタイル

#### スケーラビリティ

- **データベース設計**: 読み取りレプリカによる水平スケーリング
- **ファイル ストレージ**: グローバル アクセス用CDN配信
- **検索パフォーマンス**: 複雑クエリ用Elasticsearch統合
- **リアルタイム機能**: ライブ更新用WebSocket最適化

#### アクセシビリティ

- **WCAG 2.1 AA準拠**: 完全なアクセシビリティ サポート
- **モバイル レスポンシブ**: プログレッシブ ウェブアプリ機能
- **国際化**: 多言語サポート（日本語/英語）
- **スクリーンリーダー サポート**: セマンティックHTMLとARIAラベル

### プロジェクト構造

```
/mobile/                    # React Nativeアプリ
  /src/
    /components/            # 再利用可能コンポーネント
    /screens/              # 画面コンポーネント
      /auth/               # 認証関連画面
      /main/               # メイン機能画面
    /navigation/           # React Navigation設定
    /contexts/             # React Context (認証等)
    /types/                # TypeScript型定義
    /config/               # Firebase設定
    /utils/                # ユーティリティ関数
    /hooks/                # カスタムフック
  /android/                # Android固有設定
  /ios/                   # iOS固有設定
  App.tsx                 # エントリポイント
  package.json            # 依存関係
```

### 開発コマンド

```bash
# セットアップ
cd mobile
npm install              # 依存関係インストール

# 開発実行
npm run android         # Android開発実行
npm run ios             # iOS開発実行
npm start               # Metro bundler起動

# ビルド・検証
npm run lint            # ESLintチェック
npm run format          # Prettierフォーマット
npm run type-check      # TypeScript型チェック

# iOS固有
cd ios && pod install   # CocoaPodsインストール
```

### Firestore データベース構造

#### コアコレクション

- **users**: ユーザープロフィールと認証情報
- **artists**: アーティスト詳細・ポートフォリオ・評価
- **portfolioItems**: アーティストの作品画像・AI解析結果
- **matchingRequests**: お客様のマッチングリクエスト
- **messages**: リアルタイムメッセージ（Realtime Database）
- **reviews**: 評価・レビューシステム

#### Firebase セキュリティ

- Firestore Security Rules でアクセス制御
- ユーザー認証ベースの読み書き権限
- Firebase Storage Rules で画像アクセス制御
- Cloud Functions でサーバーサイド検証

### 統合要件

#### 外部サービス

- **AI画像解析**: Google Cloud Vision API
- **マップ統合**: Google Maps API (位置情報・距離計算)
- **プッシュ通知**: Firebase Cloud Messaging
- **分析**: Firebase Analytics
- **エラー監視**: Firebase Crashlytics

#### MVP (Version 1.0) 機能範囲

- **認証システム**: ユーザー登録・ログイン
- **アーティスト登録**: ポートフォリオ管理
- **AIマッチング**: 画像解析ベースのレコメンド
- **メッセージング**: リアルタイムチャット
- **問い合わせ機能**: 決済の代替システム
- **レビュー・評価**: 基本的な評価システム

#### 将来実装予定

- **決済機能**: Stripe等の決済システム統合
- **地域別機能**: 都道府県別表示・フィルタリング
- **高度なAI機能**: より詳細な画像解析・スタイル分類

### 品質保証

#### コード品質

- **ESLint設定**: React Native + TypeScript ルール
- **Prettier統合**: 一貫したコードフォーマット
- **Husky Git フック**: プリコミット品質チェック + 通知音
- **TypeScript**: 厳格な型チェック

#### React Native開発環境

- **Android Studio**: Android開発・エミュレーター
- **Xcode**: iOS開発・シミュレーター
- **Metro Bundler**: JavaScript バンドリング
- **Flipper**: デバッグツール統合

## 重要な指示事項

- **Firebase中心アーキテクチャ**: 全データ操作でFirebase SDK使用
- **TypeScript厳格運用**: 全コンポーネント・関数で型定義
- **アート系デザイン**: クリエイティブで視覚的に印象的なUI
- **React Native標準**: プラットフォーム固有機能の適切な使用
- **AI画像解析**: Google Cloud Vision APIの効果的活用
- **リアルタイム機能**: Firebase Realtime Databaseでスムーズなチャット
- **Git Hooks通知**: 作業完了時の音声フィードバック
- **セキュリティ重視**: Firebase Security Rulesの適切な設定

## 開発優先順位

1. **認証・ユーザー管理** ✅ (完了)
2. **アーティスト登録・ポートフォリオ**
3. **AI画像解析・マッチング**
4. **メッセージング機能**
5. **レビュー・評価システム**
6. **UIの改善・デザインシステム**
