#!/bin/bash

# Simple start script for standalone deployment
# Usage: ./start.sh

set -e

# Configuration
PORT=${PORT:-3000}
NODE_ENV=${NODE_ENV:-production}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting ePaper CMS...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with required environment variables"
    exit 1
fi

# Check if standalone build exists
if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}❌ Error: Standalone build not found!${NC}"
    echo "Please run 'npm run build' first"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check database connection
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Start the application
echo -e "${GREEN}✅ Starting application on port $PORT...${NC}"
cd .next/standalone

# Run with node
NODE_ENV=$NODE_ENV PORT=$PORT node server.js
