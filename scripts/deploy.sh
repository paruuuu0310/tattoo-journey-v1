#!/bin/bash

# Firebase Deployment Script - SEC-007
# 環境別デプロイの自動化スクリプト

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT=""
SKIP_TESTS=false
SKIP_CONFIRMATION=false
DRY_RUN=false

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 <environment> [options]"
    echo ""
    echo "Environments:"
    echo "  dev        Deploy to development environment"
    echo "  staging    Deploy to staging environment"
    echo "  prod       Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --skip-tests           Skip security tests"
    echo "  --skip-confirmation    Skip confirmation prompt (for CI/CD)"
    echo "  --dry-run             Show what would be deployed without deploying"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging --skip-tests"
    echo "  $0 prod --skip-confirmation"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|staging|prod)
            ENVIRONMENT="$1"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-confirmation)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_usage
    exit 1
fi

# Set environment-specific variables
case $ENVIRONMENT in
    dev)
        PROJECT_ID="tattoo-journey-dev"
        CONFIG_FILE="firebase.dev.json"
        RULES_SUFFIX="dev"
        ;;
    staging)
        PROJECT_ID="tattoo-journey-staging"
        CONFIG_FILE="firebase.staging.json"
        RULES_SUFFIX="staging"
        ;;
    prod)
        PROJECT_ID="tattoo-journey-v2"
        CONFIG_FILE="firebase.prod.json"
        RULES_SUFFIX="prod"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

log_info "🚀 Starting deployment to $ENVIRONMENT environment"
log_info "Project ID: $PROJECT_ID"
log_info "Config file: $CONFIG_FILE"

# Check if config file exists
CONFIG_PATH="$PROJECT_ROOT/$CONFIG_FILE"
if [[ ! -f "$CONFIG_PATH" ]]; then
    log_error "Config file not found: $CONFIG_PATH"
    exit 1
fi

# Check if we're in the right directory
cd "$PROJECT_ROOT"

# Pre-deployment checks
log_info "🔍 Running pre-deployment checks..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI is not installed. Please install it first:"
    echo "  npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    log_error "Not logged in to Firebase. Please login first:"
    echo "  firebase login"
    exit 1
fi

# Set Firebase project
log_info "🔧 Setting Firebase project to $PROJECT_ID..."
if ! firebase use "$PROJECT_ID"; then
    log_error "Failed to set Firebase project. Make sure project $PROJECT_ID exists and you have access."
    exit 1
fi

# Run security tests unless skipped
if [[ "$SKIP_TESTS" == false ]]; then
    log_info "🧪 Running security tests..."
    
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        # Extra thorough testing for production
        npm run test:security || {
            log_error "Security tests failed. Cannot deploy to production."
            exit 1
        }
        npm run lint || {
            log_error "Linting failed. Cannot deploy to production."
            exit 1
        }
        npm run type-check || {
            log_error "Type checking failed. Cannot deploy to production."
            exit 1
        }
    else
        # Basic testing for dev/staging
        npm run test:security || {
            log_error "Security tests failed."
            exit 1
        }
    fi
    
    log_success "All tests passed!"
else
    log_warning "Skipping security tests as requested"
fi

# Show deployment summary
log_info "📋 Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Project ID: $PROJECT_ID"
echo "  Config file: $CONFIG_FILE"
echo "  Rules files: firestore.$RULES_SUFFIX.rules, storage.$RULES_SUFFIX.rules"

# Production confirmation
if [[ "$ENVIRONMENT" == "prod" && "$SKIP_CONFIRMATION" == false ]]; then
    log_warning "⚠️  You are about to deploy to PRODUCTION!"
    log_warning "This will affect real users and data."
    echo ""
    read -p "Deploy to PRODUCTION? Type 'yes' to confirm: " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
fi

# Dry run check
if [[ "$DRY_RUN" == true ]]; then
    log_info "🔍 DRY RUN - Would deploy with these commands:"
    echo "  firebase deploy --config $CONFIG_FILE --project $PROJECT_ID"
    echo ""
    echo "Files that would be deployed:"
    echo "  - $CONFIG_FILE"
    echo "  - firestore.$RULES_SUFFIX.rules"
    echo "  - storage.$RULES_SUFFIX.rules"
    echo "  - Functions from ./functions"
    echo "  - Hosting from ./build"
    exit 0
fi

# Actual deployment
log_info "🚀 Starting deployment..."

# Deploy with specific config
if firebase deploy --config "$CONFIG_FILE" --project "$PROJECT_ID"; then
    log_success "✅ Deployment to $ENVIRONMENT completed successfully!"
    
    # Post-deployment verification
    log_info "🔍 Running post-deployment verification..."
    
    # Check if the deployment is accessible
    case $ENVIRONMENT in
        dev)
            URL="https://tattoo-journey-dev.web.app"
            ;;
        staging)
            URL="https://tattoo-journey-staging.web.app"
            ;;
        prod)
            URL="https://tattoo-journey-v2.web.app"
            ;;
    esac
    
    if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
        log_success "✅ Application is accessible at $URL"
    else
        log_warning "⚠️  Application might not be fully accessible yet. Please check manually."
    fi
    
    # Success notification
    if command -v afplay &> /dev/null; then
        afplay /System/Library/Sounds/Hero.aiff
    fi
    
    echo ""
    log_success "🎉 Deployment completed!"
    echo "  Environment: $ENVIRONMENT"
    echo "  URL: $URL"
    echo "  Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
    
else
    log_error "❌ Deployment failed!"
    
    # Error notification
    if command -v afplay &> /dev/null; then
        afplay /System/Library/Sounds/Sosumi.aiff
    fi
    
    exit 1
fi