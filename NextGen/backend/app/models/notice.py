"""Notice model helper for MongoDB."""
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

from app.utils.file_handler import FileHandler


class NoticeHelper:
    """Helper methods for Notice collection."""

    ALLOWED_TYPES = {'news', 'events', 'meetings'}
    ALLOWED_STATUS = {'draft', 'published'}

    @staticmethod
    def _collection(db):
        return db.notices

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
    def create_notice(cls, db, title, content, notice_type, status='draft', summary=None,
                      publish_start=None, publish_end=None, is_featured=False,
                      attachments=None, created_by=None):
        """Create a new notice."""
        now = cls._now()

        publish_start_dt = publish_start or now
        publish_end_dt = publish_end

        notice_data = {
            'title': title,
            'summary': summary,
            'content': content,
            'type': notice_type,
            'status': status,
            'is_featured': bool(is_featured),
            'publish_start': publish_start_dt,
            'publish_end': publish_end_dt,
            'attachments': attachments or [],
            'cover_image': None,
            'created_at': now,
            'updated_at': now,
            'created_by': cls._to_object_id(created_by),
            'updated_by': cls._to_object_id(created_by),
        }

        result = cls._collection(db).insert_one(notice_data)
        notice_data['_id'] = result.inserted_id
        return notice_data

    @classmethod
    def find_by_id(cls, db, notice_id):
        """Find notice by ID."""
        oid = cls._to_object_id(notice_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def list_notices(cls, db, filters=None, limit=None, sort=None):
        """Retrieve notices matching filters."""
        query = filters or {}
        cursor = cls._collection(db).find(query)

        if sort:
            cursor = cursor.sort(sort)

        if limit:
            cursor = cursor.limit(int(limit))

        return list(cursor)

    @classmethod
    def update_notice(cls, db, notice_id, update_data, updated_by=None):
        """Update an existing notice."""
        oid = cls._to_object_id(notice_id)
        if oid is None:
            return None

        update_payload = {**update_data}
        update_payload['updated_at'] = cls._now()
        if updated_by:
            update_payload['updated_by'] = cls._to_object_id(updated_by)

        result = cls._collection(db).update_one(
            {'_id': oid},
            {'$set': update_payload}
        )

        if result.matched_count == 0:
            return None

        return cls.find_by_id(db, oid)

    @classmethod
    def delete_notice(cls, db, notice_id):
        """Delete a notice."""
        oid = cls._to_object_id(notice_id)
        if oid is None:
            return False

        result = cls._collection(db).delete_one({'_id': oid})
        return result.deleted_count > 0

    @classmethod
    def set_cover_image(cls, db, notice_id, image_path):
        """Set the cover image for a notice."""
        return cls.update_notice(db, notice_id, {'cover_image': image_path})

    @classmethod
    def add_attachment(cls, db, notice_id, attachment):
        """Add attachment metadata to notice."""
        oid = cls._to_object_id(notice_id)
        if oid is None:
            return None

        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$push': {'attachments': attachment},
                '$set': {'updated_at': cls._now()}
            }
        )

        return cls.find_by_id(db, oid)

    @classmethod
    def remove_attachment(cls, db, notice_id, attachment_id):
        """Remove attachment metadata from notice."""
        oid = cls._to_object_id(notice_id)
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

    @staticmethod
    def _serialize_datetime(value):
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat()
        return None

    @classmethod
    def to_dict(cls, notice):
        """Convert notice document to serializable dictionary."""
        if not notice:
            return None

        cover_image = notice.get('cover_image')
        cover_image_relative = None
        if cover_image and cover_image.startswith('/uploads/'):
            cover_image_relative = cover_image.replace('/uploads/', '')

        cover_image_url = FileHandler.get_file_url(cover_image_relative) if cover_image_relative else None

        def serialize_attachment(item):
            return {
                'id': str(item.get('id')) if item.get('id') else None,
                'name': item.get('name'),
                'url': item.get('url'),
                'uploaded_at': cls._serialize_datetime(item.get('uploaded_at')),
                'type': item.get('type'),
                'size': item.get('size'),
            }

        return {
            'id': str(notice.get('_id')),
            'title': notice.get('title'),
            'summary': notice.get('summary'),
            'content': notice.get('content'),
            'type': notice.get('type'),
            'status': notice.get('status'),
            'is_featured': notice.get('is_featured', False),
            'publish_start': cls._serialize_datetime(notice.get('publish_start')),
            'publish_end': cls._serialize_datetime(notice.get('publish_end')),
            'cover_image': cover_image,
            'cover_image_url': cover_image_url,
            'attachments': [serialize_attachment(item) for item in notice.get('attachments', [])],
            'created_at': cls._serialize_datetime(notice.get('created_at')),
            'updated_at': cls._serialize_datetime(notice.get('updated_at')),
            'created_by': str(notice.get('created_by')) if notice.get('created_by') else None,
            'updated_by': str(notice.get('updated_by')) if notice.get('updated_by') else None,
        }
