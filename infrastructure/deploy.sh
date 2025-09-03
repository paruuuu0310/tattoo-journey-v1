#!/bin/bash

# Tattoo Journey 2.0 - 環境別Firebase デプロイスクリプト
# Usage: ./infrastructure/deploy.sh [environment] [options]

set -e

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 環境設定
ENVIRONMENT=${1:-dev}
PROJECT_ID=""
FIRESTORE_RULES=""
DATABASE_RULES=""
STORAGE_RULES=""

print_header() {
    echo -e "${BLUE}🚀 Tattoo Journey 2.0 Firebase Deploy${NC}"
    echo -e "${BLUE}=====================================\n${NC}"
}

print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 環境設定
setup_environment() {
    case $ENVIRONMENT in
        "dev"|"development")
            PROJECT_ID="tattoo-journey-dev"
            FIRESTORE_RULES="infrastructure/rules/firestore.dev.rules"
            DATABASE_RULES="infrastructure/rules/database.dev.rules.json"
            STORAGE_RULES="infrastructure/rules/storage.dev.rules"
            ;;
        "staging")
            PROJECT_ID="tattoo-journey-staging"
            FIRESTORE_RULES="infrastructure/rules/firestore.staging.rules"
            DATABASE_RULES="infrastructure/rules/database.staging.rules.json"
            STORAGE_RULES="infrastructure/rules/storage.staging.rules"
            ;;
        "prod"|"production")
            PROJECT_ID="tattoo-journey-prod"
            FIRESTORE_RULES="infrastructure/rules/firestore.prod.rules"
            DATABASE_RULES="infrastructure/rules/database.prod.rules.json"
            STORAGE_RULES="infrastructure/rules/storage.prod.rules"
            ;;
        *)
            print_error "未対応の環境: $ENVIRONMENT"
            echo "対応環境: dev, staging, prod"
            exit 1
            ;;
    esac
    
    print_info "環境: $ENVIRONMENT"
    print_info "プロジェクトID: $PROJECT_ID"
}

# 事前チェック
pre_deploy_checks() {
    print_info "事前チェック実行中..."
    
    # Firebase CLI チェック
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI がインストールされていません"
        echo "インストール方法: npm install -g firebase-tools"
        exit 1
    fi
    
    # ログインチェック
    if ! firebase login:ci --no-localhost &> /dev/null; then
        print_error "Firebase にログインしていません"
        echo "実行方法: firebase login"
        exit 1
    fi
    
    # ルールファイル存在チェック
    if [[ ! -f "$FIRESTORE_RULES" ]]; then
        print_error "Firestoreルールファイルが見つかりません: $FIRESTORE_RULES"
        exit 1
    fi
    
    if [[ ! -f "$DATABASE_RULES" ]]; then
        print_error "Databaseルールファイルが見つかりません: $DATABASE_RULES"
        exit 1
    fi
    
    if [[ ! -f "$STORAGE_RULES" ]]; then
        print_error "Storageルールファイルが見つかりません: $STORAGE_RULES"
        exit 1
    fi
    
    print_success "事前チェック完了"
}

# ビルド実行
build_projects() {
    print_info "プロジェクトビルド中..."
    
    # Web アプリビルド
    if [[ -d "web" ]]; then
        print_info "Webアプリをビルド中..."
        cd web && npm run build && cd ..
        print_success "Webアプリビルド完了"
    fi
    
    # Functions ビルド
    if [[ -d "functions" ]]; then
        print_info "Cloud Functionsをビルド中..."
        cd functions && npm run build && cd ..
        print_success "Cloud Functionsビルド完了"
    fi
}

# Firebase ルール設定
setup_firebase_rules() {
    print_info "Firebase ルール設定中..."
    
    # 一時的なfirebase.jsonを作成
    cat > firebase_temp.json << EOF
{
  "firestore": {
    "rules": "$FIRESTORE_RULES"
  },
  "database": {
    "rules": "$DATABASE_RULES"
  },
  "storage": {
    "rules": "$STORAGE_RULES"
  },
  "hosting": [
    {
      "target": "web",
      "public": "web/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": "**", "destination": "/index.html"}]
    }
  ],
  "functions": [
    {
      "source": "functions",
      "codebase": "default"
    }
  ]
}
EOF
    
    print_success "Firebase ルール設定完了"
}

# デプロイ実行
deploy_firebase() {
    print_info "Firebase デプロイ実行中..."
    
    # プロジェクト設定
    firebase use "$PROJECT_ID" --add
    
    # ルールのみデプロイ（初回）
    print_info "セキュリティルールをデプロイ中..."
    firebase deploy --only firestore:rules,database,storage --config firebase_temp.json
    
    # Web ホスティングデプロイ
    if [[ -d "web/out" ]]; then
        print_info "Web ホスティングをデプロイ中..."
        firebase deploy --only hosting --config firebase_temp.json
    fi
    
    # Functions デプロイ
    if [[ -d "functions/lib" ]]; then
        print_info "Cloud Functionsをデプロイ中..."
        firebase deploy --only functions --config firebase_temp.json
    fi
    
    print_success "Firebase デプロイ完了"
}

# クリーンアップ
cleanup() {
    print_info "クリーンアップ実行中..."
    [[ -f firebase_temp.json ]] && rm firebase_temp.json
    print_success "クリーンアップ完了"
}

# メイン実行
main() {
    print_header
    setup_environment
    pre_deploy_checks
    build_projects
    setup_firebase_rules
    deploy_firebase
    cleanup
    
    echo ""
    print_success "🎉 $ENVIRONMENT 環境へのデプロイが正常に完了しました！"
    print_info "プロジェクトURL: https://console.firebase.google.com/project/$PROJECT_ID"
}

# エラーハンドリング
trap cleanup ERR

# スクリプト実行
main "$@"