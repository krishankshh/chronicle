"""Study material model helper for MongoDB."""
import uuid
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

from app.utils.file_handler import FileHandler


class StudyMaterialHelper:
    """Helper methods for StudyMaterial collection."""

    COLLECTION = 'materials'

    @staticmethod
    def _collection(db):
        return db[StudyMaterialHelper.COLLECTION]

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @staticmethod
    def _to_object_id(value):
        if not value:
            return None
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @classmethod
    def create_material(cls, db, title, description=None, course_id=None, subject_id=None,
                        semester=None, tags=None, created_by=None):
        """Create a new study material record."""
        now = cls._now()

        material = {
            'title': title,
            'description': description,
            'course_id': cls._to_object_id(course_id),
            'subject_id': cls._to_object_id(subject_id),
            'semester': semester,
            'tags': tags or [],
            'attachments': [],
            'download_count': 0,
            'created_at': now,
            'updated_at': now,
            'created_by': cls._to_object_id(created_by),
            'updated_by': cls._to_object_id(created_by),
        }

        result = cls._collection(db).insert_one(material)
        material['_id'] = result.inserted_id
        return material

    @classmethod
    def find_by_id(cls, db, material_id):
        """Find a material by ID."""
        oid = cls._to_object_id(material_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def list_materials(cls, db, filters=None, page=1, limit=20, sort=None, search=None):
        """Retrieve paginated list of materials."""
        query = filters.copy() if filters else {}

        if search:
            regex = {'$regex': search, '$options': 'i'}
            query['$or'] = [{'title': regex}, {'description': regex}]

        collection = cls._collection(db)

        skip = max(page - 1, 0) * limit
        cursor = collection.find(query)

        if sort:
            cursor = cursor.sort(sort)

        total = collection.count_documents(query)
        items = list(cursor.skip(skip).limit(limit))

        return total, items

    @classmethod
    def update_material(cls, db, material_id, update_data, updated_by=None):
        """Update material document."""
        oid = cls._to_object_id(material_id)
        if oid is None:
            return None

        update_payload = {**update_data}
        update_payload['updated_at'] = cls._now()
        if updated_by:
            update_payload['updated_by'] = cls._to_object_id(updated_by)

        result = cls._collection(db).update_one({'_id': oid}, {'$set': update_payload})
        if result.matched_count == 0:
            return None

        return cls.find_by_id(db, oid)

    @classmethod
    def delete_material(cls, db, material_id):
        """Delete material."""
        oid = cls._to_object_id(material_id)
        if oid is None:
            return False
        result = cls._collection(db).delete_one({'_id': oid})
        return result.deleted_count > 0

    @classmethod
    def add_attachments(cls, db, material_id, attachments):
        """Append attachments to a material."""
        oid = cls._to_object_id(material_id)
        if oid is None:
            return None

        now = cls._now()
        for attachment in attachments:
            attachment.setdefault('id', str(uuid.uuid4()))
            attachment.setdefault('uploaded_at', now)
            attachment.setdefault('download_count', 0)

        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$push': {'attachments': {'$each': attachments}},
                '$set': {'updated_at': now}
            }
        )

        return cls.find_by_id(db, oid)

    @classmethod
    def remove_attachment(cls, db, material_id, attachment_id):
        """Remove attachment from material."""
        oid = cls._to_object_id(material_id)
        if oid is None:
            return None

        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$pull': {'attachments': {'id': attachment_id}},
                '$set': {'updated_at': cls._now()}
            }
        )

        return cls.find_by_id(db, oid)

    @classmethod
    def increment_download_count(cls, db, material_id, attachment_id=None):
        """Increment download counters."""
        oid = cls._to_object_id(material_id)
        if oid is None:
            return

        update = {'$inc': {'download_count': 1}}
        array_filters = None

        if attachment_id:
            update['$inc']['attachments.$[item].download_count'] = 1
            array_filters = [{'item.id': attachment_id}]

        cls._collection(db).update_one(
            {'_id': oid},
            update,
            array_filters=array_filters
        )

    @staticmethod
    def _serialize_datetime(value):
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat()
        return None

    @classmethod
    def to_dict(cls, material):
        """Convert material document to serializable structure."""
        if not material:
            return None

        def serialize_attachment(item):
            path = item.get('path')
            relative = path.replace('/uploads/', '') if path and path.startswith('/uploads/') else path
            file_url = FileHandler.get_file_url(relative) if relative else None

            return {
                'id': item.get('id'),
                'name': item.get('name'),
                'original_name': item.get('original_name'),
                'path': path,
                'file_url': file_url,
                'content_type': item.get('content_type'),
                'file_size': item.get('file_size'),
                'download_count': item.get('download_count', 0),
                'uploaded_at': cls._serialize_datetime(item.get('uploaded_at')),
            }

        return {
            'id': str(material.get('_id')),
            'title': material.get('title'),
            'description': material.get('description'),
            'course_id': str(material.get('course_id')) if material.get('course_id') else None,
            'subject_id': str(material.get('subject_id')) if material.get('subject_id') else None,
            'semester': material.get('semester'),
            'tags': material.get('tags', []),
            'attachments': [serialize_attachment(item) for item in material.get('attachments', [])],
            'download_count': material.get('download_count', 0),
            'created_at': cls._serialize_datetime(material.get('created_at')),
            'updated_at': cls._serialize_datetime(material.get('updated_at')),
            'created_by': str(material.get('created_by')) if material.get('created_by') else None,
            'updated_by': str(material.get('updated_by')) if material.get('updated_by') else None,
        }
