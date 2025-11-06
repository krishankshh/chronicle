"""Subject model and helper functions."""
from datetime import datetime
from bson import ObjectId


class SubjectHelper:
    """Helper class for Subject operations."""

    @staticmethod
    def create_subject(db, subject_name, subject_code, course_id, semester, subject_type, credits, description=None, created_by=None):
        """Create a new subject."""
        subject_data = {
            'subject_name': subject_name,
            'subject_code': subject_code.upper(),
            'course_id': ObjectId(course_id) if isinstance(course_id, str) else course_id,
            'semester': semester,
            'subject_type': subject_type,  # Theory, Practical, Lab, Project
            'credits': credits,
            'description': description or '',
            'status': 'Active',
            'created_by': created_by,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.subjects.insert_one(subject_data)
        subject_data['_id'] = result.inserted_id
        return subject_data

    @staticmethod
    def find_by_id(db, subject_id):
        """Find subject by ID."""
        try:
            return db.subjects.find_one({'_id': ObjectId(subject_id)})
        except Exception:
            return None

    @staticmethod
    def find_by_code(db, subject_code):
        """Find subject by subject code."""
        return db.subjects.find_one({'subject_code': subject_code.upper()})

    @staticmethod
    def find_by_course(db, course_id, semester=None):
        """Find subjects by course and optionally by semester."""
        query = {'course_id': ObjectId(course_id) if isinstance(course_id, str) else course_id}
        if semester:
            query['semester'] = semester
        return list(db.subjects.find(query).sort('semester', 1))

    @staticmethod
    def find_by_semester(db, semester):
        """Find all subjects for a specific semester across all courses."""
        return list(db.subjects.find({'semester': semester}))

    @staticmethod
    def to_dict(subject, include_course=False, db=None):
        """Convert subject document to dictionary."""
        if not subject:
            return None

        result = {
            '_id': str(subject['_id']),
            'subject_name': subject.get('subject_name'),
            'subject_code': subject.get('subject_code'),
            'course_id': str(subject.get('course_id')),
            'semester': subject.get('semester'),
            'subject_type': subject.get('subject_type'),
            'credits': subject.get('credits'),
            'description': subject.get('description'),
            'status': subject.get('status'),
            'created_by': subject.get('created_by'),
            'created_at': subject.get('created_at').isoformat() if subject.get('created_at') else None,
            'updated_at': subject.get('updated_at').isoformat() if subject.get('updated_at') else None,
        }

        # Optionally include course details
        if include_course and db:
            from app.models.course import CourseHelper
            course = CourseHelper.find_by_id(db, subject.get('course_id'))
            if course:
                result['course'] = {
                    '_id': str(course['_id']),
                    'course_name': course.get('course_name'),
                    'course_code': course.get('course_code')
                }

        return result
