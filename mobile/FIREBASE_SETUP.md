# Firebase設定ガイド

## 必要なファイル

### iOS設定

- **ファイル**: `ios/TattooJourneyMobile/GoogleService-Info.plist`
- **取得方法**: Firebaseコンソール > プロジェクト設定 > iOS アプリ > GoogleService-Info.plistをダウンロード
- **バンドルID**: `com.karamon.tattoojourneymobile`

### Android設定

- **ファイル**: `android/app/google-services.json`
- **取得方法**: Firebaseコンソール > プロジェクト設定 > Android アプリ > google-services.jsonをダウンロード
- **パッケージ名**: `com.tattoojourney.mobile`

## セットアップ手順

1. Firebaseコンソール (https://console.firebase.google.com) にアクセス
2. Tattoo Journey 2.0プロジェクトを選択
3. プロジェクト設定 > 全般タブ
4. 各プラットフォームの設定ファイルをダウンロード
5. 上記の正しい場所に配置

## 重要な注意事項

- これらのファイルはGitで管理されていません（.gitignoreに含まれています）
- 本番環境と開発環境で異なる設定ファイルが必要です
- テンプレートファイルから実際の値に置き換えてください

## 現在の状態

- ❌ iOS: `GoogleService-Info.plist` - 不足（テンプレートは作成済み）
- ✅ Android: `google-services.json` - テンプレートから復元済み（要設定値更新）
