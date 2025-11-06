# 🚀 Quick Start Guide (Without Docker)

Simple steps to run Chronicle NextGen locally using Python commands.

---

## Prerequisites

You need these installed on your system:

1. **Python 3.11+** - [Download](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
4. **Redis** (optional, for caching) - [Download](https://redis.io/download)

---

## Installation

### 1️⃣ Install MongoDB

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
- Download from [MongoDB Downloads](https://www.mongodb.com/try/download/community)
- Install and start MongoDB Compass or run `mongod`

**Verify MongoDB is running:**
```bash
mongosh
# Should connect successfully
```

### 2️⃣ Install Redis (Optional)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
- Download from [Redis Downloads](https://redis.io/download)
- Or skip Redis (app will work without it)

---

## Setup Backend

### Step 1: Install Python Dependencies
```bash
cd NextGen/backend
pip install -r requirements.txt
```

### Step 2: Setup Database
```bash
python setup.py
```

This will:
- ✅ Create MongoDB indexes
- ✅ Create admin user (login: `admin001`, password: `admin123`)

### Step 3: Start Backend Server
```bash
python run.py
```

**Backend will start on:** http://localhost:5000

✅ API Documentation: http://localhost:5000/api/docs
✅ Health Check: http://localhost:5000/api/health

---

## Setup Frontend

### Step 1: Install Node Dependencies
```bash
cd NextGen/frontend
npm install
```

### Step 2: Start Frontend Server
```bash
npm run dev
```

**Frontend will start on:** http://localhost:5173

---

## 🎉 You're Ready!

### Access the Application

**Student:**
1. Go to http://localhost:5173/register
2. Register a new student account
3. Login at http://localhost:5173/login

**Admin/Staff:**
1. Go to http://localhost:5173/staff-login
2. Login with:
   - **Login ID:** admin001
   - **Password:** admin123

---

## Quick Commands

### Backend
```bash
cd NextGen/backend

# Install dependencies
pip install -r requirements.txt

# Setup database (run once)
python setup.py

# Start backend server
python run.py
```

### Frontend
```bash
cd NextGen/frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

### Open Multiple Terminals

**Terminal 1 - Backend:**
```bash
cd NextGen/backend
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd NextGen/frontend
npm run dev
```

---

## Troubleshooting

### MongoDB Connection Error
```
❌ Failed to connect to MongoDB
```

**Solution:**
```bash
# Check if MongoDB is running
# macOS:
brew services list | grep mongodb

# Ubuntu:
sudo systemctl status mongod

# Start MongoDB if not running
# macOS:
brew services start mongodb-community

# Ubuntu:
sudo systemctl start mongod
```

### Port Already in Use (5000 or 5173)
```
Address already in use
```

**Solution:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Module Not Found Error
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
```bash
cd NextGen/backend
pip install -r requirements.txt
```

### CORS Error in Browser
```
Access-Control-Allow-Origin error
```

**Solution:**
- Make sure backend is running on port 5000
- Check `frontend/.env` has: `VITE_API_BASE_URL=http://localhost:5000/api`

---

## Development Tips

### Auto-reload Backend on Code Changes
The backend (`python run.py`) automatically reloads when you change Python files.

### Hot Module Replacement (HMR) for Frontend
The frontend (`npm run dev`) has HMR enabled - changes reflect instantly.

### View API Documentation
Open http://localhost:5000/api/docs to see all available API endpoints with interactive testing.

### Test API with curl
```bash
# Register a student
curl -X POST http://localhost:5000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "TEST001",
    "name": "Test Student",
    "email": "test@example.com",
    "password": "password123",
    "course": "BCA",
    "semester": 1
  }'

# Login
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "TEST001",
    "password": "password123"
  }'
```

---

## Stop Servers

Press **CTRL+C** in each terminal to stop the servers.

---

## Need Help?

- Check that MongoDB is running: `mongosh`
- Check backend logs in the terminal
- Check frontend logs in the terminal
- Check browser console for errors (F12)

---

**Happy Coding! 🎉**
