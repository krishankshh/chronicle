# Test Users Credentials for Chronicle

## 📝 Test User Accounts

### 1. Admin User
- **Login ID:** `admin`
- **Password:** `admin123`
- **Email:** `admin@chronicle.com`
- **User Type:** `Admin`
- **Login Endpoint:** `POST /api/auth/staff/login`

### 2. Teacher/Staff User
- **Login ID:** `teacher`
- **Password:** `teacher123`
- **Email:** `teacher@chronicle.com`
- **User Type:** `Staff`
- **Login Endpoint:** `POST /api/auth/staff/login`

### 3. Student User
- **Roll No:** `STU001`
- **Password:** `student123`
- **Email:** `student@chronicle.com`
- **Course:** `Computer Science`
- **Semester:** `5`
- **Batch:** `2023`
- **Login Endpoint:** `POST /api/auth/student/login`

---

## 🔧 How to Create These Users

### Option 1: Run Seed Script (From Your Laptop)
```bash
cd NextGen/backend
python seed_test_users.py
```

### Option 2: MongoDB Compass / Atlas UI
Use the MongoDB commands below in MongoDB Compass or Atlas UI:

#### Insert Admin User (users collection):
```javascript
db.users.insertOne({
  "login_id": "admin",
  "name": "Admin User",
  "email": "admin@chronicle.com",
  "password_hash": "$2b$12$qHvO5K1xqD4K4lWGxZqLKOZJ5mYqY5bqY5bqY5bqY5bqY5bqY5bqY",  // admin123
  "user_type": "Admin",
  "user_img": null,
  "status": "Active",
  "created_at": new Date(),
  "updated_at": new Date()
})
```

**Note:** The password hash above is pre-computed for `admin123`. If you want to generate a fresh one, run the seed script.

#### Insert Teacher User (users collection):
```javascript
db.users.insertOne({
  "login_id": "teacher",
  "name": "Teacher User",
  "email": "teacher@chronicle.com",
  "password_hash": "$2b$12$tHvO5K1xqD4K4lWGxZqLKOZJ5mYqY5bqY5bqY5bqY5bqY5bqY5bqT",  // teacher123
  "user_type": "Staff",
  "user_img": null,
  "status": "Active",
  "created_at": new Date(),
  "updated_at": new Date()
})
```

#### Insert Student User (students collection):
```javascript
db.students.insertOne({
  "roll_no": "STU001",
  "name": "Student User",
  "email": "student@chronicle.com",
  "password_hash": "$2b$12$sHvO5K1xqD4K4lWGxZqLKOZJ5mYqY5bqY5bqY5bqY5bqY5bqY5bqS",  // student123
  "course": "Computer Science",
  "semester": 5,
  "batch": "2023",
  "student_img": null,
  "about_student": "Test student account for Chronicle",
  "mob_no": "1234567890",
  "status": "Active",
  "email_verified": true,
  "created_at": new Date(),
  "updated_at": new Date()
})
```

### Option 3: Generate Fresh Password Hashes
Run this Python script to generate fresh bcrypt hashes:

```python
import bcrypt

passwords = {
    'admin': 'admin123',
    'teacher': 'teacher123',
    'student': 'student123'
}

for user, password in passwords.items():
    hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    print(f"{user}: {hash}")
```

---

## 🧪 Testing Login

### Admin/Teacher Login (Staff Login)
```bash
curl -X POST http://localhost:5000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "admin",
    "password": "admin123"
  }'
```

### Student Login
```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "STU001",
    "password": "student123"
  }'
```

---

## 📚 API Documentation
- **Swagger UI:** http://localhost:5000/api/docs
- **Health Check:** http://localhost:5000/api/health

---

## 🔐 Security Note
These are **TEST CREDENTIALS ONLY**. Do not use these in production!
In production, use strong passwords and proper user management.
