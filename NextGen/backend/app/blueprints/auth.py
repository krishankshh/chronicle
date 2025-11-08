"""Authentication endpoints."""
import secrets
from datetime import datetime, timedelta
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt

from app.db import get_db
from app.models.student import StudentHelper
from app.models.user import UserHelper
from app.utils.email import send_welcome_email, send_password_reset_email

api = Namespace('auth', description='Authentication operations')

# Request models
student_register_model = api.model('StudentRegister', {
    'roll_no': fields.String(required=True, description='Student roll number'),
    'name': fields.String(required=True, description='Student name'),
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password'),
    'course': fields.String(required=True, description='Course name'),
    'semester': fields.Integer(required=True, description='Semester number'),
    'batch': fields.String(description='Batch year'),
    'mob_no': fields.String(description='Mobile number'),
})

student_login_model = api.model('StudentLogin', {
    'roll_no': fields.String(required=True, description='Student roll number'),
    'password': fields.String(required=True, description='Password'),
})

staff_login_model = api.model('StaffLogin', {
    'login_id': fields.String(required=True, description='Staff login ID'),
    'password': fields.String(required=True, description='Password'),
})

forgot_password_model = api.model('ForgotPassword', {
    'email': fields.String(required=True, description='Email address'),
    'user_type': fields.String(required=False, description='User type: student or staff', enum=['student', 'staff']),
})

reset_password_model = api.model('ResetPassword', {
    'token': fields.String(required=True, description='Password reset token'),
    'new_password': fields.String(required=True, description='New password'),
})


@api.route('/student/register')
class StudentRegister(Resource):
    """Student registration endpoint."""

    @api.doc('register_student')
    @api.expect(student_register_model)
    def post(self):
        """Register a new student."""
        data = request.get_json()
        db = get_db()

        # Validate required fields
        required_fields = ['roll_no', 'name', 'email', 'password', 'course', 'semester']
        for field in required_fields:
            if not data.get(field):
                return {'success': False, 'message': f'{field} is required'}, 400

        # Check if student already exists
        if StudentHelper.find_by_roll_no(db, data['roll_no']):
            return {'success': False, 'message': 'Roll number already registered'}, 400

        if StudentHelper.find_by_email(db, data['email']):
            return {'success': False, 'message': 'Email already registered'}, 400

        # Create new student
        try:
            student = StudentHelper.create_student(
                db,
                roll_no=data['roll_no'],
                name=data['name'],
                email=data['email'],
                password=data['password'],
                course=data['course'],
                semester=data['semester'],
                batch=data.get('batch'),
                mob_no=data.get('mob_no')
            )

            send_welcome_email(data['email'], data['name'])

            return {
                'success': True,
                'message': 'Registration successful',
                'student': StudentHelper.to_dict(student)
            }, 201
        except Exception as e:
            return {'success': False, 'message': f'Registration failed: {str(e)}'}, 500


@api.route('/student/login')
class StudentLogin(Resource):
    """Student login endpoint."""

    @api.doc('login_student')
    @api.expect(student_login_model)
    def post(self):
        """Login a student."""
        data = request.get_json()
        db = get_db()

        if not data.get('roll_no') or not data.get('password'):
            return {'success': False, 'message': 'Roll number and password are required'}, 400

        student = StudentHelper.find_by_roll_no(db, data['roll_no'])

        if not student or not StudentHelper.check_password(student, data['password']):
            return {'success': False, 'message': 'Invalid roll number or password'}, 401

        if student.get('status') != 'Active':
            return {'success': False, 'message': 'Account is inactive'}, 403

        # Create tokens with additional claims
        student_id = str(student['_id'])
        additional_claims = {
            'role': 'student',
            'user_id': student_id,
            'roll_no': student['roll_no']
        }
        access_token = create_access_token(identity=student_id, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=student_id, additional_claims=additional_claims)

        return {
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': StudentHelper.to_dict(student)
        }, 200


@api.route('/staff/login')
class StaffLogin(Resource):
    """Staff/Admin login endpoint."""

    @api.doc('login_staff')
    @api.expect(staff_login_model)
    def post(self):
        """Login a staff or admin user."""
        data = request.get_json()
        db = get_db()

        if not data.get('login_id') or not data.get('password'):
            return {'success': False, 'message': 'Login ID and password are required'}, 400

        user = UserHelper.find_by_login_id(db, data['login_id'])

        if not user or not UserHelper.check_password(user, data['password']):
            return {'success': False, 'message': 'Invalid login ID or password'}, 401

        if user.get('status') != 'Active':
            return {'success': False, 'message': 'Account is inactive'}, 403

        # Create tokens with additional claims
        user_id = str(user['_id'])
        role = 'admin' if user.get('user_type') == 'Admin' else 'staff'
        additional_claims = {
            'role': role,
            'user_id': user_id,
            'login_id': user['login_id'],
            'user_type': user.get('user_type')
        }
        access_token = create_access_token(identity=user_id, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user_id, additional_claims=additional_claims)

        return {
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserHelper.to_dict(user)
        }, 200


@api.route('/refresh')
class TokenRefresh(Resource):
    """Token refresh endpoint."""

    @api.doc('refresh_token')
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token."""
        identity = get_jwt_identity()
        claims = get_jwt()

        # Recreate claims for new access token
        additional_claims = {
            'role': claims.get('role'),
            'user_id': claims.get('user_id')
        }

        if claims.get('role') == 'student':
            additional_claims['roll_no'] = claims.get('roll_no')
        else:
            additional_claims['login_id'] = claims.get('login_id')
            additional_claims['user_type'] = claims.get('user_type')

        access_token = create_access_token(identity=identity, additional_claims=additional_claims)

        return {
            'success': True,
            'access_token': access_token
        }, 200


@api.route('/logout')
class Logout(Resource):
    """Logout endpoint."""

    @api.doc('logout')
    @jwt_required()
    def post(self):
        """Logout user (client-side token removal)."""
        return {
            'success': True,
            'message': 'Logged out successfully'
        }, 200


@api.route('/me')
class CurrentUser(Resource):
    """Get current user endpoint."""

    @api.doc('get_current_user')
    @jwt_required()
    def get(self):
        """Get current authenticated user."""
        claims = get_jwt()
        role = claims.get('role')
        user_id = claims.get('user_id')
        db = get_db()

        if role == 'student':
            student = StudentHelper.find_by_id(db, user_id)
            if not student:
                return {'success': False, 'message': 'Student not found'}, 404
            return {
                'success': True,
                'user': StudentHelper.to_dict(student),
                'role': 'student'
            }, 200
        else:
            user = UserHelper.find_by_id(db, user_id)
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            return {
                'success': True,
                'user': UserHelper.to_dict(user),
                'role': role
            }, 200


@api.route('/forgot-password')
class ForgotPassword(Resource):
    """Forgot password endpoint."""

    @api.doc('forgot_password')
    @api.expect(forgot_password_model)
    def post(self):
        """Request password reset token via email."""
        data = request.get_json()
        db = get_db()

        if not data.get('email'):
            return {'success': False, 'message': 'Email is required'}, 400

        email = data['email']
        user_type = data.get('user_type', 'student')  # Default to student

        # Find user by email
        account = None
        name = None
        if user_type == 'student':
            account = StudentHelper.find_by_email(db, email)
            name = account.get('name') if account else None
        else:
            # For staff, find by email
            account = db.users.find_one({'email': email, 'status': 'Active'})
            name = account.get('name') if account else None

        # Always return success to prevent email enumeration
        if not account:
            return {
                'success': True,
                'message': 'If your email is registered, you will receive password reset instructions'
            }, 200

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour

        # Store reset token
        db.password_reset_tokens.insert_one({
            'email': email,
            'token': reset_token,
            'user_type': user_type,
            'expires_at': expires_at,
            'used': False,
            'created_at': datetime.utcnow()
        })

        # Send reset email
        send_password_reset_email(email, name, reset_token)

        return {
            'success': True,
            'message': 'If your email is registered, you will receive password reset instructions'
        }, 200


@api.route('/reset-password')
class ResetPassword(Resource):
    """Reset password endpoint."""

    @api.doc('reset_password')
    @api.expect(reset_password_model)
    def post(self):
        """Reset password using token."""
        data = request.get_json()
        db = get_db()

        if not data.get('token') or not data.get('new_password'):
            return {'success': False, 'message': 'Token and new password are required'}, 400

        token = data['token']
        new_password = data['new_password']

        # Validate password length
        if len(new_password) < 8:
            return {'success': False, 'message': 'Password must be at least 8 characters long'}, 400

        # Find token
        token_doc = db.password_reset_tokens.find_one({
            'token': token,
            'used': False,
            'expires_at': {'$gt': datetime.utcnow()}
        })

        if not token_doc:
            return {'success': False, 'message': 'Invalid or expired reset token'}, 400

        email = token_doc['email']
        user_type = token_doc['user_type']

        # Update password
        try:
            if user_type == 'student':
                student = StudentHelper.find_by_email(db, email)
                if not student:
                    return {'success': False, 'message': 'Account not found'}, 404
                StudentHelper.update_password(db, str(student['_id']), new_password)
            else:
                user = db.users.find_one({'email': email, 'status': 'Active'})
                if not user:
                    return {'success': False, 'message': 'Account not found'}, 404
                UserHelper.update_password(db, str(user['_id']), new_password)

            # Mark token as used
            db.password_reset_tokens.update_one(
                {'_id': token_doc['_id']},
                {'$set': {'used': True, 'used_at': datetime.utcnow()}}
            )

            return {
                'success': True,
                'message': 'Password reset successfully'
            }, 200
        except Exception as e:
            return {'success': False, 'message': f'Password reset failed: {str(e)}'}, 500
