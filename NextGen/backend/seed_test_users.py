"""Seed test users for Admin, Teacher, and Student."""
import os
import sys
from datetime import datetime
import bcrypt
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'chronicle_db')

def hash_password(password):
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_test_users():
    """Create test users for Admin, Teacher, and Student."""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]

        print("=" * 60)
        print("CREATING TEST USERS FOR CHRONICLE")
        print("=" * 60)

        # 1. Create Admin User
        admin_data = {
            'login_id': 'admin',
            'name': 'Admin User',
            'email': 'admin@chronicle.com',
            'password_hash': hash_password('admin123'),
            'user_type': 'Admin',
            'user_img': None,
            'status': 'Active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        # Check if admin already exists
        existing_admin = db.users.find_one({'login_id': 'admin'})
        if existing_admin:
            print("\n❌ Admin user already exists. Updating password...")
            db.users.update_one(
                {'login_id': 'admin'},
                {'$set': {'password_hash': hash_password('admin123'), 'updated_at': datetime.utcnow()}}
            )
            print("✅ Admin password updated")
        else:
            result = db.users.insert_one(admin_data)
            print(f"\n✅ Admin created successfully!")

        print(f"\n📝 ADMIN CREDENTIALS:")
        print(f"   Login ID: admin")
        print(f"   Password: admin123")
        print(f"   Email: admin@chronicle.com")
        print(f"   Type: Admin")

        # 2. Create Teacher/Staff User
        teacher_data = {
            'login_id': 'teacher',
            'name': 'Teacher User',
            'email': 'teacher@chronicle.com',
            'password_hash': hash_password('teacher123'),
            'user_type': 'Staff',
            'user_img': None,
            'status': 'Active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        # Check if teacher already exists
        existing_teacher = db.users.find_one({'login_id': 'teacher'})
        if existing_teacher:
            print("\n❌ Teacher user already exists. Updating password...")
            db.users.update_one(
                {'login_id': 'teacher'},
                {'$set': {'password_hash': hash_password('teacher123'), 'updated_at': datetime.utcnow()}}
            )
            print("✅ Teacher password updated")
        else:
            result = db.users.insert_one(teacher_data)
            print(f"\n✅ Teacher created successfully!")

        print(f"\n📝 TEACHER CREDENTIALS:")
        print(f"   Login ID: teacher")
        print(f"   Password: teacher123")
        print(f"   Email: teacher@chronicle.com")
        print(f"   Type: Staff")

        # 3. Create Student User
        student_data = {
            'roll_no': 'STU001',
            'name': 'Student User',
            'email': 'student@chronicle.com',
            'password_hash': hash_password('student123'),
            'course': 'Computer Science',
            'semester': 5,
            'batch': '2023',
            'student_img': None,
            'about_student': 'Test student account for Chronicle',
            'mob_no': '1234567890',
            'status': 'Active',
            'email_verified': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        # Check if student already exists
        existing_student = db.students.find_one({'roll_no': 'STU001'})
        if existing_student:
            print("\n❌ Student user already exists. Updating password...")
            db.students.update_one(
                {'roll_no': 'STU001'},
                {'$set': {'password_hash': hash_password('student123'), 'updated_at': datetime.utcnow()}}
            )
            print("✅ Student password updated")
        else:
            result = db.students.insert_one(student_data)
            print(f"\n✅ Student created successfully!")

        print(f"\n📝 STUDENT CREDENTIALS:")
        print(f"   Roll No: STU001")
        print(f"   Password: student123")
        print(f"   Email: student@chronicle.com")
        print(f"   Course: Computer Science")
        print(f"   Semester: 5")
        print(f"   Batch: 2023")

        print("\n" + "=" * 60)
        print("✅ ALL TEST USERS CREATED SUCCESSFULLY!")
        print("=" * 60)
        print("\n🔐 LOGIN ENDPOINTS:")
        print("   Admin/Teacher: POST /api/auth/staff/login")
        print("   Student: POST /api/auth/student/login")
        print("\n📱 You can now test the application with these credentials!")
        print("=" * 60)

        # Close connection
        client.close()

    except Exception as e:
        print(f"\n❌ Error creating test users: {e}")
        sys.exit(1)

if __name__ == '__main__':
    seed_test_users()
