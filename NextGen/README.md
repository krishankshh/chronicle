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
- ✅ Docker containerization
- ✅ Complete API documentation (Swagger)

## Technology Stack

### Backend
- **Python 3.11** with **Flask 3.0**
- **MongoDB 6** (NoSQL database)
- **Redis** (caching & sessions)
- **Flask-JWT-Extended** (JWT authentication)
- **Flask-RESTX** (REST API with Swagger docs)
- **Bcrypt** (password hashing)
- **Docker** (containerization)

### Frontend
- **React 18.2**
- **Vite 5.0** (build tool)
- **Tailwind CSS 3.4** (styling)
- **React Router 6.21** (routing)
- **Zustand** (state management)
- **Axios** (HTTP client)
- **React Hook Form + Zod** (form validation)
- **Lucide React** (icons)

## Prerequisites

- **Docker** and **Docker Compose** (recommended)
- **Node.js 18+** and **npm** (for local development)
- **Python 3.11+** (for local backend development)
- **MongoDB 6+** (if running without Docker)

## Quick Start with Docker (Recommended)

### 1. Clone and Navigate
```bash
cd NextGen
```

### 2. Create Environment Files

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work with Docker)
cd ..
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Edit frontend/.env:
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
cd ..
```

### 3. Start All Services
```bash
docker-compose up --build
```

This will start:
- **MongoDB** on port 27017
- **Redis** on port 6379
- **Backend API** on port 5000
- **Frontend** on port 5173

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **API Documentation (Swagger):** http://localhost:5000/api/docs
- **API Health Check:** http://localhost:5000/api/health

### 5. Create Test Accounts

**Create Admin User (via MongoDB):**
```bash
docker exec -it chronicle_mongo mongosh chronicle_db
```

In MongoDB shell:
```javascript
db.users.insertOne({
  login_id: "admin001",
  name: "Admin User",
  email: "admin@chronicle.com",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzZ3.", // password: admin123
  user_type: "Admin",
  user_img: null,
  status: "Active",
  created_at: new Date(),
  updated_at: new Date()
})

// Or create a staff user
db.users.insertOne({
  login_id: "staff001",
  name: "Staff Member",
  email: "staff@chronicle.com",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzZ3.", // password: admin123
  user_type: "Staff",
  user_img: null,
  status: "Active",
  created_at: new Date(),
  updated_at: new Date()
})
```

**Register Student (via UI):**
- Go to http://localhost:5173/register
- Fill in the registration form
- Login at http://localhost:5173/login

## Local Development (Without Docker)

### Backend Setup

1. **Install MongoDB and Redis locally**

2. **Setup Python environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env for local development:
# MONGO_URI=mongodb://localhost:27017
# MONGO_DB_NAME=chronicle_db
# REDIS_URL=redis://localhost:6379/0
```

4. **Run the backend:**
```bash
python wsgi.py
```

Backend will run on http://localhost:5000

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env:
# VITE_API_BASE_URL=http://localhost:5000/api
```

3. **Run the frontend:**
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## API Endpoints

### Authentication

#### Student Registration
```http
POST /api/auth/student/register
Content-Type: application/json

{
  "roll_no": "CS2021001",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "course": "BCA",
  "semester": 1,
  "batch": "2021-2024",
  "mob_no": "+1234567890"
}
```

#### Student Login
```http
POST /api/auth/student/login
Content-Type: application/json

{
  "roll_no": "CS2021001",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

#### Staff/Admin Login
```http
POST /api/auth/staff/login
Content-Type: application/json

{
  "login_id": "admin001",
  "password": "admin123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## Project Structure

```
NextGen/
├── backend/                      # Flask Backend
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py            # Configuration
│   │   ├── db.py                # MongoDB connection
│   │   ├── models/              # Model helpers
│   │   │   ├── student.py       # Student helper
│   │   │   └── user.py          # User helper
│   │   ├── blueprints/          # API endpoints
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── students.py      # Student routes
│   │   │   └── users.py         # User routes
│   │   └── utils/               # Utilities
│   │       └── decorators.py    # Auth decorators
│   ├── requirements.txt         # Python dependencies
│   ├── wsgi.py                  # WSGI entry point
│   ├── Dockerfile               # Backend container
│   └── .env.example             # Environment template
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── features/            # Feature modules
│   │   │   ├── auth/            # Auth pages
│   │   │   │   ├── StudentLogin.jsx
│   │   │   │   ├── StaffLogin.jsx
│   │   │   │   └── StudentRegister.jsx
│   │   │   └── dashboard/       # Dashboard
│   │   │       └── Dashboard.jsx
│   │   ├── components/          # Reusable components
│   │   │   └── layout/          # Layout components
│   │   │       ├── Header.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       ├── MainLayout.jsx
│   │   │       └── ProtectedRoute.jsx
│   │   ├── lib/                 # Libraries
│   │   │   ├── api.js           # Axios instance
│   │   │   └── utils.js         # Utilities
│   │   ├── store/               # State management
│   │   │   └── authStore.js     # Auth store (Zustand)
│   │   ├── styles/              # Global styles
│   │   │   └── index.css        # Tailwind CSS
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── package.json             # Dependencies
│   ├── vite.config.js           # Vite config
│   ├── tailwind.config.js       # Tailwind config
│   ├── Dockerfile               # Frontend container
│   └── .env.example             # Environment template
│
├── docker-compose.yml           # Docker orchestration
└── README.md                    # This file
```

## Database Schema (MongoDB)

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
  batch: String,          // e.g., "2021-2024"
  student_img: String,    // URL or null
  about_student: String,  // Bio or null
  mob_no: String,         // Mobile number or null
  status: String,         // "Active" or "Inactive"
  email_verified: Boolean, // Default: false
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
  user_img: String,       // URL or null
  status: String,         // "Active" or "Inactive"
  created_at: Date,
  updated_at: Date
}
```

## Security Features

- **Bcrypt Password Hashing** (12 rounds)
- **JWT Authentication** with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- **Role-based Access Control** (Student, Staff, Admin)
- **CORS Configuration** for secure cross-origin requests
- **Input Validation** with Zod schemas
- **MongoDB Unique Indexes** to prevent duplicate accounts
- **Protected API Routes** with JWT verification

## Development Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python wsgi.py

# Run with auto-reload (Flask debug mode)
FLASK_ENV=development python wsgi.py
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Docker
```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose up --build backend
docker-compose up --build frontend

# Execute command in container
docker exec -it chronicle_backend bash
docker exec -it chronicle_frontend sh
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check MongoDB logs
docker logs chronicle_mongo

# Access MongoDB shell
docker exec -it chronicle_mongo mongosh chronicle_db

# List all databases
show dbs

# List collections in chronicle_db
use chronicle_db
show collections
```

### Backend Not Starting
```bash
# Check backend logs
docker logs chronicle_backend

# Rebuild backend
docker-compose up --build backend

# Check if port 5000 is already in use
lsof -i :5000
```

### Frontend Not Loading
```bash
# Check frontend logs
docker logs chronicle_frontend

# Rebuild frontend
docker-compose up --build frontend

# Check if port 5173 is already in use
lsof -i :5173

# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
- Ensure `CORS_ORIGINS` in backend `.env` includes your frontend URL
- Check that frontend is making requests to the correct API URL

### Authentication Issues
- Clear browser local storage
- Check that JWT_SECRET_KEY is set in backend `.env`
- Verify tokens are being sent in Authorization header

## Testing the Application

### 1. Test Student Registration
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

### 2. Test Student Login
```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "TEST001",
    "password": "password123"
  }'
```

### 3. Test Protected Endpoint
```bash
# Save token from login response
TOKEN="<your_access_token>"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Next Steps (Phase 2)

Phase 2 will implement:
- ✨ User profile management with avatar upload
- ✨ Student CRUD operations (Admin)
- ✨ User management (Admin)
- ✨ Advanced search and filtering
- ✨ File upload with S3/MinIO integration
- ✨ Profile edit functionality

## Contributing

Follow the 10-phase plan in `10-PHASE-RECREATION-PLAN.md` for systematic development.

## License

Educational project for Chronicle College Social Network modernization.

---

**Phase 1 Status:** ✅ Complete
**Next Phase:** Phase 2 - User Management & Profiles
