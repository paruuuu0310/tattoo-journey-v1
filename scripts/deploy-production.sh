#!/bin/bash

# =============================================================================
# Tattoo Journey Mobile App - Production Deployment Script
# =============================================================================
# This script deploys the React Native app to production (App Store & Google Play)
# 株式会社からもん - Karamon Inc.
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"
    
    # Check if we're on the correct branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        log_error "Production deployment must be from 'main' branch. Current: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Check if working directory is clean
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Working directory is not clean. Please commit or stash changes."
        git status --short
        exit 1
    fi
    
    # Pull latest changes
    log_info "Pulling latest changes from origin/main..."
    git pull origin main
    
    # Check if Fastlane is installed
    if ! command -v bundle &> /dev/null; then
        log_error "Bundle not found. Please install Ruby bundler."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Update version numbers
update_version() {
    log_header "Updating Version Numbers"
    
    cd mobile
    
    # Get current version from package.json
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    log_info "Current version: $CURRENT_VERSION"
    
    # Prompt for new version
    echo "Enter new version (current: $CURRENT_VERSION):"
    read NEW_VERSION
    
    if [[ -z "$NEW_VERSION" ]]; then
        log_error "Version cannot be empty"
        exit 1
    fi
    
    # Update package.json
    npm version $NEW_VERSION --no-git-tag-version
    
    # Update iOS version
    cd ios
    agvtool new-marketing-version $NEW_VERSION
    BUILD_NUMBER=$(date +%Y%m%d%H%M)
    agvtool new-version -all $BUILD_NUMBER
    cd ..
    
    # Update Android version
    # This would be handled by Fastlane during build
    
    log_success "Version updated to $NEW_VERSION (build: $BUILD_NUMBER)"
    
    cd ..
}

# Run tests
run_tests() {
    log_header "Running Tests"
    
    cd mobile
    
    log_info "Running unit tests..."
    npm run test
    
    log_info "Running type check..."
    npm run type-check
    
    log_info "Running linting..."
    npm run lint
    
    log_info "Running security tests..."
    npm run test:security
    
    log_success "All tests passed"
    
    cd ..
}

# Build and deploy iOS
deploy_ios() {
    log_header "Deploying iOS to App Store"
    
    cd mobile
    
    log_info "Installing Fastlane dependencies..."
    bundle install
    
    log_info "Deploying to App Store..."
    bundle exec fastlane ios release
    
    log_success "iOS deployment completed"
    
    cd ..
}

# Build and deploy Android
deploy_android() {
    log_header "Deploying Android to Google Play"
    
    cd mobile
    
    log_info "Deploying to Google Play..."
    bundle exec fastlane android release
    
    log_success "Android deployment completed"
    
    cd ..
}

# Create git tag
create_git_tag() {
    log_header "Creating Git Tag"
    
    cd mobile
    VERSION=$(node -p "require('./package.json').version")
    cd ..
    
    TAG_NAME="v$VERSION"
    
    log_info "Creating git tag: $TAG_NAME"
    git add .
    git commit -m "🚀 Release $TAG_NAME

- iOS App Store release
- Android Google Play release
- Version bumped to $VERSION

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git tag -a $TAG_NAME -m "Release $TAG_NAME"
    git push origin main --tags
    
    log_success "Git tag $TAG_NAME created and pushed"
}

# Send notifications
send_notifications() {
    log_header "Sending Notifications"
    
    cd mobile
    VERSION=$(node -p "require('./package.json').version")
    cd ..
    
    # Slack notification (if configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        log_info "Sending Slack notification..."
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 *Production Deployment Complete!*\n\n📱 *Version:* $VERSION\n🍎 iOS: App Store\n🤖 Android: Google Play\n\n✅ Both platforms deployed successfully!\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    # Email notification could be added here
    
    log_success "Notifications sent"
}

# Rollback function
rollback() {
    log_header "Rollback Initiated"
    
    log_warning "Rolling back deployment..."
    
    # Get the last tag
    LAST_TAG=$(git describe --tags --abbrev=0 HEAD~1)
    log_info "Rolling back to: $LAST_TAG"
    
    # Reset to previous tag
    git reset --hard $LAST_TAG
    
    # You would implement platform-specific rollback here
    log_warning "Manual rollback required for App Store and Google Play"
    log_info "Please use App Store Connect and Google Play Console to rollback releases"
    
    log_success "Local rollback completed"
}

# Main deployment function
main() {
    log_header "🚀 Production Deployment - Tattoo Journey Mobile"
    
    # Trap errors and rollback
    trap 'log_error "Deployment failed! Use ./scripts/deploy-production.sh --rollback to rollback"; exit 1' ERR
    
    # Check for rollback flag
    if [[ "$1" == "--rollback" ]]; then
        rollback
        exit 0
    fi
    
    # Confirmation prompt
    echo ""
    log_warning "You are about to deploy to PRODUCTION!"
    log_warning "This will deploy to both App Store and Google Play."
    echo ""
    echo "Are you sure you want to continue? (yes/no)"
    read CONFIRMATION
    
    if [[ "$CONFIRMATION" != "yes" ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Deployment steps
    check_prerequisites
    update_version
    run_tests
    deploy_ios
    deploy_android
    create_git_tag
    send_notifications
    
    # Success message
    log_header "🎉 Deployment Complete!"
    echo ""
    log_success "Production deployment completed successfully!"
    echo ""
    cd mobile
    VERSION=$(node -p "require('./package.json').version")
    cd ..
    echo "📱 Version: $VERSION"
    echo "🍎 iOS: Submitted to App Store"
    echo "🤖 Android: Submitted to Google Play"
    echo ""
    echo "Next steps:"
    echo "1. Monitor app store review process"
    echo "2. Test the live releases when approved"
    echo "3. Monitor crash reports and user feedback"
    echo ""
    echo "Happy launching! 🎉📱"
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Tattoo Journey Production Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./scripts/deploy-production.sh           Deploy to production"
    echo "  ./scripts/deploy-production.sh --rollback Rollback deployment"
    echo "  ./scripts/deploy-production.sh --help     Show this help"
    echo ""
    exit 0
fi

# Run main function
main "$@"