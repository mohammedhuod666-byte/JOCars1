#!/usr/bin/env bash
# Restart server and wait for it to be ready
cd "/c/Users/zi-jo.com/OneDrive/Documents/Cars JO"
pkill -f "node server.js" 2>/dev/null
sleep 2
NODE_ENV=production nohup node server.js > server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
# Wait for server to start
for i in $(seq 1 20); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
        echo "Server is ready (HTTP 200)"
        exit 0
    fi
    sleep 1
done
echo "Server failed to start within 20 seconds"
exit 1
