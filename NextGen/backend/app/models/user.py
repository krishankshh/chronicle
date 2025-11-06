"""User model helper for MongoDB."""
from datetime import datetime
import bcrypt
from bson import ObjectId


class UserHelper:
    """Helper methods for User collection."""

    @staticmethod
    def create_user(db, login_id, name, email, password, user_type):
        """Create a new user."""
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        user_data = {
            'login_id': login_id,
            'name': name,
            'email': email,
            'password_hash': password_hash,
            'user_type': user_type,  # 'Staff' or 'Admin'
            'user_img': None,
            'status': 'Active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.users.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return user_data

    @staticmethod
    def find_by_login_id(db, login_id):
        """Find user by login_id."""
        return db.users.find_one({'login_id': login_id})

    @staticmethod
    def find_by_email(db, email):
        """Find user by email."""
        return db.users.find_one({'email': email})

    @staticmethod
    def find_by_id(db, user_id):
        """Find user by ID."""
        return db.users.find_one({'_id': ObjectId(user_id)})

    @staticmethod
    def check_password(user, password):
        """Check if password matches."""
        if not user or 'password_hash' not in user:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8'))

    @staticmethod
    def to_dict(user):
        """Convert user document to dictionary."""
        if not user:
            return None

        return {
            'id': str(user['_id']),
            'login_id': user.get('login_id'),
            'name': user.get('name'),
            'email': user.get('email'),
            'user_type': user.get('user_type'),
            'user_img': user.get('user_img'),
            'status': user.get('status'),
            'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
            'updated_at': user.get('updated_at').isoformat() if user.get('updated_at') else None
        }
