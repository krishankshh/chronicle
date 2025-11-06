# Chronicle

> A modern college social networking platform for students, faculty, and administrators to connect, collaborate, and communicate.

## Overview

Chronicle is a comprehensive college social networking platform designed to facilitate communication and collaboration within educational institutions. The project consists of two parts:

1. **Legacy System** (root directory) - Original PHP/MySQL-based implementation with complete feature set
2. **Modern System** (Chronicle/ directory) - Ongoing rewrite using React, Flask, MongoDB, and React Native for improved scalability and maintainability

## Features

### Core Functionality
- **Authentication & User Management**
  - Student registration and login
  - Staff/admin authentication
  - Role-based access control
  - Profile management with avatars

- **Notices & Announcements**
  - Create and manage notices (News, Events, Meetings)
  - Filter by notice type
  - View detailed notice information

- **Discussions** (Legacy system)
  - Course-specific discussion forums
  - Threaded replies and conversations
  - Subject-wise organization

- **Quiz System** (Legacy system)
  - Multiple choice quizzes
  - Quiz creation and management
  - Results tracking and analytics

- **Chat & Messaging** (Legacy system)
  - Peer-to-peer messaging
  - Group chat functionality
  - Real-time communication

- **Course Management** (Legacy system)
  - Course materials and resources
  - Timeline posts
  - Subject organization
  - Student-course assignments

## Technology Stack

### Modern Stack (Chronicle/)

#### Backend (API)
- **Python 3.11** with **Flask 2.3+**
- **MongoDB 6** (NoSQL database)
- **Flask-JWT-Extended** (JWT authentication)
- **PyMongo 4.7+** (MongoDB driver)
- **Flask-CORS** (Cross-origin support)
- **Werkzeug** (PBKDF2 password hashing)

#### Frontend (Web)
- **React 18.2**
- **React Router 6.23** (client-side routing)
- **Vite 5.2** (build tool & dev server)
- **Axios 1.7** (HTTP client)

#### Mobile
- **React Native 0.74**
- **Expo 51** (development platform)
- **Axios 1.7** (HTTP client)

#### Infrastructure
- **Docker & Docker Compose** (containerization)

### Legacy Stack (Root directory)
- **PHP** with **MySQL**
- **jQuery**
- **TinyMCE** (rich text editor)
- **DataTables.js** (interactive tables)
- **Font Awesome 4.7** (icons)

## Prerequisites

### For Modern System
- **Node.js** 16+ and npm
- **Python** 3.11+
- **Docker** and **Docker Compose** (for containerized setup)
- **MongoDB** 6+ (if running locally without Docker)
- **Git**

### For Legacy System
- **PHP** 7.0+
- **MySQL** 5.7+
- **Apache/Nginx** web server
- **phpMyAdmin** (optional, for database management)

## Installation & Setup

### Modern System Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd chronicle
```

#### 2. Setup Backend (API)

**Using Docker (Recommended):**
```bash
cd Chronicle
docker compose up --build
```
This starts MongoDB and the Flask API.

**Without Docker:**
```bash
cd Chronicle/api

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your settings:
# - MONGO_URI=mongodb://localhost:27017
# - MONGO_DB_NAME=chronicle
# - JWT_SECRET=your-secret-key

# Start MongoDB locally
mongod

# Run the API
python app.py
```

The API will be available at `http://localhost:5000`

#### 3. Seed Sample Data (Optional)
```bash
cd Chronicle/api
python seed.py
```

#### 4. Setup Web Frontend
```bash
cd Chronicle/web

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env:
# VITE_API_BASE_URL=http://localhost:5000

# Start development server
npm run dev
```

The web app will be available at `http://localhost:5173`

#### 5. Setup Mobile App (Optional)
```bash
cd Chronicle/mobile

# Install dependencies
npm install

# Configure environment variables
# Create .env or set EXPO_PUBLIC_API_BASE_URL

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Legacy System Setup

1. **Setup Web Server**
   - Install Apache/Nginx with PHP support
   - Configure document root to the repository root directory

2. **Setup Database**
   ```bash
   # Import the database schema
   mysql -u root -p < Database/college_social_network.sql
   ```

3. **Configure Database Connection**
   - Update database credentials in PHP connection files
   - Ensure proper file permissions for upload directories

4. **Access the Application**
   - Navigate to `http://localhost/chronicle` in your browser

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register Student
```http
POST /auth/student/register
Content-Type: application/json

{
  "rollNo": "CS2021001",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "course": "Computer Science",
  "semester": 6,
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Student Login
```http
POST /auth/student/login
Content-Type: application/json

{
  "rollNo": "CS2021001",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "...",
    "rollNo": "CS2021001",
    "name": "John Doe",
    "role": "student"
  }
}
```

#### Staff/Admin Login
```http
POST /auth/staff/login
Content-Type: application/json

{
  "loginId": "staff001",
  "password": "securepassword"
}
```

### Notices Endpoints

#### Get All Notices
```http
GET /notices?type=News
Authorization: Bearer <token>

Query Parameters:
- type (optional): News | Event | Meeting
```

#### Get Single Notice
```http
GET /notices/<notice_id>
Authorization: Bearer <token>
```

#### Create Notice
```http
POST /notices
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Important Announcement",
  "description": "Details about the announcement",
  "type": "News",
  "date": "2025-11-06",
  "image": "https://example.com/image.jpg"
}
```

### Health Check
```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-11-06T12:00:00"
}
```

## Project Structure

```
chronicle/
├── Chronicle/                    # Modern rewrite (monorepo)
│   ├── api/                      # Flask backend
│   │   ├── blueprints/           # API modules
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   └── notices.py        # Notices endpoints
│   │   ├── app.py                # Flask application factory
│   │   ├── db.py                 # MongoDB connection
│   │   ├── requirements.txt      # Python dependencies
│   │   ├── Dockerfile            # API container
│   │   ├── .env.example          # Environment template
│   │   ├── seed.py               # Database seeding
│   │   └── utils.py              # Utility functions
│   │
│   ├── web/                      # React frontend
│   │   ├── src/
│   │   │   ├── api/              # API client
│   │   │   ├── pages/            # React pages
│   │   │   │   ├── Home.jsx      # Home/notices page
│   │   │   │   └── Login.jsx     # Login page
│   │   │   ├── App.jsx           # Main component
│   │   │   ├── main.jsx          # Entry point
│   │   │   └── styles.css        # Global styles
│   │   ├── package.json          # Dependencies
│   │   ├── vite.config.js        # Vite configuration
│   │   └── .env.example          # Environment template
│   │
│   ├── mobile/                   # React Native app
│   │   ├── src/
│   │   │   └── api/              # Mobile API client
│   │   ├── app.json              # Expo configuration
│   │   ├── package.json          # Dependencies
│   │   └── babel.config.js       # Babel config
│   │
│   ├── docker-compose.yml        # Service orchestration
│   └── README.md                 # Migration documentation
│
├── Legacy PHP System (root)      # Original implementation
│   ├── index.php                 # Main entry point
│   ├── dashboard.php             # User dashboard
│   ├── student.php               # Student management
│   ├── user.php                  # User management
│   ├── chat/                     # Chat functionality
│   ├── quiz/                     # Quiz system
│   ├── Database/                 # MySQL schema
│   │   └── college_social_network.sql
│   ├── assets/                   # CSS, fonts, images
│   ├── richtexteditor/           # TinyMCE editor
│   ├── DataTables/               # DataTables library
│   └── onlinechat/               # Chat assets
│
└── README.md                     # This file
```

## Development Workflow

### Running Development Servers

**Modern System:**
```bash
# Terminal 1: API
cd Chronicle/api
python app.py

# Terminal 2: Web
cd Chronicle/web
npm run dev

# Terminal 3: Mobile (optional)
cd Chronicle/mobile
npm start
```

**With Docker:**
```bash
# Start all services
cd Chronicle
docker compose up

# In another terminal, start web frontend
cd Chronicle/web
npm run dev
```

### Building for Production

**Web Frontend:**
```bash
cd Chronicle/web
npm run build
npm run preview  # Test production build
```

**API:**
```bash
cd Chronicle/api
# Docker production build
docker build -t chronicle-api .
```

## Migration Status

### ✅ Completed
- Authentication module (student & staff)
- Notices CRUD operations
- Basic web UI with routing
- Mobile app scaffold
- Docker containerization
- Database initialization

### 🚧 In Progress
- Complete UI/UX design for web and mobile
- File upload functionality
- Enhanced error handling

### 📋 Planned
- Discussions module migration
- Quiz system migration
- Chat & messaging migration
- Timeline posts migration
- Course management migration
- Materials upload/download
- Data migration from MySQL to MongoDB
- Production deployment setup
- Comprehensive testing suite

## Database Models

### Students Collection
```javascript
{
  _id: ObjectId,
  rollNo: String,      // Unique identifier
  name: String,
  email: String,
  password: String,    // PBKDF2 hashed
  course: String,
  semester: Number,
  avatar: String,
  status: String,      // "Active" | "Inactive"
  createdAt: Date
}
```

### Users Collection (Staff/Admin)
```javascript
{
  _id: ObjectId,
  loginId: String,     // Unique identifier
  name: String,
  email: String,
  password: String,    // PBKDF2 hashed
  userType: String,    // "Staff" | "Admin"
  status: String,
  createdAt: Date
}
```

### Notices Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  type: String,        // "News" | "Event" | "Meeting"
  date: Date,
  image: String,       // URL
  createdAt: Date
}
```

## Environment Variables

### API (.env)
```env
MONGO_URI=mongodb://mongo:27017
MONGO_DB_NAME=chronicle
JWT_SECRET=your-secret-key-change-in-production
```

### Web (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Security Features

- **Password Hashing**: Werkzeug PBKDF2 algorithm
- **JWT Authentication**: Secure token-based authentication
- **CORS Configuration**: Controlled cross-origin requests
- **Role-based Access**: Student/Staff/Admin role separation
- **Input Validation**: Server-side validation for all inputs

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/React code
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed

## Testing

```bash
# API tests (when implemented)
cd Chronicle/api
pytest

# Web tests (when implemented)
cd Chronicle/web
npm test
```

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running on the correct port
- Check MONGO_URI in .env file
- Verify network connectivity if using Docker

**CORS Errors:**
- Verify frontend URL is listed in Flask CORS configuration
- Check that API is running on the expected port

**Port Already in Use:**
```bash
# Find process using port
lsof -i :5000  # For API
lsof -i :5173  # For web

# Kill process
kill -9 <PID>
```

**Module Not Found Errors:**
```bash
# Reinstall dependencies
npm install  # For web/mobile
pip install -r requirements.txt  # For API
```

## License

This project is part of an educational initiative. Please contact the repository owner for licensing information.

## Contact & Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Contact the development team
- Check existing documentation in `/Chronicle/README.md`

---

**Note**: This project is actively under development. The modern system (Chronicle/) is the recommended platform for new development, while the legacy system remains available for reference and feature comparison.
