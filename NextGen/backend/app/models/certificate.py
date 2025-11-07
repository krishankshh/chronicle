"""Certificate model helpers."""
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId


def _to_str(value):
    """Convert ObjectId or datetime to string."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


class CertificateTypeHelper:
    """Helper methods for certificate_types collection."""

    @staticmethod
    def create_certificate_type(db, certificate_type, description=None, status='Active'):
        """Create a new certificate type."""
        now = datetime.utcnow()
        doc = {
            'certificate_type': certificate_type.strip(),
            'description': description or '',
            'status': status or 'Active',
            'created_at': now,
            'updated_at': now,
        }
        result = db.certificate_types.insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_all(db, status=None):
        """Return all certificate types filtering by status if provided."""
        query = {}
        if status:
            query['status'] = status
        cursor = db.certificate_types.find(query).sort('certificate_type', 1)
        return list(cursor)

    @staticmethod
    def find_by_id(db, type_id):
        """Find certificate type by ID."""
        if not type_id:
            return None
        try:
            oid = ObjectId(type_id) if not isinstance(type_id, ObjectId) else type_id
        except (InvalidId, TypeError):
            return None
        return db.certificate_types.find_one({'_id': oid})

    @staticmethod
    def update_certificate_type(db, type_id, updates):
        """Update certificate type fields."""
        if not updates:
            return None
        oid = ObjectId(type_id) if not isinstance(type_id, ObjectId) else type_id
        updates['updated_at'] = datetime.utcnow()
        db.certificate_types.update_one({'_id': oid}, {'$set': updates})
        return db.certificate_types.find_one({'_id': oid})

    @staticmethod
    def delete_certificate_type(db, type_id):
        """Delete certificate type."""
        oid = ObjectId(type_id) if not isinstance(type_id, ObjectId) else type_id
        return db.certificate_types.delete_one({'_id': oid})

    @staticmethod
    def to_dict(certificate_type):
        """Serialize certificate type."""
        if not certificate_type:
            return None
        return {
            'id': _to_str(certificate_type.get('_id')),
            '_id': _to_str(certificate_type.get('_id')),  # keep backward compatibility for frontend
            'certificate_type': certificate_type.get('certificate_type'),
            'description': certificate_type.get('description'),
            'status': certificate_type.get('status', 'Active'),
            'created_at': _to_str(certificate_type.get('created_at')),
            'updated_at': _to_str(certificate_type.get('updated_at')),
        }


class CertificateHelper:
    """Helper methods for certificates collection."""

    @staticmethod
    def create_certificate(
        db,
        student_id,
        certificate_type_id,
        issue_date,
        certificate_file=None,
        remarks=None,
        status='Active',
    ):
        """Insert a new certificate."""
        now = datetime.utcnow()
        doc = {
            'student_id': ObjectId(student_id) if not isinstance(student_id, ObjectId) else student_id,
            'certificate_type_id': ObjectId(certificate_type_id) if not isinstance(certificate_type_id, ObjectId) else certificate_type_id,
            'issue_date': issue_date,
            'certificate_file': certificate_file,
            'remarks': remarks or '',
            'status': status or 'Active',
            'created_at': now,
            'updated_at': now,
        }
        result = db.certificates.insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    @staticmethod
    def find_by_id(db, certificate_id):
        """Find certificate by ID."""
        if not certificate_id:
            return None
        try:
            oid = ObjectId(certificate_id) if not isinstance(certificate_id, ObjectId) else certificate_id
        except (InvalidId, TypeError):
            return None
        return db.certificates.find_one({'_id': oid})

    @staticmethod
    def find_by_student(db, student_id, status=None):
        """Return certificates for a student."""
        query = {
            'student_id': ObjectId(student_id) if not isinstance(student_id, ObjectId) else student_id
        }
        if status:
            query['status'] = status
        cursor = db.certificates.find(query).sort([('issue_date', -1), ('created_at', -1)])
        return list(cursor)

    @staticmethod
    def list_certificates(db, filters=None, sort=None):
        """List certificates using filters."""
        query = filters or {}
        cursor = db.certificates.find(query)
        if sort:
            cursor = cursor.sort(sort)
        return list(cursor)

    @staticmethod
    def to_dict(certificate, student=None, certificate_type=None):
        """Serialize certificate with optional populated refs."""
        if not certificate:
            return None
        data = {
            'id': _to_str(certificate.get('_id')),
            '_id': _to_str(certificate.get('_id')),
            'student_id': _to_str(certificate.get('student_id')),
            'certificate_type_id': _to_str(certificate.get('certificate_type_id')),
            'issue_date': _to_str(certificate.get('issue_date')),
            'certificate_file': certificate.get('certificate_file'),
            'remarks': certificate.get('remarks', ''),
            'status': certificate.get('status', 'Active'),
            'created_at': _to_str(certificate.get('created_at')),
            'updated_at': _to_str(certificate.get('updated_at')),
        }

        if student:
            data['student_name'] = student.get('name')
            data['roll_no'] = student.get('roll_no')
            data['course'] = student.get('course')

        if certificate_type:
            data['certificate_type_name'] = certificate_type.get('certificate_type')

        return data
