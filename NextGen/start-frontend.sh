#!/bin/bash

# Chronicle Frontend Startup Script

echo "=================================="
echo "Chronicle Frontend - Starting"
echo "=================================="

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the frontend
echo ""
echo "🚀 Starting frontend server..."
echo ""
npm run dev
