#!/bin/bash

# Kill process on port 3000

PORT=3000

echo "Finding process using port $PORT..."

# Try different methods to find the process
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    PID=$(netstat -tulpn 2>/dev/null | grep :$PORT | awk '{print $7}' | cut -d'/' -f1 | head -1)
fi

if [ -z "$PID" ]; then
    PID=$(ss -tulpn 2>/dev/null | grep :$PORT | grep -oP 'pid=\K[0-9]+' | head -1)
fi

if [ -z "$PID" ]; then
    PID=$(fuser $PORT/tcp 2>/dev/null | awk '{print $NF}')
fi

if [ -n "$PID" ]; then
    echo "Found process $PID using port $PORT"
    echo "Killing process $PID..."
    kill -9 $PID 2>/dev/null
    sleep 1
    
    # Verify it's killed
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "⚠️  Process still running, trying force kill..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
    
    if ! lsof -i :$PORT > /dev/null 2>&1; then
        echo "✅ Port $PORT is now free"
    else
        echo "❌ Failed to kill process. You may need to run with sudo."
        echo "Try: sudo kill -9 $PID"
    fi
else
    echo "No process found using port $PORT"
    echo "Port appears to be free"
fi

