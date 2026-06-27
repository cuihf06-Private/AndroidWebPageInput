#!/usr/bin/env bash
# Restart the webapp (assumes it was started with nohup)
set -e
pkill -f "node /home/cuihf/AIPlayGround/Test/AndroidWebPageInput/webapp/server.js" 2>/dev/null || true
sleep 1
cd /home/cuihf/AIPlayGround/Test/AndroidWebPageInput/webapp
mkdir -p logs
nohup node server.js > logs/server.log 2>&1 &
disown
echo "Started PID=$!  log: $(pwd)/logs/server.log"
sleep 1
ss -tlnp 2>/dev/null | grep 13014 || true
curl -sS -o /dev/null -w "Health check: HTTP %{http_code}\n" http://127.0.0.1:13014/
