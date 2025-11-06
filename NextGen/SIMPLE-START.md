# 🎯 Super Simple Start (2 Steps!)

The easiest way to run Chronicle NextGen - **No MongoDB installation needed!**

Your database is already in the cloud (MongoDB Atlas) ☁️

---

## Prerequisites

Install these first (one-time only):

1. **Python 3.11+**: https://www.python.org/downloads/
2. **Node.js 18+**: https://nodejs.org/

**That's it!** MongoDB is already hosted in the cloud - no installation needed! 🎉

---

## 🚀 Quick Start (2 Simple Commands)

Open **2 separate terminals**:

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

✅ Backend running on: http://localhost:5000

### Terminal 2 - Frontend
```bash
cd NextGen/frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev
```

✅ Frontend running on: http://localhost:5173

**Done!** No MongoDB installation required! 🎉

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

**API Documentation:**
- Swagger UI: http://localhost:5000/api/docs
- Health Check: http://localhost:5000/api/health

---

## 🌐 About Your Database

Your app uses **MongoDB Atlas** (cloud database):
- ☁️ **Already hosted** - No installation needed
- 🔒 **Secure** - Automatic backups
- 🚀 **Fast** - Global CDN
- 💰 **Free tier** - Perfect for development

See [MONGODB-ATLAS.md](MONGODB-ATLAS.md) for more details.

---

## 🛠️ Shell Scripts (Linux/Mac)

For automatic startup:

### Make scripts executable (first time)
```bash
cd NextGen
chmod +x *.sh
```

### Start backend
```bash
./start-backend.sh
```

### Start frontend (new terminal)
```bash
./start-frontend.sh
```

### Or start everything at once
```bash
./start-all.sh
```

This will open both in separate terminal windows automatically!

---

## 📌 Quick Commands Reference

### Backend (Python)
```bash
cd NextGen/backend
python run.py              # Start server
python setup.py            # Setup database (first time)
pip install -r requirements.txt  # Install dependencies
```

### Frontend (Node)
```bash
cd NextGen/frontend
npm run dev                # Start server
npm install                # Install dependencies
npm run build              # Build for production
```

---

## ⚠️ Troubleshooting

### "Cannot connect to MongoDB"
➡️ **Check your internet connection** - MongoDB Atlas needs internet access

### "Authentication failed"
➡️ **Verify credentials** - Check `backend/.env` has the correct MongoDB URI

### "Port 5000 already in use"
➡️ **Kill the process:**
```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "Module not found"
➡️ **Install dependencies:**
```bash
cd NextGen/backend
pip install -r requirements.txt
```

### Need to see your database?
➡️ **Use MongoDB Compass:**
1. Download: https://www.mongodb.com/try/download/compass
2. Connect using the URI from `backend/.env`
3. Browse your collections visually!

---

## 🛑 Stop Servers

Press **Ctrl+C** in each terminal window.

---

## 💡 Tips

- Backend auto-reloads when you edit Python files ✅
- Frontend has hot-reload (instant updates) ✅
- Check browser console (F12) for frontend errors
- Check terminal for backend errors
- Use Swagger UI for API testing: http://localhost:5000/api/docs

---

## 📚 More Information

- **[MONGODB-ATLAS.md](MONGODB-ATLAS.md)** - All about your cloud database
- **[START.md](START.md)** - Detailed setup instructions
- **[README.md](README.md)** - Complete documentation
- **[10-PHASE-RECREATION-PLAN.md](10-PHASE-RECREATION-PLAN.md)** - Development roadmap

---

## ✨ What Makes This Simple?

✅ **No MongoDB installation** - Already in the cloud
✅ **No Docker required** - Just Python and Node
✅ **2 commands** - `python run.py` and `npm run dev`
✅ **Auto setup** - `python setup.py` does everything
✅ **Auto reload** - Code changes reflect instantly
✅ **Clear errors** - Helpful messages when something's wrong

---

**Ready in 2 steps! Just Python and Node! 🚀**

```bash
# Terminal 1
cd NextGen/backend && python run.py

# Terminal 2
cd NextGen/frontend && npm run dev
```

**No MongoDB installation. No Docker. Just code! 🎉**
