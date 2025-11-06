# 🎯 Super Simple Start (3 Steps!)

The easiest way to run Chronicle NextGen without Docker.

---

## Prerequisites

Install these first (one-time only):

1. **Python 3.11+**: https://www.python.org/downloads/
2. **Node.js 18+**: https://nodejs.org/
3. **MongoDB**: https://www.mongodb.com/try/download/community

---

## 🚀 Method 1: Automatic (Linux/Mac)

### Step 1: Make scripts executable
```bash
cd NextGen
chmod +x start-backend.sh start-frontend.sh start-all.sh
```

### Step 2: Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod
```

### Step 3: Run everything
```bash
./start-all.sh
```

That's it! Two terminals will open automatically.

✅ Frontend: http://localhost:5173
✅ Backend: http://localhost:5000

---

## 🚀 Method 2: Manual (All OS including Windows)

Open **2 separate terminals/command prompts**:

### Terminal 1 - Backend
```bash
cd NextGen/backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Setup database (first time only)
python setup.py

# Start backend
python run.py
```

### Terminal 2 - Frontend
```bash
cd NextGen/frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev
```

Done! ✅

---

## 🎉 Access the App

**Student:**
1. Go to: http://localhost:5173/register
2. Register and login

**Admin:**
1. Go to: http://localhost:5173/staff-login
2. Login with:
   - Login ID: `admin001`
   - Password: `admin123`

---

## 📌 Quick Commands Reference

### Backend (Python)
```bash
cd NextGen/backend
python run.py              # Start server
python setup.py            # Setup database
```

### Frontend (Node)
```bash
cd NextGen/frontend
npm run dev               # Start server
npm install               # Install dependencies
```

### MongoDB
```bash
# Start
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux

# Check status
mongosh                                # Should connect
```

---

## ⚠️ Common Issues

### "MongoDB connection failed"
➡️ **Solution:** Start MongoDB first
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Check it's running
mongosh
```

### "Port 5000 already in use"
➡️ **Solution:** Kill the process
```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "Module not found"
➡️ **Solution:** Install dependencies
```bash
cd NextGen/backend
pip install -r requirements.txt
```

---

## 🛑 Stop Servers

Press **Ctrl+C** in each terminal window.

---

## 💡 Tips

- Backend auto-reloads when you change Python files
- Frontend has hot-reload (instant updates)
- View API docs: http://localhost:5000/api/docs
- Check health: http://localhost:5000/api/health

---

**Need help?** Check `START.md` for detailed instructions.

**Happy coding! 🎉**
