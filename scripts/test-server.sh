#!/bin/bash

# Tattoo Journey 2.0 - 自鯖テスト環境起動スクリプト

set -e

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🚀 Tattoo Journey 2.0 - Test Server Setup${NC}"
    echo -e "${BLUE}===============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# メイン処理
main() {
    print_header
    
    # Node.js バージョン確認
    print_info "Node.js version check..."
    node --version || {
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    }
    
    # Firebase CLI 確認
    print_info "Firebase CLI check..."
    if ! command -v firebase &> /dev/null; then
        print_warning "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    print_success "Firebase CLI ready"
    
    # 依存関係インストール
    print_info "Installing dependencies..."
    npm run install:all
    print_success "Dependencies installed"
    
    # Firebase Emulator 起動
    print_info "Starting Firebase Emulators..."
    firebase emulators:start --project tattoo-journey-dev &
    sleep 10
    print_success "Firebase Emulators running"
    
    # テスト実行
    print_info "Running comprehensive tests..."
    
    # セキュリティテスト
    echo -e "\n${YELLOW}🔐 Security Tests${NC}"
    cd mobile && npm run test:security
    
    # Firebase接続テスト
    echo -e "\n${YELLOW}🔥 Firebase Tests${NC}"
    npm run test:firebase
    
    # E2Eテスト
    echo -e "\n${YELLOW}🧪 End-to-End Tests${NC}"
    npm run test:e2e
    
    # ユーザージャーニーテスト
    echo -e "\n${YELLOW}👤 User Journey Tests${NC}"  
    npm run test:journey
    
    cd ..
    
    print_success "All tests completed successfully!"
    
    # テスト結果サマリー
    echo -e "\n${BLUE}📊 Test Environment Status:${NC}"
    echo "• Firebase Emulators: http://localhost:4000"
    echo "• Firestore UI: http://localhost:8080"
    echo "• Auth Emulator: http://localhost:9099"
    echo "• Metro Bundler: http://localhost:8081"
    echo ""
    
    print_info "To start mobile development:"
    echo "  npm run dev:mobile:ios     # iOS Simulator"
    echo "  npm run dev:mobile:android # Android Emulator"
    echo ""
    
    print_info "To stop emulators:"
    echo "  firebase emulators:stop"
}

# Ctrl+C でクリーンアップ
cleanup() {
    print_warning "Stopping Firebase Emulators..."
    firebase emulators:stop
    exit 0
}

trap cleanup INT

# スクリプト実行
main "$@"