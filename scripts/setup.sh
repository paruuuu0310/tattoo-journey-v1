#!/bin/bash

# Tattoo Journey 2.0 セットアップスクリプト
echo "🚀 Tattoo Journey 2.0 セットアップを開始します..."

# 色付きの出力用関数
print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

# Node.jsのバージョンチェック
print_info "Node.jsのバージョンをチェックしています..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION がインストールされています"
else
    print_error "Node.jsがインストールされていません"
    print_info "Node.js 18+ をインストールしてください: https://nodejs.org/"
    exit 1
fi

# npmのバージョンチェック
print_info "npmのバージョンをチェックしています..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION がインストールされています"
else
    print_error "npmがインストールされていません"
    exit 1
fi

# 依存関係のインストール
print_info "Webアプリの依存関係をインストールしています..."
npm install
if [ $? -eq 0 ]; then
    print_success "Webアプリの依存関係のインストールが完了しました"
else
    print_error "Webアプリの依存関係のインストールに失敗しました"
    exit 1
fi

# モバイルアプリの依存関係
print_info "モバイルアプリの依存関係をインストールしています..."
cd mobile
npm install
if [ $? -eq 0 ]; then
    print_success "モバイルアプリの依存関係のインストールが完了しました"
else
    print_error "モバイルアプリの依存関係のインストールに失敗しました"
    exit 1
fi

# iOS開発環境のチェック
print_info "iOS開発環境をチェックしています..."
if command -v xcodebuild &> /dev/null; then
    print_success "Xcodeがインストールされています"
    
    # CocoaPodsのチェック
    if command -v pod &> /dev/null; then
        print_success "CocoaPodsがインストールされています"
        print_info "iOS依存関係をインストールしています..."
        cd ios && pod install
        if [ $? -eq 0 ]; then
            print_success "iOS依存関係のインストールが完了しました"
        else
            print_error "iOS依存関係のインストールに失敗しました"
        fi
        cd ..
    else
        print_info "CocoaPodsをインストールしてください: sudo gem install cocoapods"
    fi
else
    print_info "Xcodeがインストールされていません。App Storeからインストールしてください"
fi

# Android開発環境のチェック
print_info "Android開発環境をチェックしています..."
if command -v adb &> /dev/null; then
    print_success "Android SDKが設定されています"
else
    print_info "Android StudioとAndroid SDKをインストールしてください"
fi

# Java JDKのチェック
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_success "Java JDKがインストールされています: $JAVA_VERSION"
else
    print_info "Java JDKをインストールしてください: brew install openjdk@17"
fi

cd ..

# 環境変数ファイルの作成
print_info "環境変数ファイルを作成しています..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local 2>/dev/null || echo "# 環境変数を設定してください" > .env.local
    print_success ".env.localファイルが作成されました"
    print_info "必要な環境変数を設定してください"
else
    print_success ".env.localファイルは既に存在します"
fi

# Git hooksの設定
print_info "Git hooksを設定しています..."
if [ -d .husky ]; then
    print_success "Huskyが設定されています"
else
    print_info "Huskyの設定が必要です: npm run prepare"
fi

print_success "🎉 セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. .env.localファイルに環境変数を設定"
echo "2. Firebaseプロジェクトの設定"
echo "3. Google Cloud Vision APIの設定"
echo "4. アプリのテスト実行: npm run dev"
echo ""
echo "詳細は docs/PROJECT_TICKETS.md を参照してください"
