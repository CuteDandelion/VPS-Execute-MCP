#!/bin/bash

# Simple server monitoring script using the VPS-Execute-MCP REST API
# This script demonstrates basic health checks and monitoring

API_URL="http://localhost:3000"
API_KEY="your-api-key-here"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls
api_call() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3

    if [ "$method" = "POST" ]; then
        curl -s -X POST "$API_URL/$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
            -d "$data"
    else
        curl -s "$API_URL/$endpoint" \
            -H "X-API-Key: $API_KEY"
    fi
}

# Health check
echo "==================================================="
echo "Server Health Check"
echo "==================================================="

# Check API connectivity
echo -n "API Server: "
health=$(curl -s "$API_URL/health")
if echo "$health" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ Online${NC}"
else
    echo -e "${RED}✗ Offline${NC}"
    exit 1
fi

# Get system info
echo -e "\n${YELLOW}System Information:${NC}"
sys_info=$(api_call "system-info")
hostname=$(echo "$sys_info" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
uptime=$(echo "$sys_info" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4)
echo "Hostname: $hostname"
echo "Uptime: $uptime"

# Check disk usage
echo -e "\n${YELLOW}Disk Usage:${NC}"
disk_cmd='{"command":"df -h / | tail -1 | awk '"'"'{print $5}'"'"'"}'
disk_usage=$(api_call "execute" "POST" "$disk_cmd")
usage=$(echo "$disk_usage" | grep -o '"stdout":"[^"]*"' | cut -d'"' -f4)
echo "Root partition: $usage"

# Check memory
echo -e "\n${YELLOW}Memory Usage:${NC}"
mem_cmd='{"command":"free -h | grep Mem | awk '"'"'{print \"Used: \" $3 \" / Total: \" $2}'"'"'"}'
mem_usage=$(api_call "execute" "POST" "$mem_cmd")
mem_info=$(echo "$mem_usage" | grep -o '"stdout":"[^"]*"' | cut -d'"' -f4)
echo "$mem_info"

# Check top processes
echo -e "\n${YELLOW}Top 5 CPU-consuming processes:${NC}"
top_cmd='{"command":"ps aux --sort=-%cpu | head -6 | tail -5 | awk '"'"'{print $11}'"'"'"}'
top_procs=$(api_call "execute" "POST" "$top_cmd")
echo "$top_procs" | grep -o '"stdout":"[^"]*"' | cut -d'"' -f4

echo -e "\n${GREEN}Health check completed!${NC}"
