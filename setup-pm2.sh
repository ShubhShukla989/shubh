#!/bin/bash

# PM2 Setup Script for ePaper CMS
# Replaces screen-based deployment with PM2
# Usage: ./setup-pm2.sh
# Run this ONCE on the server to migrate from screen to PM2

set -e

APP_NAME="epaper"
STANDALONE_PATH=".next/standalone/server.js"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ePaper CMS - PM2 Migration Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ── Step 1: Check we're in the right directory ──────────────────────────────
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Run this script from the project root (where package.json is)${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found! Please create it before continuing.${NC}"
    exit 1
fi

if [ ! -f "$STANDALONE_PATH" ]; then
    echo -e "${RED}❌ Standalone build not found at $STANDALONE_PATH${NC}"
    echo -e "${YELLOW}   Run 'npm run build' first, then re-run this script.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project root and build verified${NC}"

# ── Step 2: Kill existing screen session if running ─────────────────────────
echo ""
echo -e "${YELLOW}🔍 Checking for existing screen sessions...${NC}"
if screen -ls 2>/dev/null | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}Found screen session '$APP_NAME', killing it...${NC}"
    screen -X -S "$APP_NAME" quit || true
    echo -e "${GREEN}✅ Screen session stopped${NC}"
else
    echo -e "${YELLOW}No screen session named '$APP_NAME' found (that's fine)${NC}"
fi

# Also kill any stray node server.js processes
STRAY_PID=$(ps aux | grep '[n]ode server.js' | awk '{print $2}' | head -1)
if [ -n "$STRAY_PID" ]; then
    echo -e "${YELLOW}Killing stray node process: $STRAY_PID${NC}"
    kill "$STRAY_PID" 2>/dev/null || true
    sleep 1
fi

# ── Step 3: Install PM2 globally if not present ──────────────────────────────
echo ""
echo -e "${YELLOW}📦 Checking PM2 installation...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found, installing globally...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed: $(pm2 --version)${NC}"
fi

# ── Step 4: Load env vars for PORT ───────────────────────────────────────────
PORT=$(grep -E '^PORT=' .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | head -1)
PORT=${PORT:-3000}

# ── Step 5: Stop existing PM2 process if any ────────────────────────────────
echo ""
echo -e "${YELLOW}🔍 Checking for existing PM2 process named '$APP_NAME'...${NC}"
if pm2 describe "$APP_NAME" &>/dev/null; then
    echo -e "${YELLOW}Found existing PM2 process, stopping it...${NC}"
    pm2 delete "$APP_NAME"
fi

# ── Step 6: Copy static + public into standalone (required for Next.js standalone) ──
echo ""
echo -e "${YELLOW}📂 Copying static assets into standalone...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR/.next/static" "$SCRIPT_DIR/.next/standalone/.next/static"
cp -r "$SCRIPT_DIR/public" "$SCRIPT_DIR/.next/standalone/public"
echo -e "${GREEN}✅ Assets copied${NC}"

# ── Step 7: Start with PM2 ───────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}🚀 Starting $APP_NAME with PM2 on port $PORT...${NC}"

# Load env and start from within standalone dir (same as start.sh)
cd "$SCRIPT_DIR/.next/standalone"
env $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs) pm2 start server.js \
    --name "$APP_NAME"

echo -e "${GREEN}✅ Application started with PM2${NC}"

# ── Step 8: Save PM2 process list ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save
echo -e "${GREEN}✅ Process list saved${NC}"

# ── Step 9: Setup PM2 startup (auto-start on reboot) ─────────────────────────
echo ""
echo -e "${YELLOW}⚙️  Setting up PM2 startup on boot...${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  IMPORTANT: Run the command below as root/sudo to enable${NC}"
echo -e "${YELLOW}  auto-start on server reboot:${NC}"
echo ""
pm2 startup | tail -1
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── Step 9: Show status ───────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}Useful PM2 commands:${NC}"
echo "  pm2 logs $APP_NAME        → view live logs"
echo "  pm2 monit                 → live monitoring dashboard"
echo "  pm2 reload $APP_NAME      → zero-downtime reload (use after deploy)"
echo "  pm2 restart $APP_NAME     → hard restart"
echo "  pm2 stop $APP_NAME        → stop the app"
echo "  pm2 delete $APP_NAME      → remove from PM2"
echo ""
