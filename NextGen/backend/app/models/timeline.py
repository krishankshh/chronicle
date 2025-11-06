"""Timeline post and comment helpers for MongoDB."""
import os
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


def _serialize_datetime(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    return None


def _serialize_media_item(item):
    if not item:
        return None
    return {
        'id': item.get('id'),
        'name': item.get('name'),
        'original_name': item.get('original_name'),
        'path': item.get('path'),
        'file_url': item.get('file_url'),
        'content_type': item.get('content_type'),
        'media_type': item.get('media_type'),
        'file_size': item.get('file_size'),
        'uploaded_at': _serialize_datetime(item.get('uploaded_at')),
    }


def build_media_metadata(file_storage, upload_folder):
    """Persist image/video media and return metadata."""
    filename = file_storage.filename or ''
    if not filename:
        raise ValueError('Filename is required for media uploads.')

    is_image = FileHandler.allowed_file(filename, file_type='image')
    is_video = FileHandler.allowed_file(filename, file_type='video')
    if not (is_image or is_video):
        raise ValueError('Unsupported media type. Allowed images: png, jpg, jpeg, gif. Allowed videos: mp4, mov, mkv, avi, webm.')

    file_storage.stream.seek(0, os.SEEK_END)
    size_bytes = file_storage.tell()
    file_storage.stream.seek(0)

    max_size_mb = 15 if is_image else 80
    if size_bytes > max_size_mb * 1024 * 1024:
        raise ValueError(f'Media exceeds the {max_size_mb}MB size limit.')

    os.makedirs(upload_folder, exist_ok=True)

    if is_image:
        saved_name = FileHandler.save_image(file_storage, upload_folder)
    else:
        saved_name = FileHandler.save_local_file(file_storage, upload_folder)

    saved_path = os.path.join(upload_folder, saved_name)
    file_size = os.path.getsize(saved_path) if os.path.exists(saved_path) else size_bytes

    return {
        'id': str(uuid.uuid4()),
        'name': saved_name,
        'original_name': filename,
        'path': f"/uploads/timeline/{saved_name}",
        'file_url': FileHandler.get_file_url(f"timeline/{saved_name}"),
        'content_type': file_storage.mimetype,
        'media_type': 'image' if is_image else 'video',
        'file_size': file_size,
        'uploaded_at': _now(),
    }


class TimelinePostHelper:
    """Helper methods for timeline posts."""

    @staticmethod
    def _collection(db):
        return db.timeline_posts

    @classmethod
    def create_post(
        cls,
        db,
        author_id,
        author_name,
        author_role,
        content=None,
        media=None,
        visibility='public',
        tags=None,
        audience=None,
        author_avatar=None,
    ):
        document = {
            'content': content,
            'media': media or [],
            'media_count': len(media or []),
            'visibility': visibility or 'public',
            'tags': tags or [],
            'audience': audience or [],
            'comments_count': 0,
            'likes_count': 0,
            'liked_by': [],
            'created_at': _now(),
            'updated_at': _now(),
            'created_by': _oid(author_id),
            'author_name': author_name,
            'author_role': author_role,
            'author_avatar': author_avatar,
        }
        result = cls._collection(db).insert_one(document)
        document['_id'] = result.inserted_id
        return document

    @classmethod
    def update_post(cls, db, post_id, payload):
        oid = _oid(post_id)
        if oid is None:
            return None

        update_data = {key: value for key, value in payload.items() if key in {'content', 'visibility', 'tags', 'audience', 'media', 'media_count'}}
        if 'media' in update_data:
            update_data['media_count'] = len(update_data['media'])
        if not update_data:
            return cls.find_by_id(db, oid)

        update_data['updated_at'] = _now()
        cls._collection(db).update_one({'_id': oid}, {'$set': update_data})
        return cls.find_by_id(db, oid)

    @classmethod
    def append_media(cls, db, post_id, media_items):
        oid = _oid(post_id)
        if oid is None or not media_items:
            return None
        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$push': {'media': {'$each': media_items}},
                '$inc': {'media_count': len(media_items)},
                '$set': {'updated_at': _now()},
            },
        )
        return cls.find_by_id(db, oid)

    @classmethod
    def remove_media(cls, db, post_id, media_id):
        oid = _oid(post_id)
        if oid is None:
            return None
        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$pull': {'media': {'id': media_id}},
                '$inc': {'media_count': -1},
                '$set': {'updated_at': _now()},
            },
        )
        return cls.find_by_id(db, oid)

    @classmethod
    def find_by_id(cls, db, post_id):
        oid = _oid(post_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def delete_post(cls, db, post_id):
        oid = _oid(post_id)
        if oid is None:
            return False

        post = cls.find_by_id(db, oid)
        if not post:
            return False

        db.timeline_comments.delete_many({'post_id': oid})
        result = cls._collection(db).delete_one({'_id': oid})
        return result.deleted_count > 0, post

    @classmethod
    def _visibility_query(cls, role, user_id):
        visibility_values = {'public', 'campus'}
        if role == 'student':
            visibility_values.add('students')
        if role in {'staff', 'admin'}:
            visibility_values.add('staff')

        query = {
            '$or': [
                {'visibility': {'$in': list(visibility_values)}},
            ]
        }

        user_oid = _oid(user_id)
        if user_oid is not None:
            query['$or'].append({'created_by': user_oid})
        return query

    @classmethod
    def list_feed(cls, db, role, user_id, page=1, limit=10, before=None):
        query = cls._visibility_query(role, user_id)
        if before:
            try:
                before_dt = datetime.fromisoformat(before.replace('Z', '+00:00'))
                query['created_at'] = {'$lt': before_dt}
            except ValueError:
                pass

        skip = max(page - 1, 0) * limit
        cursor = cls._collection(db).find(query).sort('created_at', -1)
        total = cls._collection(db).count_documents(query)
        items = list(cursor.skip(skip).limit(limit))
        return total, items

    @classmethod
    def list_user_posts(cls, db, user_id, page=1, limit=10, viewer_role=None, viewer_id=None):
        oid = _oid(user_id)
        if oid is None:
            return 0, []
        query = {'created_by': oid}

        viewer_oid = _oid(viewer_id) if viewer_id else None
        if viewer_oid != oid:
            if viewer_role in {'staff', 'admin'}:
                pass
            else:
                permitted_visibility = {'public', 'campus'}
                if viewer_role == 'student':
                    permitted_visibility.add('students')
                query['visibility'] = {'$in': list(permitted_visibility)}

        skip = max(page - 1, 0) * limit
        cursor = cls._collection(db).find(query).sort('created_at', -1)
        total = cls._collection(db).count_documents(query)
        items = list(cursor.skip(skip).limit(limit))
        return total, items

    @classmethod
    def set_like(cls, db, post_id, user_id, like=True):
        oid = _oid(post_id)
        uid = _oid(user_id)
        if oid is None or uid is None:
            return None

        post = cls.find_by_id(db, oid)
        if not post:
            return None

        update = {'$set': {'updated_at': _now()}}
        if like:
            update['$addToSet'] = {'liked_by': uid}
            inc_value = 1 if uid not in post.get('liked_by', []) else 0
        else:
            update['$pull'] = {'liked_by': uid}
            inc_value = -1 if uid in post.get('liked_by', []) else 0

        if inc_value != 0:
            update.setdefault('$inc', {})['likes_count'] = inc_value

        cls._collection(db).update_one({'_id': oid}, update)
        return cls.find_by_id(db, oid)

    @staticmethod
    def to_dict(post, current_user_id=None):
        if not post:
            return None
        media_items = post.get('media', [])
        liked_by = post.get('liked_by', [])
        current_oid = _oid(current_user_id)
        is_liked = current_oid in liked_by if current_oid is not None else False
        return {
            'id': str(post['_id']),
            'content': post.get('content'),
            'media': [_serialize_media_item(item) for item in media_items],
            'media_count': post.get('media_count', len(media_items)),
            'visibility': post.get('visibility', 'public'),
            'tags': post.get('tags', []),
            'audience': post.get('audience', []),
            'likes_count': post.get('likes_count', 0),
            'comments_count': post.get('comments_count', 0),
            'is_liked': is_liked,
            'created_at': _serialize_datetime(post.get('created_at')),
            'updated_at': _serialize_datetime(post.get('updated_at')),
            'created_by': str(post.get('created_by')) if post.get('created_by') else None,
            'author_name': post.get('author_name'),
            'author_role': post.get('author_role'),
            'author_avatar': post.get('author_avatar'),
        }


class TimelineCommentHelper:
    """Helper methods for timeline comments."""

    @staticmethod
    def _collection(db):
        return db.timeline_comments

    @classmethod
    def create_comment(cls, db, post_id, author_id, author_name, author_role, content):
        oid = _oid(post_id)
        if oid is None:
            return None

        comment = {
            'post_id': oid,
            'content': content,
            'likes_count': 0,
            'liked_by': [],
            'created_at': _now(),
            'updated_at': _now(),
            'created_by': _oid(author_id),
            'author_name': author_name,
            'author_role': author_role,
        }
        result = cls._collection(db).insert_one(comment)
        comment['_id'] = result.inserted_id
        db.timeline_posts.update_one({'_id': oid}, {'$inc': {'comments_count': 1}, '$set': {'updated_at': _now()}})
        return comment

    @classmethod
    def list_comments(cls, db, post_id, page=1, limit=20):
        oid = _oid(post_id)
        if oid is None:
            return 0, []
        skip = max(page - 1, 0) * limit
        cursor = cls._collection(db).find({'post_id': oid}).sort('created_at', 1)
        total = cls._collection(db).count_documents({'post_id': oid})
        items = list(cursor.skip(skip).limit(limit))
        return total, items

    @classmethod
    def find_by_id(cls, db, comment_id):
        oid = _oid(comment_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def update_comment(cls, db, comment_id, payload):
        oid = _oid(comment_id)
        if oid is None:
            return None
        update_data = {key: value for key, value in payload.items() if key == 'content'}
        if not update_data:
            return cls.find_by_id(db, oid)
        update_data['updated_at'] = _now()
        cls._collection(db).update_one({'_id': oid}, {'$set': update_data})
        return cls.find_by_id(db, oid)

    @classmethod
    def delete_comment(cls, db, comment_id):
        oid = _oid(comment_id)
        if oid is None:
            return False
        comment = cls.find_by_id(db, oid)
        if not comment:
            return False
        cls._collection(db).delete_one({'_id': oid})
        db.timeline_posts.update_one({'_id': comment['post_id']}, {'$inc': {'comments_count': -1}, '$set': {'updated_at': _now()}})
        return True

    @classmethod
    def set_like(cls, db, comment_id, user_id, like=True):
        oid = _oid(comment_id)
        uid = _oid(user_id)
        if oid is None or uid is None:
            return None
        comment = cls.find_by_id(db, oid)
        if not comment:
            return None
        update = {'$set': {'updated_at': _now()}}
        if like:
            update['$addToSet'] = {'liked_by': uid}
            inc_value = 1 if uid not in comment.get('liked_by', []) else 0
        else:
            update['$pull'] = {'liked_by': uid}
            inc_value = -1 if uid in comment.get('liked_by', []) else 0
        if inc_value != 0:
            update.setdefault('$inc', {})['likes_count'] = inc_value
        cls._collection(db).update_one({'_id': oid}, update)
        return cls.find_by_id(db, oid)

    @staticmethod
    def to_dict(comment, current_user_id=None):
        if not comment:
            return None
        liked_by = comment.get('liked_by', [])
        current_oid = _oid(current_user_id)
        is_liked = current_oid in liked_by if current_oid is not None else False
        return {
            'id': str(comment['_id']),
            'post_id': str(comment['post_id']),
            'content': comment.get('content'),
            'likes_count': comment.get('likes_count', 0),
            'is_liked': is_liked,
            'created_at': _serialize_datetime(comment.get('created_at')),
            'updated_at': _serialize_datetime(comment.get('updated_at')),
            'created_by': str(comment.get('created_by')) if comment.get('created_by') else None,
            'author_name': comment.get('author_name'),
            'author_role': comment.get('author_role'),
        }
