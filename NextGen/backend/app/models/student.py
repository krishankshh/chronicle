"""Student model helper for MongoDB."""
from datetime import datetime
import bcrypt
from bson import ObjectId


class StudentHelper:
    """Helper methods for Student collection."""

    @staticmethod
    def create_student(db, roll_no, name, email, password, course, semester, batch=None, mob_no=None):
        """Create a new student."""
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        student_data = {
            'roll_no': roll_no,
            'name': name,
            'email': email,
            'password_hash': password_hash,
            'course': course,
            'semester': semester,
            'batch': batch,
            'student_img': None,
            'about_student': None,
            'mob_no': mob_no,
            'status': 'Active',
            'email_verified': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.students.insert_one(student_data)
        student_data['_id'] = result.inserted_id
        return student_data

    @staticmethod
    def find_by_roll_no(db, roll_no):
        """Find student by roll number."""
        return db.students.find_one({'roll_no': roll_no})

    @staticmethod
    def find_by_email(db, email):
        """Find student by email."""
        return db.students.find_one({'email': email})

    @staticmethod
    def find_by_id(db, student_id):
        """Find student by ID."""
        return db.students.find_one({'_id': ObjectId(student_id)})

    @staticmethod
    def check_password(student, password):
        """Check if password matches."""
        if not student or 'password_hash' not in student:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), student['password_hash'].encode('utf-8'))

    @staticmethod
    def update_password(db, student_id, new_password):
        """Update student password."""
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db.students.update_one(
            {'_id': ObjectId(student_id)},
            {
                '$set': {
                    'password_hash': password_hash,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        return True

    @staticmethod
    def to_dict(student):
        """Convert student document to dictionary."""
        if not student:
            return None

        return {
            'id': str(student['_id']),
            'roll_no': student.get('roll_no'),
            'name': student.get('name'),
            'email': student.get('email'),
            'course': student.get('course'),
            'semester': student.get('semester'),
            'batch': student.get('batch'),
            'student_img': student.get('student_img'),
            'about_student': student.get('about_student'),
            'mob_no': student.get('mob_no'),
            'status': student.get('status'),
            'email_verified': student.get('email_verified', False),
            'created_at': student.get('created_at').isoformat() if student.get('created_at') else None,
            'updated_at': student.get('updated_at').isoformat() if student.get('updated_at') else None
        }
