"""Subject management endpoints."""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from bson import ObjectId

from app.db import get_db
from app.models.subject import SubjectHelper
from app.models.course import CourseHelper
from app.utils.decorators import staff_required, admin_required

api = Namespace('subjects', description='Subject management operations')

# Request/Response models
subject_create_model = api.model('SubjectCreate', {
    'subject_name': fields.String(required=True, description='Subject name'),
    'subject_code': fields.String(required=True, description='Subject code'),
    'course_id': fields.String(required=True, description='Course ID'),
    'semester': fields.Integer(required=True, description='Semester number'),
    'subject_type': fields.String(required=True, description='Type: Theory, Practical, Lab, Project'),
    'credits': fields.Integer(required=True, description='Number of credits'),
    'description': fields.String(description='Subject description'),
})

subject_update_model = api.model('SubjectUpdate', {
    'subject_name': fields.String(description='Subject name'),
    'subject_code': fields.String(description='Subject code'),
    'course_id': fields.String(description='Course ID'),
    'semester': fields.Integer(description='Semester number'),
    'subject_type': fields.String(description='Type: Theory, Practical, Lab, Project'),
    'credits': fields.Integer(description='Number of credits'),
    'description': fields.String(description='Subject description'),
    'status': fields.String(description='Subject status (Active/Inactive)'),
})


@api.route('')
@api.route('/')
class SubjectList(Resource):
    """Subject list and creation."""

    @api.doc('get_all_subjects')
    @jwt_required()
    def get(self):
        """Get all subjects with optional filtering."""
        db = get_db()

        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        course_id = request.args.get('course_id', '')
        semester = request.args.get('semester', type=int)
        subject_type = request.args.get('subject_type', '')
        status = request.args.get('status', 'Active')
        include_course = request.args.get('include_course', 'false').lower() == 'true'

        # Build query
        query = {}
        if status:
            query['status'] = status
        if course_id:
            query['course_id'] = ObjectId(course_id)
        if semester:
            query['semester'] = semester
        if subject_type:
            query['subject_type'] = subject_type
        if search:
            query['$or'] = [
                {'subject_name': {'$regex': search, '$options': 'i'}},
                {'subject_code': {'$regex': search, '$options': 'i'}}
            ]

        # Get total count
        total = db.subjects.count_documents(query)

        # Get subjects with pagination
        skip = (page - 1) * limit
        subjects = list(db.subjects.find(query).sort([('course_id', 1), ('semester', 1), ('subject_name', 1)]).skip(skip).limit(limit))

        # Convert to dict
        subjects_list = [SubjectHelper.to_dict(s, include_course=include_course, db=db) for s in subjects]

        return {
            'success': True,
            'subjects': subjects_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }, 200

    @api.doc('create_subject')
    @api.expect(subject_create_model)
    @jwt_required()
    @staff_required
    def post(self):
        """Create a new subject (Staff/Admin only)."""
        db = get_db()
        data = request.get_json()
        claims = get_jwt()
        created_by = claims.get('user_id')

        # Validate required fields
        required_fields = ['subject_name', 'subject_code', 'course_id', 'semester', 'subject_type', 'credits']
        for field in required_fields:
            if field not in data or data.get(field) is None:
                return {'success': False, 'message': f'{field} is required'}, 400

        # Validate subject type
        valid_types = ['Theory', 'Practical', 'Lab', 'Project']
        if data['subject_type'] not in valid_types:
            return {'success': False, 'message': f'subject_type must be one of: {", ".join(valid_types)}'}, 400

        # Check if course exists
        course = CourseHelper.find_by_id(db, data['course_id'])
        if not course:
            return {'success': False, 'message': 'Course not found'}, 404

        # Validate semester range
        if data['semester'] < 1 or data['semester'] > course.get('total_semesters'):
            return {'success': False, 'message': f'Semester must be between 1 and {course.get("total_semesters")}'}, 400

        # Check if subject code already exists for this course
        existing = db.subjects.find_one({
            'subject_code': data['subject_code'].upper(),
            'course_id': ObjectId(data['course_id'])
        })
        if existing:
            return {'success': False, 'message': 'Subject code already exists for this course'}, 400

        try:
            # Create subject
            subject = SubjectHelper.create_subject(
                db,
                subject_name=data['subject_name'],
                subject_code=data['subject_code'],
                course_id=data['course_id'],
                semester=data['semester'],
                subject_type=data['subject_type'],
                credits=data['credits'],
                description=data.get('description'),
                created_by=created_by
            )

            return {
                'success': True,
                'message': 'Subject created successfully',
                'subject': SubjectHelper.to_dict(subject, include_course=True, db=db)
            }, 201

        except Exception as e:
            return {'success': False, 'message': f'Failed to create subject: {str(e)}'}, 500


@api.route('/<string:subject_id>')
class SubjectDetail(Resource):
    """Subject detail operations."""

    @api.doc('get_subject')
    @jwt_required()
    def get(self, subject_id):
        """Get a specific subject."""
        db = get_db()
        include_course = request.args.get('include_course', 'true').lower() == 'true'

        subject = SubjectHelper.find_by_id(db, subject_id)
        if not subject:
            return {'success': False, 'message': 'Subject not found'}, 404

        return {
            'success': True,
            'subject': SubjectHelper.to_dict(subject, include_course=include_course, db=db)
        }, 200

    @api.doc('update_subject')
    @api.expect(subject_update_model)
    @jwt_required()
    @staff_required
    def put(self, subject_id):
        """Update a subject (Staff/Admin only)."""
        db = get_db()
        data = request.get_json()

        subject = SubjectHelper.find_by_id(db, subject_id)
        if not subject:
            return {'success': False, 'message': 'Subject not found'}, 404

        # Prepare update data
        update_data = {}
        allowed_fields = ['subject_name', 'subject_code', 'course_id', 'semester', 'subject_type', 'credits', 'description', 'status']

        for field in allowed_fields:
            if field in data:
                # Handle subject_code uppercase
                if field == 'subject_code':
                    update_data[field] = data[field].upper()
                # Handle course_id ObjectId conversion
                elif field == 'course_id':
                    update_data[field] = ObjectId(data[field])
                else:
                    update_data[field] = data[field]

        # Validate subject_type if being changed
        if 'subject_type' in update_data:
            valid_types = ['Theory', 'Practical', 'Lab', 'Project']
            if update_data['subject_type'] not in valid_types:
                return {'success': False, 'message': f'subject_type must be one of: {", ".join(valid_types)}'}, 400

        # If course is being changed, validate it exists
        if 'course_id' in update_data:
            course = CourseHelper.find_by_id(db, update_data['course_id'])
            if not course:
                return {'success': False, 'message': 'Course not found'}, 404

            # If semester is also being updated, validate range
            semester_to_check = update_data.get('semester', subject.get('semester'))
            if semester_to_check < 1 or semester_to_check > course.get('total_semesters'):
                return {'success': False, 'message': f'Semester must be between 1 and {course.get("total_semesters")}'}, 400

        # Check if subject_code is being changed and if it's already taken
        if 'subject_code' in update_data and 'course_id' in update_data:
            existing = db.subjects.find_one({
                'subject_code': update_data['subject_code'],
                'course_id': update_data['course_id'],
                '_id': {'$ne': ObjectId(subject_id)}
            })
            if existing:
                return {'success': False, 'message': 'Subject code already in use for this course'}, 400

        if update_data:
            from datetime import datetime
            update_data['updated_at'] = datetime.utcnow()

            db.subjects.update_one(
                {'_id': ObjectId(subject_id)},
                {'$set': update_data}
            )

        # Get updated subject
        updated_subject = SubjectHelper.find_by_id(db, subject_id)

        return {
            'success': True,
            'message': 'Subject updated successfully',
            'subject': SubjectHelper.to_dict(updated_subject, include_course=True, db=db)
        }, 200

    @api.doc('delete_subject')
    @jwt_required()
    @admin_required
    def delete(self, subject_id):
        """Delete a subject (Admin only)."""
        db = get_db()

        subject = SubjectHelper.find_by_id(db, subject_id)
        if not subject:
            return {'success': False, 'message': 'Subject not found'}, 404

        # TODO: Check if subject is used in materials, quizzes, etc. before deleting
        # For now, allow deletion

        # Delete subject
        db.subjects.delete_one({'_id': ObjectId(subject_id)})

        return {
            'success': True,
            'message': 'Subject deleted successfully'
        }, 200


@api.route('/by-semester/<int:semester>')
class SubjectBySemester(Resource):
    """Get subjects by semester across all courses."""

    @api.doc('get_subjects_by_semester')
    @jwt_required()
    def get(self, semester):
        """Get all subjects for a specific semester across all courses."""
        db = get_db()
        include_course = request.args.get('include_course', 'true').lower() == 'true'

        subjects = SubjectHelper.find_by_semester(db, semester)
        subjects_list = [SubjectHelper.to_dict(s, include_course=include_course, db=db) for s in subjects]

        return {
            'success': True,
            'semester': semester,
            'subjects': subjects_list,
            'total': len(subjects_list)
        }, 200
