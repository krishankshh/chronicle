#!/usr/bin/env python
"""Setup script to initialize the database."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
from datetime import datetime
import bcrypt

def create_admin_user():
    """Create a default admin user."""
    print("=" * 60)
    print("Chronicle Database Setup")
    print("=" * 60)

    # Connect to MongoDB
    try:
        client = MongoClient('mongodb://localhost:27017')
        db = client['chronicle_db']
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("\nMake sure MongoDB is running:")
        print("   - Install: brew install mongodb-community (Mac)")
        print("   - Install: sudo apt-get install mongodb (Ubuntu)")
        print("   - Start: brew services start mongodb-community (Mac)")
        print("   - Start: sudo systemctl start mongod (Ubuntu)")
        sys.exit(1)

    # Check if admin already exists
    existing_admin = db.users.find_one({'login_id': 'admin001'})
    if existing_admin:
        print("\n⚠️  Admin user already exists!")
        print("   Login ID: admin001")
        print("   Password: admin123")
        print("\n" + "=" * 60)
        return

    # Create admin user
    password = 'admin123'
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    admin_user = {
        'login_id': 'admin001',
        'name': 'Admin User',
        'email': 'admin@chronicle.com',
        'password_hash': password_hash,
        'user_type': 'Admin',
        'user_img': None,
        'status': 'Active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    try:
        db.users.insert_one(admin_user)
        print("\n✅ Admin user created successfully!")
        print("\n📝 Admin Credentials:")
        print("   Login ID: admin001")
        print("   Password: admin123")
        print("\n🌐 Login at: http://localhost:5173/staff-login")
    except Exception as e:
        print(f"\n❌ Failed to create admin user: {e}")
        sys.exit(1)

    # Create indexes
    try:
        db.students.create_index('roll_no', unique=True)
        db.students.create_index('email', unique=True)
        db.users.create_index('login_id', unique=True)
        db.users.create_index('email', unique=True)
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️  Warning: Could not create indexes: {e}")

    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)

    client.close()

if __name__ == '__main__':
    create_admin_user()
