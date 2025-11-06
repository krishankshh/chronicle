"""Course model and helper functions."""
from datetime import datetime
from bson import ObjectId


class CourseHelper:
    """Helper class for Course operations."""

    @staticmethod
    def create_course(db, course_name, course_code, department, duration_years, total_semesters, description=None, created_by=None):
        """Create a new course."""
        course_data = {
            'course_name': course_name,
            'course_code': course_code.upper(),
            'department': department,
            'duration_years': duration_years,
            'total_semesters': total_semesters,
            'description': description or '',
            'status': 'Active',
            'created_by': created_by,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.courses.insert_one(course_data)
        course_data['_id'] = result.inserted_id
        return course_data

    @staticmethod
    def find_by_id(db, course_id):
        """Find course by ID."""
        try:
            return db.courses.find_one({'_id': ObjectId(course_id)})
        except Exception:
            return None

    @staticmethod
    def find_by_code(db, course_code):
        """Find course by course code."""
        return db.courses.find_one({'course_code': course_code.upper()})

    @staticmethod
    def find_by_name(db, course_name):
        """Find course by name."""
        return db.courses.find_one({'course_name': course_name})

    @staticmethod
    def to_dict(course):
        """Convert course document to dictionary."""
        if not course:
            return None

        return {
            '_id': str(course['_id']),
            'course_name': course.get('course_name'),
            'course_code': course.get('course_code'),
            'department': course.get('department'),
            'duration_years': course.get('duration_years'),
            'total_semesters': course.get('total_semesters'),
            'description': course.get('description'),
            'status': course.get('status'),
            'created_by': course.get('created_by'),
            'created_at': course.get('created_at').isoformat() if course.get('created_at') else None,
            'updated_at': course.get('updated_at').isoformat() if course.get('updated_at') else None,
        }
