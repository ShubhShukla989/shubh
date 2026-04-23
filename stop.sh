#!/bin/bash

# Stop script for standalone deployment
# Usage: ./stop.sh

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping ePaper CMS...${NC}"

# Find and kill the process
PID=$(ps aux | grep '[n]ode server.js' | awk '{print $2}')

if [ -z "$PID" ]; then
    echo -e "${YELLOW}⚠️  No running process found${NC}"
    exit 0
fi

echo -e "${YELLOW}Found process: $PID${NC}"
kill $PID

# Wait for process to stop
sleep 2

# Check if process is still running
if ps -p $PID > /dev/null; then
    echo -e "${RED}Process still running, forcing kill...${NC}"
    kill -9 $PID
fi

echo -e "${GREEN}✅ Application stopped${NC}"
