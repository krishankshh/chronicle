#!/bin/bash

# Chronicle Complete Startup Script
# This script starts both backend and frontend in separate terminals

echo "=================================="
echo "Chronicle - Starting All Services"
echo "=================================="

# Check if MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo ""
    echo "⚠️  MongoDB is not running!"
    echo ""
    echo "Please start MongoDB first:"
    echo "  macOS:   brew services start mongodb-community"
    echo "  Ubuntu:  sudo systemctl start mongod"
    echo ""
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to start in new terminal based on OS
start_in_terminal() {
    local title=$1
    local script=$2

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR' && bash '$script'\""
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$title" -- bash -c "cd '$SCRIPT_DIR' && bash '$script'; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$title" -e "cd '$SCRIPT_DIR' && bash '$script'; bash" &
        else
            echo "⚠️  Could not find a terminal emulator. Please run scripts manually."
            echo "   Terminal 1: bash start-backend.sh"
            echo "   Terminal 2: bash start-frontend.sh"
            exit 1
        fi
    else
        echo "⚠️  OS not supported for automatic terminal launch"
        echo "Please run these commands in separate terminals:"
        echo "   Terminal 1: bash start-backend.sh"
        echo "   Terminal 2: bash start-frontend.sh"
        exit 1
    fi
}

echo "🚀 Starting Backend..."
start_in_terminal "Chronicle Backend" "start-backend.sh"
sleep 2

echo "🚀 Starting Frontend..."
start_in_terminal "Chronicle Frontend" "start-frontend.sh"

echo ""
echo "=================================="
echo "✅ Chronicle Started!"
echo "=================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo "API Docs: http://localhost:5000/api/docs"
echo ""
echo "Press Ctrl+C in each terminal window to stop"
echo ""
