#!/usr/bin/env python
"""Setup script to initialize the database."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
from datetime import datetime
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_admin_user():
    """Create a default admin user."""
    print("=" * 60)
    print("Chronicle Database Setup")
    print("=" * 60)

    # Get MongoDB URI from environment
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('MONGO_DB_NAME', 'chronicle_db')

    print(f"\n🔗 Connecting to MongoDB...")
    print(f"   URI: {mongo_uri.split('@')[1] if '@' in mongo_uri else mongo_uri}")
    print(f"   Database: {db_name}")

    # Connect to MongoDB
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        # Test connection
        client.server_info()
        print("✅ Connected to MongoDB successfully!")
    except Exception as e:
        print(f"\n❌ Failed to connect to MongoDB: {e}")
        print("\nTroubleshooting:")
        print("   1. Check your MONGO_URI in .env file")
        print("   2. For MongoDB Atlas: Verify credentials and network access")
        print("   3. For Local MongoDB: Make sure it's running")
        print("      - macOS: brew services start mongodb-community")
        print("      - Ubuntu: sudo systemctl start mongod")
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
        db.notices.create_index('type')
        db.notices.create_index('status')
        db.notices.create_index('is_featured')
        db.notices.create_index('publish_start')
        db.materials.create_index('course_id')
        db.materials.create_index('subject_id')
        db.materials.create_index('semester')
        db.materials.create_index('title')
        db.materials.create_index('created_at')
        db.quizzes.create_index('course_id')
        db.quizzes.create_index('subject_id')
        db.quizzes.create_index('semester')
        db.quizzes.create_index('status')
        db.questions.create_index('quiz_id')
        db.quiz_attempts.create_index('quiz_id')
        db.quiz_attempts.create_index('student_id')
        db.discussions.create_index('course_id')
        db.discussions.create_index('subject_id')
        db.discussions.create_index('semester')
        db.discussions.create_index('updated_at')
        db.discussion_replies.create_index('discussion_id')
        db.discussion_replies.create_index('parent_reply_id')
        db.chat_sessions.create_index('participants')
        db.chat_sessions.create_index('updated_at')
        db.group_chats.create_index('member_ids')
        db.group_chats.create_index('updated_at')
        db.chat_messages.create_index('chat_id')
        db.chat_messages.create_index('group_id')
        db.chat_messages.create_index('created_at')
        db.timeline_posts.create_index('created_at')
        db.timeline_posts.create_index('created_by')
        db.timeline_posts.create_index('visibility')
        db.timeline_comments.create_index('post_id')
        db.timeline_comments.create_index('created_at')
        print("Indexes created successfully")
    except Exception as e:
        print(f"Warning: Could not create indexes: {e}")

    print("\n" + "=" * 60)
    print("Setup complete!")
    print("=" * 60)

    client.close()

if __name__ == '__main__':
    create_admin_user()
