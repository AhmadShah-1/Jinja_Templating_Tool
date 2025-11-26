#!/bin/bash

# Office Add-in Sideload Helper Script
# This script helps you sideload your Office Add-in in Word

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_FILE="$SCRIPT_DIR/manifest.xml"
PORT=3000
DEV_SERVER_URL="https://localhost:$PORT"

echo "=========================================="
echo "Office Add-in Sideload Helper"
echo "=========================================="
echo ""

# Check if manifest exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ Error: manifest.xml not found at $MANIFEST_FILE"
    exit 1
fi

echo "✅ Manifest file found: $MANIFEST_FILE"
echo ""

# Check if dev server is running
echo "Checking if dev server is running on port $PORT..."
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "✅ Dev server is running on port $PORT"
    SERVER_RUNNING=true
else
    echo "⚠️  Dev server is NOT running on port $PORT"
    echo ""
    echo "Please start the dev server first:"
    echo "  npm run start:linux"
    echo ""
    read -p "Would you like to start it now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting dev server in background..."
        npm run start:linux > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "Waiting for server to start..."
        sleep 5
        if lsof -i :$PORT > /dev/null 2>&1; then
            echo "✅ Dev server started (PID: $SERVER_PID)"
            SERVER_RUNNING=true
        else
            echo "❌ Failed to start dev server"
            SERVER_RUNNING=false
        fi
    else
        SERVER_RUNNING=false
    fi
fi

echo ""

# Validate manifest
echo "Validating manifest.xml..."
if npm run validate > /dev/null 2>&1; then
    echo "✅ Manifest is valid"
else
    echo "⚠️  Manifest validation failed (this might be okay for development)"
fi

echo ""
echo "=========================================="
echo "Sideload Instructions"
echo "=========================================="
echo ""
echo "To sideload your add-in in Word:"
echo ""
echo "1. Open Microsoft Word (Desktop or Word Online)"
echo ""
echo "2. Go to: Insert → Add-ins → My Add-ins"
echo ""
echo "3. Click 'Upload My Add-in' (or 'Manage My Add-ins' → 'Upload My Add-in')"
echo ""
echo "4. Select this manifest file:"
echo "   $MANIFEST_FILE"
echo ""
echo "5. Click 'Upload'"
echo ""
echo "6. After sideloading, you should see 'Stanza Assistant' button"
echo "   in the Home tab under the 'Stanza' group"
echo ""
echo "7. Click 'Stanza Assistant' to open the task pane"
echo ""

if [ "$SERVER_RUNNING" = true ]; then
    echo "✅ Dev server is running at: $DEV_SERVER_URL"
    echo ""
    echo "The add-in will load from: $DEV_SERVER_URL/taskpane.html"
else
    echo "⚠️  Make sure to start the dev server before using the add-in:"
    echo "   npm run start:linux"
fi

echo ""
echo "=========================================="
echo "Troubleshooting"
echo "=========================================="
echo ""
echo "If you see 'Please sideload your add-in' message:"
echo "  - Make sure you've uploaded the manifest.xml file"
echo "  - Try reloading the add-in"
echo ""
echo "If localhost doesn't work:"
echo "  - Make sure the dev server is running"
echo "  - Check that port $PORT is accessible"
echo "  - For Word Online, you may need a public HTTPS URL"
echo ""
echo "To stop the dev server:"
echo "  - Press Ctrl+C if running in foreground"
echo "  - Or run: lsof -i :$PORT | grep LISTEN | awk '{print \$2}' | xargs kill"
echo ""

# Try to open the manifest location (if on Windows/WSL)
if command -v explorer.exe > /dev/null 2>&1; then
    echo "Opening manifest location in Windows Explorer..."
    explorer.exe "$(wslpath -w "$SCRIPT_DIR")" 2>/dev/null || true
elif command -v xdg-open > /dev/null 2>&1; then
    echo "Manifest location: $SCRIPT_DIR"
fi

echo ""
echo "Press Enter to exit..."
read

