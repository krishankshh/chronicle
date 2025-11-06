"""Student management endpoints."""
from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.datastructures import FileStorage

from app.db import get_db
from app.models.student import StudentHelper
from app.utils.decorators import student_required, admin_required
from app.utils.file_handler import FileHandler
from bson import ObjectId
import os

api = Namespace('students', description='Student management operations')

# Request models
student_update_model = api.model('StudentUpdate', {
    'name': fields.String(description='Student name'),
    'email': fields.String(description='Email address'),
    'course': fields.String(description='Course name'),
    'semester': fields.Integer(description='Semester number'),
    'batch': fields.String(description='Batch year'),
    'mob_no': fields.String(description='Mobile number'),
    'about_student': fields.String(description='About the student'),
})

student_create_model = api.model('StudentCreate', {
    'roll_no': fields.String(required=True, description='Roll number'),
    'name': fields.String(required=True, description='Student name'),
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password'),
    'course': fields.String(required=True, description='Course name'),
    'semester': fields.Integer(required=True, description='Semester number'),
    'batch': fields.String(description='Batch year'),
    'mob_no': fields.String(description='Mobile number'),
})

upload_parser = api.parser()
upload_parser.add_argument('file', location='files', type=FileStorage, required=True)


@api.route('/profile')
class StudentProfile(Resource):
    """Student profile management."""

    @api.doc('get_student_profile')
    @jwt_required()
    @student_required
    def get(self):
        """Get current student's profile."""
        claims = get_jwt()
        student_id = claims.get('user_id')
        db = get_db()

        student = StudentHelper.find_by_id(db, student_id)
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

        return {
            'success': True,
            'student': StudentHelper.to_dict(student)
        }, 200

    @api.doc('update_student_profile')
    @api.expect(student_update_model)
    @jwt_required()
    @student_required
    def put(self):
        """Update current student's profile."""
        claims = get_jwt()
        student_id = claims.get('user_id')
        db = get_db()
        data = request.get_json()

        student = StudentHelper.find_by_id(db, student_id)
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

        # Prepare update data
        update_data = {}
        allowed_fields = ['name', 'email', 'course', 'semester', 'batch', 'mob_no', 'about_student']

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # Check if email is being changed and if it's already taken
        if 'email' in update_data and update_data['email'] != student.get('email'):
            existing = StudentHelper.find_by_email(db, update_data['email'])
            if existing:
                return {'success': False, 'message': 'Email already in use'}, 400

        if update_data:
            from datetime import datetime
            update_data['updated_at'] = datetime.utcnow()

            db.students.update_one(
                {'_id': ObjectId(student_id)},
                {'$set': update_data}
            )

        # Get updated student
        updated_student = StudentHelper.find_by_id(db, student_id)

        return {
            'success': True,
            'message': 'Profile updated successfully',
            'student': StudentHelper.to_dict(updated_student)
        }, 200


@api.route('/profile/avatar')
class StudentAvatar(Resource):
    """Student avatar upload."""

    @api.doc('upload_avatar')
    @api.expect(upload_parser)
    @jwt_required()
    @student_required
    def post(self):
        """Upload student avatar."""
        claims = get_jwt()
        student_id = claims.get('user_id')
        db = get_db()

        student = StudentHelper.find_by_id(db, student_id)
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

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

            # Update student record
            avatar_url = f"/uploads/avatars/{filename}"
            db.students.update_one(
                {'_id': ObjectId(student_id)},
                {'$set': {'student_img': avatar_url}}
            )

            # Delete old avatar if exists
            old_avatar = student.get('student_img')
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


@api.route('/')
class StudentList(Resource):
    """Student list and creation (Admin only)."""

    @api.doc('get_all_students')
    @jwt_required()
    def get(self):
        """Get all students with optional filtering."""
        db = get_db()

        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        course = request.args.get('course', '')
        semester = request.args.get('semester', '')
        status = request.args.get('status', 'Active')

        # Build query
        query = {}
        if status:
            query['status'] = status
        if course:
            query['course'] = course
        if semester:
            query['semester'] = int(semester)
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'roll_no': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]

        # Get total count
        total = db.students.count_documents(query)

        # Get students with pagination
        skip = (page - 1) * limit
        students = list(db.students.find(query).sort('created_at', -1).skip(skip).limit(limit))

        # Convert to dict
        students_list = [StudentHelper.to_dict(s) for s in students]

        return {
            'success': True,
            'students': students_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }, 200

    @api.doc('create_student')
    @api.expect(student_create_model)
    @jwt_required()
    @admin_required
    def post(self):
        """Create a new student (Admin only)."""
        db = get_db()
        data = request.get_json()

        # Validate required fields
        required_fields = ['roll_no', 'name', 'email', 'password', 'course', 'semester']
        for field in required_fields:
            if not data.get(field):
                return {'success': False, 'message': f'{field} is required'}, 400

        # Check if student already exists
        if StudentHelper.find_by_roll_no(db, data['roll_no']):
            return {'success': False, 'message': 'Roll number already exists'}, 400

        if StudentHelper.find_by_email(db, data['email']):
            return {'success': False, 'message': 'Email already exists'}, 400

        try:
            # Create student
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

            return {
                'success': True,
                'message': 'Student created successfully',
                'student': StudentHelper.to_dict(student)
            }, 201

        except Exception as e:
            return {'success': False, 'message': f'Failed to create student: {str(e)}'}, 500


@api.route('/<string:student_id>')
class StudentDetail(Resource):
    """Student detail operations."""

    @api.doc('get_student')
    @jwt_required()
    def get(self, student_id):
        """Get a specific student."""
        db = get_db()
        claims = get_jwt()
        role = claims.get('role')
        current_user_id = claims.get('user_id')

        # Students can only view their own profile, staff/admin can view any
        if role == 'student' and current_user_id != student_id:
            return {'success': False, 'message': 'Access denied'}, 403

        student = StudentHelper.find_by_id(db, student_id)
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

        return {
            'success': True,
            'student': StudentHelper.to_dict(student)
        }, 200

    @api.doc('update_student')
    @api.expect(student_update_model)
    @jwt_required()
    @admin_required
    def put(self, student_id):
        """Update a student (Admin only)."""
        db = get_db()
        data = request.get_json()

        student = StudentHelper.find_by_id(db, student_id)
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

        # Prepare update data
        update_data = {}
        allowed_fields = ['name', 'email', 'course', 'semester', 'batch', 'mob_no', 'about_student', 'status']

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        # Check email uniqueness if being changed
        if 'email' in update_data and update_data['email'] != student.get('email'):
            existing = StudentHelper.find_by_email(db, update_data['email'])
            if existing:
                return {'success': False, 'message': 'Email already in use'}, 400

        if update_data:
            from datetime import datetime
            update_data['updated_at'] = datetime.utcnow()

            db.students.update_one(
                {'_id': ObjectId(student_id)},
                {'$set': update_data}
            )

        # Get updated student
        updated_student = StudentHelper.find_by_id(db, student_id)

        return {
            'success': True,
            'message': 'Student updated successfully',
            'student': StudentHelper.to_dict(updated_student)
        }, 200

    @api.doc('delete_student')
    @jwt_required()
    @admin_required
    def delete(self, student_id):
        """Delete a student (Admin only)."""
        db = get_db()

        student = StudentHelper.find_by_id(db, student_id)
        if not student:
            return {'success': False, 'message': 'Student not found'}, 404

        # Delete avatar if exists
        avatar = student.get('student_img')
        if avatar and avatar.startswith('/uploads/avatars/'):
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], avatar.replace('/uploads/', ''))
            FileHandler.delete_file(filepath)

        # Delete student
        db.students.delete_one({'_id': ObjectId(student_id)})

        return {
            'success': True,
            'message': 'Student deleted successfully'
        }, 200
