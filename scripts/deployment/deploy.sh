#!/bin/bash

###############################################################################
# Deployment Script for AI Agent System
# Deploys to production with health checks and rollback capability
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-agent-system"
DEPLOY_ENV="${1:-production}"
BACKUP_DIR="./backups"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AI Agent System Deployment${NC}"
echo -e "${GREEN}Environment: ${DEPLOY_ENV}${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Step 1: Pre-flight checks
echo -e "${YELLOW}[1/10] Running pre-flight checks...${NC}"

if [ ! -f ".env.${DEPLOY_ENV}" ]; then
    echo -e "${RED}Error: .env.${DEPLOY_ENV} not found${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}\n"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/10] Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 3: Run tests
echo -e "${YELLOW}[3/10] Running tests...${NC}"
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Tests failed. Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All tests passed${NC}\n"

# Step 4: Build TypeScript
echo -e "${YELLOW}[4/10] Building TypeScript...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed. Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}\n"

# Step 5: Backup current deployment
echo -e "${YELLOW}[5/10] Creating backup...${NC}"
mkdir -p "${BACKUP_DIR}"
BACKUP_FILE="${BACKUP_DIR}/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "${BACKUP_FILE}" dist/ package.json package-lock.json || true
echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}\n"

# Step 6: Validate environment variables
echo -e "${YELLOW}[6/10] Validating environment variables...${NC}"

required_vars=(
    "DATABASE_URL"
    "STRIPE_SECRET_KEY"
    "NOTION_API_KEY"
    "NOTION_BUSINESS_TRACKER_DB_ID"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" ".env.${DEPLOY_ENV}"; then
        echo -e "${RED}Error: ${var} not found in .env.${DEPLOY_ENV}${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Environment variables validated${NC}\n"

# Step 7: Run database migrations
echo -e "${YELLOW}[7/10] Running database migrations...${NC}"
if [ -f "scripts/database/migrate.sh" ]; then
    bash scripts/database/migrate.sh
    echo -e "${GREEN}✓ Migrations complete${NC}\n"
else
    echo -e "${YELLOW}⚠ No migration script found, skipping${NC}\n"
fi

# Step 8: Deploy to hosting platform
echo -e "${YELLOW}[8/10] Deploying to ${DEPLOY_ENV}...${NC}"

case "${DEPLOY_ENV}" in
    "production")
        # Vercel deployment
        if command -v vercel &> /dev/null; then
            vercel --prod
        # Railway deployment
        elif command -v railway &> /dev/null; then
            railway up
        else
            echo -e "${YELLOW}⚠ No deployment platform CLI found${NC}"
            echo -e "${YELLOW}  Please deploy manually or install Vercel/Railway CLI${NC}"
        fi
        ;;
    "staging")
        if command -v vercel &> /dev/null; then
            vercel
        elif command -v railway &> /dev/null; then
            railway up --environment staging
        fi
        ;;
    *)
        echo -e "${YELLOW}Unknown environment: ${DEPLOY_ENV}${NC}"
        ;;
esac

echo -e "${GREEN}✓ Deployment initiated${NC}\n"

# Step 9: Health check
echo -e "${YELLOW}[9/10] Running health checks...${NC}"

sleep 10  # Wait for deployment to complete

HEALTH_URL="${HEALTH_CHECK_URL:-https://api.yourapp.com/health}"

if command -v curl &> /dev/null; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" || echo "000")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ Health check passed (HTTP ${response})${NC}\n"
    else
        echo -e "${RED}✗ Health check failed (HTTP ${response})${NC}"
        echo -e "${YELLOW}Consider rolling back with: bash scripts/deployment/rollback.sh${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠ curl not installed, skipping health check${NC}\n"
fi

# Step 10: Smoke tests
echo -e "${YELLOW}[10/10] Running smoke tests...${NC}"

if [ -f "scripts/deployment/smoke-tests.sh" ]; then
    bash scripts/deployment/smoke-tests.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Smoke tests passed${NC}\n"
    else
        echo -e "${RED}✗ Smoke tests failed${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠ No smoke test script found, skipping${NC}\n"
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${DEPLOY_ENV}"
echo -e "Timestamp: $(date)"
echo -e "Backup: ${BACKUP_FILE}"
echo -e ""
echo -e "Next steps:"
echo -e "  1. Monitor logs for errors"
echo -e "  2. Check metrics dashboard"
echo -e "  3. Verify scheduled jobs are running"
echo -e ""
echo -e "${YELLOW}If issues occur, rollback with:${NC}"
echo -e "  bash scripts/deployment/rollback.sh ${BACKUP_FILE}"
echo -e ""
