# Tattoo Journey 2.0

タトゥーアーティストとお客様をAI技術でマッチングする次世代プラットフォーム

## 🎯 プロジェクト概要

Tattoo Journey 2.0は、Google Cloud Vision APIを活用したAI画像解析とマッチングアルゴリズムにより、お客様の希望デザインに最適なタトゥーアーティストを見つけるためのプラットフォームです。

## 🚀 技術スタック

### フロントエンド
- **Web**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **モバイル**: React Native, TypeScript

### バックエンド・インフラ
- **認証**: Firebase Authentication
- **データベース**: Firestore
- **ストレージ**: Firebase Storage
- **AI**: Google Cloud Vision API
- **通知**: Firebase Cloud Messaging

### 開発ツール
- **コード品質**: ESLint, Prettier, Husky
- **コミット管理**: Commitlint
- **テスト**: Jest (モバイル)

## 📱 機能

### お客様向け
- AI画像解析によるデザイン分析
- マッチングスコアに基づくアーティスト推薦
- リアルタイムメッセージング
- 位置情報ベースの検索

### アーティスト向け
- ポートフォリオ管理
- スケジュール管理
- 料金設定
- 得意スタイル設定

## 🛠️ セットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- iOS開発: Xcode, CocoaPods
- Android開発: Android Studio, Java JDK

### インストール

1. **リポジトリのクローン**
```bash
git clone [repository-url]
cd tattoo-journey-2.0
```

2. **依存関係のインストール**
```bash
# Webアプリ
npm install

# モバイルアプリ
cd mobile
npm install
cd ios && pod install
```

3. **環境変数の設定**
```bash
# .env.local ファイルを作成
cp .env.example .env.local
# 必要な環境変数を設定
```

4. **開発サーバーの起動**
```bash
# Webアプリ
npm run dev

# モバイルアプリ
cd mobile
npm run ios     # iOS
npm run android # Android
```

## 📁 プロジェクト構造

```
tattoo-journey-2.0/
├── src/                    # Webアプリのソースコード
│   ├── app/               # Next.js App Router
│   ├── components/        # 再利用可能なコンポーネント
│   ├── lib/              # ユーティリティ関数
│   └── types/            # TypeScript型定義
├── mobile/                # React Nativeアプリ
│   ├── src/              # モバイルアプリのソースコード
│   ├── ios/              # iOS設定
│   └── android/          # Android設定
├── docs/                  # プロジェクトドキュメント
└── config/                # 設定ファイル
```

## 🔧 開発コマンド

### Webアプリ
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック
```

### モバイルアプリ
```bash
cd mobile
npm run ios          # iOSシミュレーター起動
npm run android      # Androidエミュレーター起動
npm run test         # テスト実行
```

## 📊 進捗状況

詳細な進捗状況は [PROJECT_TICKETS.md](./PROJECT_TICKETS.md) を参照してください。

**現在の進捗率: 8.1% (3/37タスク完了)**

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 📞 サポート

質問や問題がある場合は、[Issues](../../issues) を作成してください。

---

**Tattoo Journey 2.0** - タトゥーアートの新しい扉を開く
