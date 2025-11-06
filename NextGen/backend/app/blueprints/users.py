"""User management endpoints."""
from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.datastructures import FileStorage

from app.db import get_db
from app.models.user import UserHelper
from app.utils.decorators import staff_required, admin_required
from app.utils.file_handler import FileHandler
from bson import ObjectId
import os
import bcrypt

api = Namespace('users', description='User management operations')

# Request models
user_update_model = api.model('UserUpdate', {
    'name': fields.String(description='User name'),
    'email': fields.String(description='Email address'),
    'mob_no': fields.String(description='Mobile number'),
    'about_user': fields.String(description='About the user'),
})

user_create_model = api.model('UserCreate', {
    'login_id': fields.String(required=True, description='Login ID'),
    'name': fields.String(required=True, description='User name'),
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password'),
    'user_type': fields.String(required=True, description='User type (staff/admin)'),
    'mob_no': fields.String(description='Mobile number'),
})

password_change_model = api.model('PasswordChange', {
    'current_password': fields.String(required=True, description='Current password'),
    'new_password': fields.String(required=True, description='New password'),
})

upload_parser = api.parser()
upload_parser.add_argument('file', location='files', type=FileStorage, required=True)


@api.route('/profile')
class UserProfile(Resource):
    """User profile management."""

    @api.doc('get_user_profile')
    @jwt_required()
    @staff_required
    def get(self):
        """Get current user's profile."""
        claims = get_jwt()
        user_id = claims.get('user_id')
        db = get_db()

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        return {
            'success': True,
            'user': UserHelper.to_dict(user)
        }, 200

    @api.doc('update_user_profile')
    @api.expect(user_update_model)
    @jwt_required()
    @staff_required
    def put(self):
        """Update current user's profile."""
        claims = get_jwt()
        user_id = claims.get('user_id')
        db = get_db()
        data = request.get_json()

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        # Prepare update data
        update_data = {}
        allowed_fields = ['name', 'email', 'mob_no', 'about_user']

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # Check if email is being changed and if it's already taken
        if 'email' in update_data and update_data['email'] != user.get('email'):
            existing = UserHelper.find_by_email(db, update_data['email'])
            if existing:
                return {'success': False, 'message': 'Email already in use'}, 400

        if update_data:
            from datetime import datetime
            update_data['updated_at'] = datetime.utcnow()

            db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )

        # Get updated user
        updated_user = UserHelper.find_by_id(db, user_id)

        return {
            'success': True,
            'message': 'Profile updated successfully',
            'user': UserHelper.to_dict(updated_user)
        }, 200


@api.route('/profile/avatar')
class UserAvatar(Resource):
    """User avatar upload."""

    @api.doc('upload_user_avatar')
    @api.expect(upload_parser)
    @jwt_required()
    @staff_required
    def post(self):
        """Upload user avatar."""
        claims = get_jwt()
        user_id = claims.get('user_id')
        db = get_db()

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        if 'file' not in request.files:
            return {'success': False, 'message': 'No file provided'}, 400

        file = request.files['file']
        if file.filename == '':
            return {'success': False, 'message': 'No file selected'}, 400

        if not FileHandler.allowed_file(file.filename, 'image'):
            return {'success': False, 'message': 'Invalid file type. Only images allowed'}, 400

        try:
            # Read file data
            file_data = file.read()

            # Save avatar
            upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars')
            filename = FileHandler.save_avatar(file_data, upload_folder)

            # Update user record
            avatar_url = f"/uploads/avatars/{filename}"
            db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'user_img': avatar_url}}
            )

            # Delete old avatar if exists
            old_avatar = user.get('user_img')
            if old_avatar and old_avatar.startswith('/uploads/avatars/'):
                old_filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], old_avatar.replace('/uploads/', ''))
                FileHandler.delete_file(old_filepath)

            return {
                'success': True,
                'message': 'Avatar uploaded successfully',
                'avatar_url': avatar_url
            }, 200

        except Exception as e:
            return {'success': False, 'message': f'Upload failed: {str(e)}'}, 500


@api.route('/profile/password')
class UserPasswordChange(Resource):
    """User password change."""

    @api.doc('change_password')
    @api.expect(password_change_model)
    @jwt_required()
    @staff_required
    def put(self):
        """Change user password."""
        claims = get_jwt()
        user_id = claims.get('user_id')
        db = get_db()
        data = request.get_json()

        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return {'success': False, 'message': 'Current password and new password are required'}, 400

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        # Verify current password
        if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password_hash'].encode('utf-8')):
            return {'success': False, 'message': 'Current password is incorrect'}, 400

        # Hash new password
        new_password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password
        from datetime import datetime
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'password_hash': new_password_hash,
                'updated_at': datetime.utcnow()
            }}
        )

        return {
            'success': True,
            'message': 'Password changed successfully'
        }, 200


@api.route('')
@api.route('/')
class UserList(Resource):
    """User list and creation."""

    @api.doc('get_all_users')
    @jwt_required()
    @staff_required
    def get(self):
        """Get all users with optional filtering."""
        db = get_db()

        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        user_type = request.args.get('user_type', '')
        status = request.args.get('status', 'Active')

        # Build query
        query = {}
        if status:
            query['status'] = status
        if user_type:
            query['user_type'] = user_type
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'login_id': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]

        # Get total count
        total = db.users.count_documents(query)

        # Get users with pagination
        skip = (page - 1) * limit
        users = list(db.users.find(query).sort('created_at', -1).skip(skip).limit(limit))

        # Convert to dict
        users_list = [UserHelper.to_dict(u) for u in users]

        return {
            'success': True,
            'users': users_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }, 200

    @api.doc('create_user')
    @api.expect(user_create_model)
    @jwt_required()
    @admin_required
    def post(self):
        """Create a new user (Admin only)."""
        db = get_db()
        data = request.get_json()

        # Validate required fields
        required_fields = ['login_id', 'name', 'email', 'password', 'user_type']
        for field in required_fields:
            if not data.get(field):
                return {'success': False, 'message': f'{field} is required'}, 400

        # Validate user_type
        if data['user_type'] not in ['staff', 'admin']:
            return {'success': False, 'message': 'user_type must be either staff or admin'}, 400

        # Check if user already exists
        if UserHelper.find_by_login_id(db, data['login_id']):
            return {'success': False, 'message': 'Login ID already exists'}, 400

        if UserHelper.find_by_email(db, data['email']):
            return {'success': False, 'message': 'Email already exists'}, 400

        try:
            # Create user
            user = UserHelper.create_user(
                db,
                login_id=data['login_id'],
                name=data['name'],
                email=data['email'],
                password=data['password'],
                user_type=data['user_type'],
                mob_no=data.get('mob_no')
            )

            return {
                'success': True,
                'message': 'User created successfully',
                'user': UserHelper.to_dict(user)
            }, 201

        except Exception as e:
            return {'success': False, 'message': f'Failed to create user: {str(e)}'}, 500


@api.route('/<string:user_id>')
class UserDetail(Resource):
    """User detail operations."""

    @api.doc('get_user')
    @jwt_required()
    @staff_required
    def get(self, user_id):
        """Get a specific user."""
        db = get_db()
        claims = get_jwt()
        role = claims.get('role')
        current_user_id = claims.get('user_id')

        # Staff can only view their own profile, admin can view any
        if role == 'staff' and current_user_id != user_id:
            return {'success': False, 'message': 'Access denied'}, 403

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        return {
            'success': True,
            'user': UserHelper.to_dict(user)
        }, 200

    @api.doc('update_user')
    @api.expect(user_update_model)
    @jwt_required()
    @admin_required
    def put(self, user_id):
        """Update a user (Admin only)."""
        db = get_db()
        data = request.get_json()

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        # Prepare update data
        update_data = {}
        allowed_fields = ['name', 'email', 'mob_no', 'about_user', 'status', 'user_type']

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # Validate user_type if being changed
        if 'user_type' in update_data and update_data['user_type'] not in ['staff', 'admin']:
            return {'success': False, 'message': 'user_type must be either staff or admin'}, 400

        # Check email uniqueness if being changed
        if 'email' in update_data and update_data['email'] != user.get('email'):
            existing = UserHelper.find_by_email(db, update_data['email'])
            if existing:
                return {'success': False, 'message': 'Email already in use'}, 400

        if update_data:
            from datetime import datetime
            update_data['updated_at'] = datetime.utcnow()

            db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )

        # Get updated user
        updated_user = UserHelper.find_by_id(db, user_id)

        return {
            'success': True,
            'message': 'User updated successfully',
            'user': UserHelper.to_dict(updated_user)
        }, 200

    @api.doc('delete_user')
    @jwt_required()
    @admin_required
    def delete(self, user_id):
        """Delete a user (Admin only)."""
        db = get_db()

        user = UserHelper.find_by_id(db, user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404

        # Prevent deleting yourself
        claims = get_jwt()
        current_user_id = claims.get('user_id')
        if current_user_id == user_id:
            return {'success': False, 'message': 'Cannot delete your own account'}, 400

        # Delete avatar if exists
        avatar = user.get('user_img')
        if avatar and avatar.startswith('/uploads/avatars/'):
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], avatar.replace('/uploads/', ''))
            FileHandler.delete_file(filepath)

        # Delete user
        db.users.delete_one({'_id': ObjectId(user_id)})

        return {
            'success': True,
            'message': 'User deleted successfully'
        }, 200
