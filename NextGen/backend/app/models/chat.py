"""Chat and messaging helpers for MongoDB."""
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from app.utils.file_handler import FileHandler


def _now():
    return datetime.now(timezone.utc)


def _oid(value):
    if not value:
        return None
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _serialize_dt(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    return None


def _serialize_attachment(attachment):
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
        'uploaded_at': _serialize_dt(attachment.get('uploaded_at')),
    }


class ChatSessionHelper:
    """Helper methods for one-to-one chat sessions."""

    @staticmethod
    def _collection(db):
        return db.chat_sessions

    @classmethod
    def find_or_create(cls, db, user_a, user_b, participant_meta=None):
        participants = sorted({_oid(user_a), _oid(user_b)})
        if None in participants:
            raise ValueError('Invalid participant identifiers.')

        existing = cls._collection(db).find_one({'participants': participants})
        if existing:
            if participant_meta:
                cls._collection(db).update_one(
                    {'_id': existing['_id']},
                    {'$set': {'participant_meta': participant_meta, 'updated_at': _now()}}
                )
                existing['participant_meta'] = participant_meta
            return existing

        now = _now()
        session = {
            'participants': participants,
            'participant_meta': participant_meta or [],
            'last_message': None,
            'last_message_at': None,
            'created_at': now,
            'updated_at': now,
        }
        result = cls._collection(db).insert_one(session)
        session['_id'] = result.inserted_id
        return session

    @classmethod
    def list_for_user(cls, db, user_id, limit=100):
        oid = _oid(user_id)
        if oid is None:
            return []
        return list(
            cls._collection(db)
            .find({'participants': oid})
            .sort('updated_at', -1)
            .limit(limit)
        )

    @classmethod
    def find_by_id(cls, db, chat_id):
        return cls._collection(db).find_one({'_id': _oid(chat_id)})

    @classmethod
    def update_last_message(cls, db, chat_id, message):
        cls._collection(db).update_one(
            {'_id': _oid(chat_id)},
            {
                '$set': {
                    'last_message': message,
                    'last_message_at': _now(),
                    'updated_at': _now(),
                }
            }
        )

    @classmethod
    def delete(cls, db, chat_id):
        result = cls._collection(db).delete_one({'_id': _oid(chat_id)})
        if result.deleted_count:
            db.chat_messages.delete_many({'chat_id': _oid(chat_id)})
        return result.deleted_count > 0

    @staticmethod
    def to_dict(session):
        if not session:
            return None
        return {
            'id': str(session['_id']),
            'participants': [str(p) for p in session.get('participants', [])],
            'participant_meta': session.get('participant_meta', []),
            'last_message': session.get('last_message'),
            'last_message_at': _serialize_dt(session.get('last_message_at')),
            'created_at': _serialize_dt(session.get('created_at')),
            'updated_at': _serialize_dt(session.get('updated_at')),
        }


class GroupChatHelper:
    """Helper methods for group chat rooms."""

    @staticmethod
    def _collection(db):
        return db.group_chats

    @classmethod
    def create_group(cls, db, name, created_by, member_ids=None, description=None,
                     course_id=None, subject_id=None, semester=None, member_meta=None):
        now = _now()
        group = {
            'name': name,
            'description': description,
            'course_id': _oid(course_id),
            'subject_id': _oid(subject_id),
            'semester': semester,
            'member_ids': [_oid(created_by)] + [_oid(mid) for mid in (member_ids or []) if _oid(mid)],
            'admins': [_oid(created_by)],
            'created_by': _oid(created_by),
            'member_meta': member_meta or [],
            'created_at': now,
            'updated_at': now,
            'last_message': None,
            'last_message_at': None,
        }
        result = cls._collection(db).insert_one(group)
        group['_id'] = result.inserted_id
        return group

    @classmethod
    def list_for_user(cls, db, user_id):
        oid = _oid(user_id)
        if oid is None:
            return []
        return list(cls._collection(db).find({'member_ids': oid}).sort('updated_at', -1))

    @classmethod
    def find_by_id(cls, db, group_id):
        return cls._collection(db).find_one({'_id': _oid(group_id)})

    @classmethod
    def update(cls, db, group_id, payload):
        update_data = payload.copy()
        if 'course_id' in update_data:
            update_data['course_id'] = _oid(update_data.get('course_id'))
        if 'subject_id' in update_data:
            update_data['subject_id'] = _oid(update_data.get('subject_id'))
        if 'member_meta' in update_data:
            update_data['member_meta'] = update_data.get('member_meta') or []
        update_data['updated_at'] = _now()
        cls._collection(db).update_one({'_id': _oid(group_id)}, {'$set': update_data})
        return cls.find_by_id(db, group_id)

    @classmethod
    def update_last_message(cls, db, group_id, message):
        cls._collection(db).update_one(
            {'_id': _oid(group_id)},
            {
                '$set': {
                    'last_message': message,
                    'last_message_at': _now(),
                    'updated_at': _now(),
                }
            }
        )

    @classmethod
    def add_member(cls, db, group_id, user_id):
        cls._collection(db).update_one(
            {'_id': _oid(group_id)},
            {
                '$addToSet': {'member_ids': _oid(user_id)},
                '$set': {'updated_at': _now()},
            }
        )

    @classmethod
    def remove_member(cls, db, group_id, user_id):
        cls._collection(db).update_one(
            {'_id': _oid(group_id)},
            {
                '$pull': {'member_ids': _oid(user_id)},
                '$set': {'updated_at': _now()},
            }
        )

    @classmethod
    def delete(cls, db, group_id):
        result = cls._collection(db).delete_one({'_id': _oid(group_id)})
        if result.deleted_count:
            db.chat_messages.delete_many({'group_id': _oid(group_id)})
        return result.deleted_count > 0

    @staticmethod
    def to_dict(group):
        if not group:
            return None
        return {
            'id': str(group['_id']),
            'name': group.get('name'),
            'description': group.get('description'),
            'course_id': str(group.get('course_id')) if group.get('course_id') else None,
            'subject_id': str(group.get('subject_id')) if group.get('subject_id') else None,
            'semester': group.get('semester'),
            'member_ids': [str(mid) for mid in group.get('member_ids', [])],
            'admins': [str(aid) for aid in group.get('admins', [])],
            'created_by': str(group.get('created_by')) if group.get('created_by') else None,
            'created_at': _serialize_dt(group.get('created_at')),
            'updated_at': _serialize_dt(group.get('updated_at')),
            'last_message': group.get('last_message'),
            'last_message_at': _serialize_dt(group.get('last_message_at')),
            'member_meta': group.get('member_meta', []),
        }


class ChatMessageHelper:
    """Helper methods for chat messages."""

    @staticmethod
    def _collection(db):
        return db.chat_messages

    @classmethod
    def create_message(cls, db, sender_id, content=None, attachments=None,
                       chat_id=None, group_id=None, message_type='text',
                       meta=None):
        if not chat_id and not group_id:
            raise ValueError('Either chat_id or group_id is required.')
        now = _now()
        message = {
            'chat_id': _oid(chat_id),
            'group_id': _oid(group_id),
            'sender_id': _oid(sender_id),
            'content': content,
            'attachments': attachments or [],
            'message_type': message_type,
            'meta': meta or {},
            'created_at': now,
            'updated_at': now,
            'read_by': [_oid(sender_id)],
            'delivered_to': [],
        }
        result = cls._collection(db).insert_one(message)
        message['_id'] = result.inserted_id
        return message

    @classmethod
    def list_messages(cls, db, chat_id=None, group_id=None, before=None, limit=50, search=None):
        query = {}
        if chat_id:
            query['chat_id'] = _oid(chat_id)
        if group_id:
            query['group_id'] = _oid(group_id)
        if before:
            query['created_at'] = {'$lt': before}
        if search:
            query['content'] = {'$regex': search, '$options': 'i'}

        return list(
            cls._collection(db)
            .find(query)
            .sort('created_at', -1)
            .limit(limit)
        )[::-1]

    @classmethod
    def mark_read(cls, db, message_ids, user_id):
        cls._collection(db).update_many(
            {'_id': {'$in': [_oid(mid) for mid in message_ids]}},
            {'$addToSet': {'read_by': _oid(user_id)}}
        )

    @staticmethod
    def to_dict(message):
        if not message:
            return None
        return {
            'id': str(message['_id']),
            'chat_id': str(message['chat_id']) if message.get('chat_id') else None,
            'group_id': str(message['group_id']) if message.get('group_id') else None,
            'sender_id': str(message.get('sender_id')) if message.get('sender_id') else None,
            'content': message.get('content'),
            'attachments': [_serialize_attachment(a) for a in message.get('attachments', [])],
            'message_type': message.get('message_type', 'text'),
            'meta': message.get('meta', {}),
            'created_at': _serialize_dt(message.get('created_at')),
            'updated_at': _serialize_dt(message.get('updated_at')),
            'read_by': [str(uid) for uid in message.get('read_by', [])],
            'delivered_to': [str(uid) for uid in message.get('delivered_to', [])],
        }


def save_chat_attachment(file_storage, upload_folder):
    """Persist chat attachment and return metadata."""
    file_storage.stream.seek(0)
    file_bytes = file_storage.read()
    file_storage.stream.seek(0)

    filename = FileHandler.generate_filename(file_storage.filename)
    saved_name = FileHandler.save_local_file(file_storage, upload_folder, filename=filename)
    return {
        'id': str(uuid.uuid4()),
        'name': saved_name,
        'original_name': file_storage.filename,
        'path': f"/uploads/chat/{saved_name}",
        'content_type': file_storage.mimetype,
        'file_size': len(file_bytes),
        'uploaded_at': _now(),
    }
