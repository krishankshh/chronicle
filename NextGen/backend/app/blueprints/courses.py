"""Course management endpoints."""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from bson import ObjectId

from app.db import get_db
from app.models.course import CourseHelper
from app.utils.decorators import staff_required, admin_required

api = Namespace('courses', description='Course management operations')

# Request/Response models
course_create_model = api.model('CourseCreate', {
    'course_name': fields.String(required=True, description='Course name'),
    'course_code': fields.String(required=True, description='Course code (e.g., CS, IT, ME)'),
    'department': fields.String(required=True, description='Department name'),
    'duration_years': fields.Integer(required=True, description='Course duration in years'),
    'total_semesters': fields.Integer(required=True, description='Total number of semesters'),
    'description': fields.String(description='Course description'),
})

course_update_model = api.model('CourseUpdate', {
    'course_name': fields.String(description='Course name'),
    'course_code': fields.String(description='Course code'),
    'department': fields.String(description='Department name'),
    'duration_years': fields.Integer(description='Course duration in years'),
    'total_semesters': fields.Integer(description='Total number of semesters'),
    'description': fields.String(description='Course description'),
    'status': fields.String(description='Course status (Active/Inactive)'),
})


@api.route('/')
class CourseList(Resource):
    """Course list and creation."""

    @api.doc('get_all_courses')
    @jwt_required()
    def get(self):
        """Get all courses with optional filtering."""
        db = get_db()

        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        status = request.args.get('status', 'Active')
        department = request.args.get('department', '')

        # Build query
        query = {}
        if status:
            query['status'] = status
        if department:
            query['department'] = department
        if search:
            query['$or'] = [
                {'course_name': {'$regex': search, '$options': 'i'}},
                {'course_code': {'$regex': search, '$options': 'i'}},
                {'department': {'$regex': search, '$options': 'i'}}
            ]

        # Get total count
        total = db.courses.count_documents(query)

        # Get courses with pagination
        skip = (page - 1) * limit
        courses = list(db.courses.find(query).sort('course_name', 1).skip(skip).limit(limit))

        # Convert to dict
        courses_list = [CourseHelper.to_dict(c) for c in courses]

        return {
            'success': True,
            'courses': courses_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }, 200

    @api.doc('create_course')
    @api.expect(course_create_model)
    @jwt_required()
    @staff_required
    def post(self):
        """Create a new course (Staff/Admin only)."""
        db = get_db()
        data = request.get_json()
        claims = get_jwt()
        created_by = claims.get('user_id')

        # Validate required fields
        required_fields = ['course_name', 'course_code', 'department', 'duration_years', 'total_semesters']
        for field in required_fields:
            if not data.get(field):
                return {'success': False, 'message': f'{field} is required'}, 400

        # Check if course code already exists
        if CourseHelper.find_by_code(db, data['course_code']):
            return {'success': False, 'message': 'Course code already exists'}, 400

        # Check if course name already exists
        if CourseHelper.find_by_name(db, data['course_name']):
            return {'success': False, 'message': 'Course name already exists'}, 400

        try:
            # Create course
            course = CourseHelper.create_course(
                db,
                course_name=data['course_name'],
                course_code=data['course_code'],
                department=data['department'],
                duration_years=data['duration_years'],
                total_semesters=data['total_semesters'],
                description=data.get('description'),
                created_by=created_by
            )

            return {
                'success': True,
                'message': 'Course created successfully',
                'course': CourseHelper.to_dict(course)
            }, 201

        except Exception as e:
            return {'success': False, 'message': f'Failed to create course: {str(e)}'}, 500


@api.route('/<string:course_id>')
class CourseDetail(Resource):
    """Course detail operations."""

    @api.doc('get_course')
    @jwt_required()
    def get(self, course_id):
        """Get a specific course."""
        db = get_db()

        course = CourseHelper.find_by_id(db, course_id)
        if not course:
            return {'success': False, 'message': 'Course not found'}, 404

        return {
            'success': True,
            'course': CourseHelper.to_dict(course)
        }, 200

    @api.doc('update_course')
    @api.expect(course_update_model)
    @jwt_required()
    @staff_required
    def put(self, course_id):
        """Update a course (Staff/Admin only)."""
        db = get_db()
        data = request.get_json()

        course = CourseHelper.find_by_id(db, course_id)
        if not course:
            return {'success': False, 'message': 'Course not found'}, 404

        # Prepare update data
        update_data = {}
        allowed_fields = ['course_name', 'course_code', 'department', 'duration_years', 'total_semesters', 'description', 'status']

        for field in allowed_fields:
            if field in data:
                # Handle course_code uppercase
                if field == 'course_code':
                    update_data[field] = data[field].upper()
                else:
                    update_data[field] = data[field]

        # Check if course_code is being changed and if it's already taken
        if 'course_code' in update_data and update_data['course_code'] != course.get('course_code'):
            existing = CourseHelper.find_by_code(db, update_data['course_code'])
            if existing:
                return {'success': False, 'message': 'Course code already in use'}, 400

        # Check if course_name is being changed and if it's already taken
        if 'course_name' in update_data and update_data['course_name'] != course.get('course_name'):
            existing = CourseHelper.find_by_name(db, update_data['course_name'])
            if existing:
                return {'success': False, 'message': 'Course name already in use'}, 400

        if update_data:
            from datetime import datetime
            update_data['updated_at'] = datetime.utcnow()

            db.courses.update_one(
                {'_id': ObjectId(course_id)},
                {'$set': update_data}
            )

        # Get updated course
        updated_course = CourseHelper.find_by_id(db, course_id)

        return {
            'success': True,
            'message': 'Course updated successfully',
            'course': CourseHelper.to_dict(updated_course)
        }, 200

    @api.doc('delete_course')
    @jwt_required()
    @admin_required
    def delete(self, course_id):
        """Delete a course (Admin only)."""
        db = get_db()

        course = CourseHelper.find_by_id(db, course_id)
        if not course:
            return {'success': False, 'message': 'Course not found'}, 404

        # Check if there are subjects associated with this course
        subject_count = db.subjects.count_documents({'course_id': ObjectId(course_id)})
        if subject_count > 0:
            return {
                'success': False,
                'message': f'Cannot delete course. {subject_count} subject(s) are associated with this course. Please delete or reassign subjects first.'
            }, 400

        # Check if there are students enrolled in this course
        student_count = db.students.count_documents({'course': course.get('course_name')})
        if student_count > 0:
            return {
                'success': False,
                'message': f'Cannot delete course. {student_count} student(s) are enrolled in this course.'
            }, 400

        # Delete course
        db.courses.delete_one({'_id': ObjectId(course_id)})

        return {
            'success': True,
            'message': 'Course deleted successfully'
        }, 200


@api.route('/<string:course_id>/subjects')
class CourseSubjects(Resource):
    """Get subjects for a specific course."""

    @api.doc('get_course_subjects')
    @jwt_required()
    def get(self, course_id):
        """Get all subjects for a specific course."""
        db = get_db()

        course = CourseHelper.find_by_id(db, course_id)
        if not course:
            return {'success': False, 'message': 'Course not found'}, 404

        # Get semester filter if provided
        semester = request.args.get('semester', type=int)

        # Get subjects
        from app.models.subject import SubjectHelper
        subjects = SubjectHelper.find_by_course(db, course_id, semester)
        subjects_list = [SubjectHelper.to_dict(s) for s in subjects]

        return {
            'success': True,
            'course': {
                '_id': str(course['_id']),
                'course_name': course.get('course_name'),
                'course_code': course.get('course_code')
            },
            'subjects': subjects_list,
            'total': len(subjects_list)
        }, 200
