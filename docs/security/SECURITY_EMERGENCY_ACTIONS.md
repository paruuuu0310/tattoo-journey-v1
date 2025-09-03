# 🚨 緊急セキュリティ対策 - GitHub プッシュ前必須作業

**重要**: このリポジトリには現在、実際のAPIキーが含まれています。GitHubにプッシュする前に以下の手順を**必ず**実行してください。

## 🔴 即座に実行すべき緊急対策

### 1. 漏洩したAPIキーの無効化

```bash
# Firebase Console で以下のAPIキーを無効化・再生成
AIzaSyDE5FFYI8zEcJuLqkq1uiqOCRreAkZK5uk
```

### 2. 機密ファイルの Git 履歴から削除

```bash
# 危険なファイルをGit履歴から完全削除
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch mobile/android/app/google-services.json' --prune-empty --tag-name-filter cat -- --all

# または git-secrets を使用
git secrets --register-aws
git secrets --install
git secrets --scan
```

### 3. 環境変数ファイルの作成

```bash
# 開発環境用設定ファイル作成
cat > .env.development << EOF
# Google Vision API
GOOGLE_VISION_API_KEY=your_new_secure_api_key_here

# Firebase Configuration (development)
FIREBASE_PROJECT_ID=tattoo-journey-dev
FIREBASE_API_KEY=your_development_firebase_key
FIREBASE_AUTH_DOMAIN=tattoo-journey-dev.firebaseapp.com
FIREBASE_STORAGE_BUCKET=tattoo-journey-dev.appspot.com
EOF

# 本番環境用設定ファイル作成
cat > .env.production << EOF
# Google Vision API
GOOGLE_VISION_API_KEY=your_production_api_key_here

# Firebase Configuration (production)
FIREBASE_PROJECT_ID=tattoo-journey-v2
FIREBASE_API_KEY=your_production_firebase_key
FIREBASE_AUTH_DOMAIN=tattoo-journey-v2.firebaseapp.com
FIREBASE_STORAGE_BUCKET=tattoo-journey-v2.firebasestorage.app
EOF
```

### 4. テンプレートファイルの作成

```bash
# google-services.json のテンプレート作成
cat > mobile/android/app/google-services.json.template << EOF
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "firebase_url": "https://YOUR_PROJECT_ID-default-rtdb.region.firebasedatabase.app",
    "project_id": "YOUR_PROJECT_ID",
    "storage_bucket": "YOUR_PROJECT_ID.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_MOBILE_SDK_APP_ID",
        "android_client_info": {
          "package_name": "com.tattoojourney.mobile"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "YOUR_FIREBASE_API_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF
```

## 🟡 設定手順

### 5. CI/CD環境での環境変数設定

#### GitHub Actions の場合:

```yaml
# .github/workflows/security.yml
name: Security Check
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: |
          # API キー検出スキャン
          if grep -r "AIzaSy" . --exclude-dir=node_modules --exclude="*.md"; then
            echo "🚨 API Key detected in repository!"
            exit 1
          fi
```

#### 環境変数の設定:

```bash
# GitHub リポジトリの Settings > Secrets で設定
GOOGLE_VISION_API_KEY
FIREBASE_API_KEY
FIREBASE_PROJECT_ID
# など
```

### 6. 開発チーム向けセットアップスクリプト

```bash
# scripts/setup-dev-env.sh
#!/bin/bash
echo "🔧 開発環境のセットアップ開始..."

# 環境変数ファイルの存在確認
if [ ! -f .env.development ]; then
    echo "❌ .env.development ファイルが見つかりません"
    echo "SECURITY_EMERGENCY_ACTIONS.md を参照して設定してください"
    exit 1
fi

# Firebase設定ファイルの生成
if [ ! -f mobile/android/app/google-services.json ]; then
    echo "📱 Firebase設定ファイルを生成します..."
    # テンプレートから実際の設定ファイルを生成
    cp mobile/android/app/google-services.json.template mobile/android/app/google-services.json
    echo "⚠️  google-services.json を実際の値で更新してください"
fi

echo "✅ セットアップ完了"
```

## 🟢 検証手順

### 7. セキュリティチェック

```bash
# APIキー検出スキャン
grep -r "AIzaSy" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" || echo "✅ APIキー検出なし"

# 機密ファイル検出
find . -name "*.json" -path "*/android/app/*" -exec echo "⚠️  要確認: {}" \;

# .gitignore の動作確認
git status --ignored
```

### 8. 最終確認チェックリスト

- [ ] `.gitignore` に機密ファイルが追加済み
- [ ] `google-services.json` が Git管理から除外済み
- [ ] 環境変数ファイル (`.env.*`) が作成済み
- [ ] 既存のAPIキーが無効化・再生成済み
- [ ] テスト環境でアプリが正常動作確認済み
- [ ] セキュリティスキャンが実行済み
- [ ] チームメンバーに環境構築手順を共有済み

## ⚠️ 重要な注意事項

1. **既にGitHubにプッシュしている場合**:
   - すぐにAPIキーを無効化
   - リポジトリを一時的にプライベートに変更
   - Git履歴からAPIキーを完全削除

2. **今後の開発フロー**:
   - 新しいAPIキーは絶対にコミットしない
   - 環境変数のみを使用
   - 定期的なセキュリティスキャン実行

3. **チーム共有**:
   - 機密情報は安全なチャネル（Slack DM、暗号化メール等）で共有
   - 各開発者が個別に環境設定ファイルを作成

---

**最終確認**: 上記すべての手順を完了後、初めてGitHubへのプッシュを行ってください。
