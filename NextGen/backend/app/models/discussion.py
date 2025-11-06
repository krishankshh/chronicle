"""Discussion and reply helpers for MongoDB."""
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from app.utils.file_handler import FileHandler


class DiscussionHelper:
    """Helper methods for discussion threads."""

    @staticmethod
    def _collection(db):
        return db.discussions

    @staticmethod
    def _oid(value):
        if not value:
            return None
        if isinstance(value, ObjectId):
            return value
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @classmethod
    def create_discussion(cls, db, title, content, author_id, author_name=None, author_role=None,
                          course_id=None, subject_id=None, semester=None, attachments=None):
        now = cls._now()
        discussion = {
            'title': title,
            'content': content,
            'course_id': cls._oid(course_id),
            'subject_id': cls._oid(subject_id),
            'semester': semester,
            'attachments': attachments or [],
            'likes_count': 0,
            'liked_by': [],
            'reply_count': 0,
            'created_at': now,
            'updated_at': now,
            'created_by': cls._oid(author_id),
            'author_name': author_name,
            'author_role': author_role,
        }
        result = cls._collection(db).insert_one(discussion)
        discussion['_id'] = result.inserted_id
        return discussion

    @classmethod
    def update_discussion(cls, db, discussion_id, payload):
        oid = cls._oid(discussion_id)
        if oid is None:
            return None

        update_data = payload.copy()
        if 'course_id' in update_data:
            update_data['course_id'] = cls._oid(update_data.get('course_id'))
        if 'subject_id' in update_data:
            update_data['subject_id'] = cls._oid(update_data.get('subject_id'))

        update_data['updated_at'] = cls._now()
        cls._collection(db).update_one({'_id': oid}, {'$set': update_data})
        return cls.find_by_id(db, oid)

    @classmethod
    def find_by_id(cls, db, discussion_id):
        oid = cls._oid(discussion_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def list_discussions(cls, db, filters=None, page=1, limit=20, search=None):
        query = filters.copy() if filters else {}
        if search:
            regex = {'$regex': search, '$options': 'i'}
            query['$or'] = [{'title': regex}, {'content': regex}]

        skip = max(page - 1, 0) * limit
        cursor = cls._collection(db).find(query).sort('updated_at', -1)
        total = cls._collection(db).count_documents(query)
        items = list(cursor.skip(skip).limit(limit))
        return total, items

    @classmethod
    def delete_discussion(cls, db, discussion_id):
        oid = cls._oid(discussion_id)
        if oid is None:
            return False
        # also delete replies
        db.discussion_replies.delete_many({'discussion_id': oid})
        result = cls._collection(db).delete_one({'_id': oid})
        return result.deleted_count > 0

    @classmethod
    def add_attachments(cls, db, discussion_id, attachments):
        oid = cls._oid(discussion_id)
        if oid is None:
            return None
        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$push': {'attachments': {'$each': attachments}},
                '$set': {'updated_at': cls._now()}
            }
        )
        return cls.find_by_id(db, oid)

    @classmethod
    def remove_attachment(cls, db, discussion_id, attachment_id):
        oid = cls._oid(discussion_id)
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
    def toggle_like(cls, db, discussion_id, user_id):
        oid = cls._oid(discussion_id)
        uid = cls._oid(user_id)
        if oid is None or uid is None:
            return None
        discussion = cls.find_by_id(db, oid)
        if not discussion:
            return None
        liked_by = discussion.get('liked_by', [])
        if uid in liked_by:
            update = {
                '$pull': {'liked_by': uid},
                '$inc': {'likes_count': -1},
            }
        else:
            update = {
                '$addToSet': {'liked_by': uid},
                '$inc': {'likes_count': 1},
            }
        update['$set'] = {'updated_at': cls._now()}
        cls._collection(db).update_one({'_id': oid}, update)
        return cls.find_by_id(db, oid)

    @staticmethod
    def _serialize_datetime(value):
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat()
        return None

    @classmethod
    def serialize_attachment(cls, attachment):
        path = attachment.get('path')
        relative = path.replace('/uploads/', '') if path and path.startswith('/uploads/') else path
        file_url = FileHandler.get_file_url(relative) if relative else None
        return {
            'id': attachment.get('id'),
            'name': attachment.get('name'),
            'original_name': attachment.get('original_name'),
            'path': path,
            'file_url': file_url,
            'content_type': attachment.get('content_type'),
            'file_size': attachment.get('file_size'),
            'uploaded_at': cls._serialize_datetime(attachment.get('uploaded_at')),
        }

    @classmethod
    def to_dict(cls, discussion, include_internal=False):
        if not discussion:
            return None
        data = {
            'id': str(discussion['_id']),
            'title': discussion.get('title'),
            'content': discussion.get('content'),
            'course_id': str(discussion.get('course_id')) if discussion.get('course_id') else None,
            'subject_id': str(discussion.get('subject_id')) if discussion.get('subject_id') else None,
            'semester': discussion.get('semester'),
            'attachments': [cls.serialize_attachment(a) for a in discussion.get('attachments', [])],
            'likes_count': discussion.get('likes_count', 0),
            'reply_count': discussion.get('reply_count', 0),
            'created_at': cls._serialize_datetime(discussion.get('created_at')),
            'updated_at': cls._serialize_datetime(discussion.get('updated_at')),
            'created_by': str(discussion.get('created_by')) if discussion.get('created_by') else None,
            'author_name': discussion.get('author_name'),
            'author_role': discussion.get('author_role'),
        }
        if include_internal:
            data['liked_by'] = [str(uid) for uid in discussion.get('liked_by', [])]
        return data


class DiscussionReplyHelper:
    """Helper methods for discussion replies."""

    @staticmethod
    def _collection(db):
        return db.discussion_replies

    @staticmethod
    def _oid(value):
        if not value:
            return None
        if isinstance(value, ObjectId):
            return value
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @classmethod
    def create_reply(cls, db, discussion_id, author_id, author_name, author_role,
                     content, parent_reply_id=None, attachments=None):
        now = cls._now()
        reply = {
            'discussion_id': cls._oid(discussion_id),
            'parent_reply_id': cls._oid(parent_reply_id),
            'content': content,
            'attachments': attachments or [],
            'likes_count': 0,
            'liked_by': [],
            'created_at': now,
            'updated_at': now,
            'created_by': cls._oid(author_id),
            'author_name': author_name,
            'author_role': author_role,
        }
        result = cls._collection(db).insert_one(reply)
        reply['_id'] = result.inserted_id
        db.discussions.update_one(
            {'_id': cls._oid(discussion_id)},
            {'$inc': {'reply_count': 1}, '$set': {'updated_at': now}}
        )
        return reply

    @classmethod
    def update_reply(cls, db, reply_id, payload):
        oid = cls._oid(reply_id)
        if oid is None:
            return None
        payload['updated_at'] = cls._now()
        cls._collection(db).update_one({'_id': oid}, {'$set': payload})
        return cls.find_by_id(db, oid)

    @classmethod
    def find_by_id(cls, db, reply_id):
        oid = cls._oid(reply_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def list_by_discussion(cls, db, discussion_id):
        return list(cls._collection(db).find({'discussion_id': cls._oid(discussion_id)}).sort('created_at', 1))

    @classmethod
    def delete_reply(cls, db, reply_id):
        oid = cls._oid(reply_id)
        if oid is None:
            return False
        reply = cls._collection(db).find_one({'_id': oid})
        if not reply:
            return False
        cls._collection(db).delete_many({'parent_reply_id': oid})
        cls._collection(db).delete_one({'_id': oid})
        db.discussions.update_one(
            {'_id': reply['discussion_id']},
            {'$inc': {'reply_count': -1}, '$set': {'updated_at': cls._now()}}
        )
        return True

    @classmethod
    def toggle_like(cls, db, reply_id, user_id):
        oid = cls._oid(reply_id)
        uid = cls._oid(user_id)
        if oid is None or uid is None:
            return None
        reply = cls.find_by_id(db, oid)
        if not reply:
            return None

        liked_by = reply.get('liked_by', [])
        if uid in liked_by:
            update = {
                '$pull': {'liked_by': uid},
                '$inc': {'likes_count': -1},
            }
        else:
            update = {
                '$addToSet': {'liked_by': uid},
                '$inc': {'likes_count': 1},
            }
        update['$set'] = {'updated_at': cls._now()}
        cls._collection(db).update_one({'_id': oid}, update)
        return cls.find_by_id(db, oid)

    @classmethod
    def add_attachments(cls, db, reply_id, attachments):
        oid = cls._oid(reply_id)
        if oid is None:
            return None
        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$push': {'attachments': {'$each': attachments}},
                '$set': {'updated_at': cls._now()}
            }
        )
        return cls.find_by_id(db, oid)

    @classmethod
    def serialize_attachment(cls, attachment):
        path = attachment.get('path')
        relative = path.replace('/uploads/', '') if path and path.startswith('/uploads/') else path
        file_url = FileHandler.get_file_url(relative) if relative else None
        return {
            'id': attachment.get('id'),
            'name': attachment.get('name'),
            'original_name': attachment.get('original_name'),
            'path': path,
            'file_url': file_url,
            'content_type': attachment.get('content_type'),
            'file_size': attachment.get('file_size'),
            'uploaded_at': DiscussionHelper._serialize_datetime(attachment.get('uploaded_at')),
        }

    @classmethod
    def to_dict(cls, reply, include_children=False):
        if not reply:
            return None
        data = {
            'id': str(reply['_id']),
            'discussion_id': str(reply['discussion_id']),
            'parent_reply_id': str(reply['parent_reply_id']) if reply.get('parent_reply_id') else None,
            'content': reply.get('content'),
            'attachments': [cls.serialize_attachment(a) for a in reply.get('attachments', [])],
            'likes_count': reply.get('likes_count', 0),
            'created_at': DiscussionHelper._serialize_datetime(reply.get('created_at')),
            'updated_at': DiscussionHelper._serialize_datetime(reply.get('updated_at')),
            'created_by': str(reply.get('created_by')) if reply.get('created_by') else None,
            'author_name': reply.get('author_name'),
            'author_role': reply.get('author_role'),
        }
        if include_children:
            data['children'] = include_children
        return data

    @classmethod
    def build_thread(cls, replies):
        lookup = {}
        root_replies = []

        for reply in replies:
            serialized = cls.to_dict(reply, include_children=[])
            lookup[reply['_id']] = serialized

        for reply in replies:
            parent_id = reply.get('parent_reply_id')
            if parent_id and parent_id in lookup:
                lookup[parent_id]['children'].append(lookup[reply['_id']])
            else:
                root_replies.append(lookup[reply['_id']])

        return root_replies


def build_attachment_metadata(file_storage, upload_folder):
    """Save file and return attachment metadata."""
    file_storage.stream.seek(0)
    file_bytes = file_storage.read()
    file_storage.stream.seek(0)
    filename = FileHandler.generate_filename(file_storage.filename)
    saved_name = FileHandler.save_local_file(file_storage, upload_folder, filename=filename)
    return {
        'id': str(uuid.uuid4()),
        'name': saved_name,
        'original_name': file_storage.filename,
        'path': f"/uploads/discussions/{saved_name}",
        'content_type': file_storage.mimetype,
        'file_size': len(file_bytes),
        'uploaded_at': datetime.now(timezone.utc),
    }
