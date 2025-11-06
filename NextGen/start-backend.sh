#!/bin/bash

# Chronicle Backend Startup Script

echo "=================================="
echo "Chronicle Backend - Starting"
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

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/installed.flag" ]; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed.flag
fi

# Run setup if first time
if [ ! -f ".setup_done" ]; then
    echo ""
    echo "🔧 Running first-time setup..."
    python setup.py
    touch .setup_done
fi

# Start the backend
echo ""
echo "🚀 Starting backend server..."
echo ""
python run.py
