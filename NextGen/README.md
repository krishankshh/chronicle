# Chronicle NextGen - Phase 1: Foundation & Authentication

Complete modern recreation of Chronicle College Social Network using **React + Vite** (Frontend) and **Flask + MongoDB** (Backend).

## ✅ Phase 1 Completed Features

- ✅ Complete authentication system (Student & Staff/Admin)
- ✅ Student registration with validation
- ✅ JWT-based authentication
- ✅ Protected routes and API endpoints
- ✅ Role-based access control
- ✅ MongoDB database with indexed collections
- ✅ Modern React UI with Tailwind CSS
- ✅ Responsive dashboard
- ✅ Simple Python commands (no Docker required!)
- ✅ Complete API documentation (Swagger)

## 🚀 Quick Start (2 Simple Steps!)

**🌐 MongoDB is already in the cloud! No installation needed!**

See **[SIMPLE-START.md](SIMPLE-START.md)** for the easiest setup.

### Prerequisites
- Python 3.11+
- Node.js 18+
- ~~MongoDB~~ ✅ Already hosted in the cloud (MongoDB Atlas)!

### Step 1: Start Backend
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

### Step 2: Start Frontend (in new terminal)
```bash
cd NextGen/frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev
```

✅ Frontend running on: http://localhost:5173

---

## 🎉 Access the Application

### Student
1. Go to http://localhost:5173/register
2. Register a new student account
3. Login at http://localhost:5173/login

### Admin/Staff
1. Go to http://localhost:5173/staff-login
2. Login with:
   - **Login ID:** `admin001`
   - **Password:** `admin123`

### API Documentation
- **Swagger Docs:** http://localhost:5000/api/docs
- **Health Check:** http://localhost:5000/api/health

---

## Technology Stack

### Backend
- **Python 3.11** with **Flask 3.0**
- **MongoDB 6** (NoSQL database)
- **Redis** (optional - caching)
- **Flask-JWT-Extended** (JWT authentication)
- **Flask-RESTX** (REST API with Swagger docs)
- **Bcrypt** (password hashing)

### Frontend
- **React 18.2**
- **Vite 5.0** (build tool)
- **Tailwind CSS 3.4** (styling)
- **React Router 6.21** (routing)
- **Zustand** (state management)
- **Axios** (HTTP client)
- **React Hook Form + Zod** (form validation)
- **Lucide React** (icons)

---

## 📁 Project Structure

```
NextGen/
├── backend/                      # Flask Backend
│   ├── app/
│   │   ├── blueprints/          # API endpoints
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── students.py      # Student routes
│   │   │   └── users.py         # User routes
│   │   ├── models/              # MongoDB helpers
│   │   │   ├── student.py       # Student model
│   │   │   └── user.py          # User model
│   │   ├── utils/               # Utilities
│   │   │   └── decorators.py    # Auth decorators
│   │   ├── db.py                # MongoDB connection
│   │   ├── config.py            # Configuration
│   │   └── __init__.py          # App factory
│   ├── requirements.txt         # Python dependencies
│   ├── run.py                   # Start server (EASY!)
│   ├── setup.py                 # Database setup
│   └── .env                     # Configuration
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── features/            # Feature modules
│   │   │   ├── auth/            # Login/Register pages
│   │   │   └── dashboard/       # Dashboard
│   │   ├── components/          # Reusable components
│   │   │   └── layout/          # Layout components
│   │   ├── lib/                 # Utilities
│   │   │   ├── api.js           # Axios client
│   │   │   └── utils.js         # Helper functions
│   │   ├── store/               # State management
│   │   │   └── authStore.js     # Auth store (Zustand)
│   │   ├── styles/              # Global styles
│   │   └── App.jsx              # Main app
│   ├── package.json             # Dependencies
│   └── .env                     # Configuration
│
├── start-backend.sh             # Auto-start backend (Linux/Mac)
├── start-frontend.sh            # Auto-start frontend (Linux/Mac)
├── start-all.sh                 # Start everything (Linux/Mac)
├── SIMPLE-START.md              # Easiest setup guide
├── START.md                     # Detailed setup guide
└── README.md                    # This file
```

---

## 🎯 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/student/register` | Register new student |
| POST | `/api/auth/student/login` | Student login |
| POST | `/api/auth/staff/login` | Staff/Admin login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/health` | Health check |

### Example: Register Student
```bash
curl -X POST http://localhost:5000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "CS2021001",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "course": "BCA",
    "semester": 1
  }'
```

### Example: Student Login
```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "CS2021001",
    "password": "password123"
  }'
```

**Full Swagger Documentation:** http://localhost:5000/api/docs

---

## 💾 Database Schema (MongoDB)

### Students Collection
```javascript
{
  _id: ObjectId,
  roll_no: String,        // Unique, indexed
  name: String,
  email: String,          // Unique, indexed
  password_hash: String,  // Bcrypt hashed
  course: String,         // BCA, BCom, BA, BSc, BBM
  semester: Number,       // 1-8
  batch: String,
  student_img: String,
  about_student: String,
  mob_no: String,
  status: String,         // "Active" or "Inactive"
  email_verified: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Users Collection (Staff/Admin)
```javascript
{
  _id: ObjectId,
  login_id: String,       // Unique, indexed
  name: String,
  email: String,          // Unique, indexed
  password_hash: String,  // Bcrypt hashed
  user_type: String,      // "Staff" or "Admin"
  user_img: String,
  status: String,         // "Active" or "Inactive"
  created_at: Date,
  updated_at: Date
}
```

---

## 🔒 Security Features

- ✅ **Bcrypt Password Hashing** (12 rounds)
- ✅ **JWT Authentication** (15min access, 7day refresh)
- ✅ **Role-based Access Control** (Student, Staff, Admin)
- ✅ **CORS Configuration**
- ✅ **Input Validation** (Zod schemas)
- ✅ **MongoDB Unique Indexes**
- ✅ **Protected API Routes**

---

## 🛠️ Development Commands

### Backend
```bash
cd NextGen/backend

# Install dependencies
pip install -r requirements.txt

# Setup database (creates admin user)
python setup.py

# Start development server
python run.py

# The server auto-reloads when you change Python files
```

### Frontend
```bash
cd NextGen/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Using Shell Scripts (Linux/Mac)
```bash
cd NextGen

# Make scripts executable (first time only)
chmod +x *.sh

# Start backend
./start-backend.sh

# Start frontend (in new terminal)
./start-frontend.sh

# Or start everything at once
./start-all.sh
```

---

## ⚠️ Troubleshooting

### MongoDB Connection Failed
```
❌ Failed to connect to MongoDB
```

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not, start MongoDB:
# macOS:
brew services start mongodb-community

# Ubuntu:
sudo systemctl start mongod

# Check status:
brew services list | grep mongodb     # macOS
sudo systemctl status mongod          # Ubuntu
```

### Port Already in Use (5000)
```
Address already in use: Port 5000
```

**Solution:**
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9

# Or use a different port by editing backend/.env:
# Change port in run.py if needed
```

### Module Not Found
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
- Ensure backend is running on http://localhost:5000
- Check `frontend/.env` has: `VITE_API_BASE_URL=http://localhost:5000/api`
- Restart both servers

### Admin Login Not Working
**Solution:**
Run the setup script to create admin user:
```bash
cd NextGen/backend
python setup.py
```

Default admin credentials:
- Login ID: `admin001`
- Password: `admin123`

---

## 📚 Additional Documentation

- **[SIMPLE-START.md](SIMPLE-START.md)** - Super simple 2-step setup
- **[MONGODB-ATLAS.md](MONGODB-ATLAS.md)** - All about your cloud database
- **[START.md](START.md)** - Detailed setup instructions
- **[10-PHASE-RECREATION-PLAN.md](10-PHASE-RECREATION-PLAN.md)** - Complete 10-phase roadmap

---

## 🧪 Testing the API

### Using curl

**Register Student:**
```bash
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
```

**Student Login:**
```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "TEST001",
    "password": "password123"
  }'
```

**Get Current User:**
```bash
# Save the access_token from login response
TOKEN="your_access_token_here"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using Swagger UI
Visit http://localhost:5000/api/docs for interactive API testing!

---

## 🐳 Docker Setup (Optional)

If you prefer Docker, see [Docker instructions](docker-compose.yml):

```bash
# Start all services with Docker
docker-compose up --build

# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

---

## 🎯 Next Steps (Phase 2)

Phase 2 will implement:
- ✨ User profile management
- ✨ Avatar upload
- ✨ Student CRUD operations (Admin)
- ✨ User management (Admin)
- ✨ Advanced search and filtering
- ✨ File upload with S3/MinIO

See [10-PHASE-RECREATION-PLAN.md](10-PHASE-RECREATION-PLAN.md) for the complete roadmap.

---

## 💡 Tips

- Backend auto-reloads when you edit Python files (Flask debug mode)
- Frontend has Hot Module Replacement (instant updates)
- Use MongoDB Compass to view/edit database visually
- Check browser console (F12) for frontend errors
- Check terminal for backend errors

---

## 📝 Environment Variables

### Backend (.env)
```env
FLASK_ENV=development
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chronicle_db
JWT_SECRET_KEY=your-secret-key
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🤝 Contributing

Follow the 10-phase plan for systematic development.

---

## 📄 License

Educational project for Chronicle College Social Network modernization.

---

**Phase 1 Status:** ✅ **COMPLETE**

**Simple commands. No Docker needed. Just Python! 🐍**

Start coding: `python run.py` 🚀
