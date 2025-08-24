#!/bin/bash

# Tattoo Journey 2.0 開発用スクリプト
echo "🔧 開発用コマンドを実行します..."

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

# コマンドライン引数の処理
case "$1" in
    "web")
        print_info "Webアプリの開発サーバーを起動しています..."
        npm run dev
        ;;
    "mobile:ios")
        print_info "iOSシミュレーターを起動しています..."
        cd mobile && npm run ios
        ;;
    "mobile:android")
        print_info "Androidエミュレーターを起動しています..."
        cd mobile && npm run android
        ;;
    "build")
        print_info "Webアプリをビルドしています..."
        npm run build
        ;;
    "test")
        print_info "テストを実行しています..."
        npm run test:all
        ;;
    "lint")
        print_info "コードの品質チェックを実行しています..."
        npm run lint
        ;;
    "format")
        print_info "コードのフォーマットを実行しています..."
        npm run format
        ;;
    "clean")
        print_info "ビルドファイルをクリーンアップしています..."
        rm -rf .next out dist
        cd mobile && rm -rf android/app/build ios/build
        print_success "クリーンアップが完了しました"
        ;;
    "install:all")
        print_info "すべての依存関係をインストールしています..."
        npm install
        cd mobile && npm install
        cd ios && pod install
        print_success "すべての依存関係のインストールが完了しました"
        ;;
    "status")
        print_info "プロジェクトの状態をチェックしています..."
        echo "📊 プロジェクト状態:"
        echo "  - Node.js: $(node --version)"
        echo "  - npm: $(npm --version)"
        echo "  - Next.js: $(npm list next --depth=0 | grep next)"
        echo "  - React: $(npm list react --depth=0 | grep react)"
        echo "  - TypeScript: $(npm list typescript --depth=0 | grep typescript)"
        ;;
    *)
        echo "使用方法: $0 [コマンド]"
        echo ""
        echo "利用可能なコマンド:"
        echo "  web              - Webアプリの開発サーバー起動"
        echo "  mobile:ios       - iOSシミュレーター起動"
        echo "  mobile:android   - Androidエミュレーター起動"
        echo "  build            - Webアプリのビルド"
        echo "  test             - テスト実行"
        echo "  lint             - コード品質チェック"
        echo "  format           - コードフォーマット"
        echo "  clean            - ビルドファイルのクリーンアップ"
        echo "  install:all      - 全依存関係のインストール"
        echo "  status           - プロジェクト状態の表示"
        echo ""
        echo "例: $0 web"
        ;;
esac
