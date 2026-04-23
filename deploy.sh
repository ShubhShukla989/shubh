#!/bin/bash

# Deployment script for ePaper CMS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Configuration
APP_NAME="epaper"
BUILD_DIR=".next"
DEPLOY_PACKAGE="deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${YELLOW}📦 Cleaning previous builds...${NC}"
rm -rf .next

# Step 2: Install dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
npm ci --production=false

# Step 3: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Step 4: Check if build was successful
if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}❌ Build failed! .next/standalone directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Step 5: Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/$APP_NAME"

# Copy necessary files
cp -r .next/standalone/* "$TEMP_DIR/$APP_NAME/"
cp -r .next/static "$TEMP_DIR/$APP_NAME/.next/"
cp -r public "$TEMP_DIR/$APP_NAME/"
cp package.json "$TEMP_DIR/$APP_NAME/"

# Create the archive
cd "$TEMP_DIR"
tar -czf "$DEPLOY_PACKAGE" "$APP_NAME"
mv "$DEPLOY_PACKAGE" "$OLDPWD/"
cd "$OLDPWD"

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✅ Deployment package created: $DEPLOY_PACKAGE${NC}"

# Step 6: Reload PM2 if running, otherwise show instructions
echo ""
if command -v pm2 &> /dev/null && pm2 describe epaper &>/dev/null; then
    echo -e "${YELLOW}🔄 Reloading PM2 process (zero-downtime)...${NC}"

    # Copy fresh build into standalone
    cp -r .next/static .next/standalone/.next/
    cp -r public .next/standalone/

    pm2 reload epaper
    echo -e "${GREEN}✅ Application reloaded via PM2${NC}"
    pm2 status
else
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment package ready!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📦 Package: $DEPLOY_PACKAGE"
    echo ""
    echo "PM2 not running. First time? Run:"
    echo "   ./setup-pm2.sh"
    echo ""
    echo "Or manually:"
    echo "   pm2 start .next/standalone/server.js --name epaper"
    echo "   pm2 save"
    echo ""
fi

# Calculate package size
PACKAGE_SIZE=$(du -h "$DEPLOY_PACKAGE" 2>/dev/null | cut -f1 || echo "N/A")
echo "📊 Package size: $PACKAGE_SIZE"
