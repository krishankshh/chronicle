"""Timeline and activity feed endpoints."""
import json
import os

from flask import current_app, request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.datastructures import FileStorage

from app.db import get_db
from app.models.timeline import (
    TimelinePostHelper,
    TimelineCommentHelper,
    build_media_metadata,
)
from app.models.student import StudentHelper
from app.models.user import UserHelper
from app.utils.file_handler import FileHandler

api = Namespace('timeline', description='Timeline and activity feed operations')


media_model = api.model('TimelineMedia', {
    'id': fields.String(),
    'name': fields.String(),
    'original_name': fields.String(),
    'path': fields.String(),
    'file_url': fields.String(),
    'content_type': fields.String(),
    'media_type': fields.String(),
    'file_size': fields.Integer(),
    'uploaded_at': fields.String(),
})

post_model = api.model('TimelinePost', {
    'id': fields.String(),
    'content': fields.String(),
    'media': fields.List(fields.Nested(media_model)),
    'media_count': fields.Integer(),
    'visibility': fields.String(),
    'tags': fields.List(fields.String()),
    'audience': fields.List(fields.String()),
    'likes_count': fields.Integer(),
    'comments_count': fields.Integer(),
    'is_liked': fields.Boolean(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
    'created_by': fields.String(),
    'author_name': fields.String(),
    'author_role': fields.String(),
    'author_avatar': fields.String(),
})

post_list_model = api.model('TimelinePostList', {
    'success': fields.Boolean(),
    'page': fields.Integer(),
    'limit': fields.Integer(),
    'total': fields.Integer(),
    'has_more': fields.Boolean(),
    'next_page': fields.Integer(),
    'posts': fields.List(fields.Nested(post_model)),
})

comment_model = api.model('TimelineComment', {
    'id': fields.String(),
    'post_id': fields.String(),
    'content': fields.String(),
    'likes_count': fields.Integer(),
    'is_liked': fields.Boolean(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
    'created_by': fields.String(),
    'author_name': fields.String(),
    'author_role': fields.String(),
})

comment_list_model = api.model('TimelineCommentList', {
    'success': fields.Boolean(),
    'page': fields.Integer(),
    'limit': fields.Integer(),
    'total': fields.Integer(),
    'comments': fields.List(fields.Nested(comment_model)),
})

post_create_model = api.model('TimelinePostCreate', {
    'content': fields.String(),
    'visibility': fields.String(description='Visibility level: public, campus, students, staff, private'),
    'tags': fields.List(fields.String()),
    'audience': fields.List(fields.String()),
})

comment_create_model = api.model('TimelineCommentCreate', {
    'content': fields.String(required=True),
})

media_upload_parser = api.parser()
media_upload_parser.add_argument(
    'media',
    location='files',
    type=FileStorage,
    action='append',
    required=False,
    help='Image or video files for the post.',
)


def _current_user_details():
    """Return user id, role, name, and avatar URL for the authenticated user."""
    claims = get_jwt()
    user_id = claims.get('user_id')
    role = claims.get('role')
    db = get_db()

    if role == 'student':
        student = StudentHelper.find_by_id(db, user_id)
        if not student:
            api.abort(404, 'Student profile not found.')
        return user_id, role, student.get('name'), student.get('student_img')
    user = UserHelper.find_by_id(db, user_id)
    if not user:
        api.abort(404, 'User profile not found.')
    display_name = user.get('name') or user.get('login_id')
    return user_id, 'admin' if user.get('user_type') == 'Admin' else 'staff', display_name, user.get('user_img')


def _parse_json_field(raw_value, default=None):
    if raw_value is None or raw_value == '':
        return default or []
    if isinstance(raw_value, (list, tuple)):
        return list(raw_value)
    try:
        parsed = json.loads(raw_value)
        if isinstance(parsed, list):
            return parsed
        return default or []
    except json.JSONDecodeError:
        return default or []


def _ensure_post_permissions(post, current_user_id, role):
    if not post:
        api.abort(404, 'Timeline post not found.')
    owner_id = post.get('created_by')
    is_owner = str(owner_id) == str(current_user_id)
    if not is_owner and role not in {'staff', 'admin'}:
        api.abort(403, 'You do not have permission to modify this post.')
    return is_owner


@api.route('')
class TimelineFeed(Resource):
    """Paginated timeline feed for the authenticated user."""

    @api.doc(params={
        'page': 'Page number (default 1)',
        'limit': 'Items per page (default 10, max 50)',
        'before': 'ISO timestamp to fetch posts created before this time',
    })
    @api.marshal_with(post_list_model)
    @jwt_required()
    def get(self):
        params = request.args
        try:
            page = int(params.get('page', 1))
        except (TypeError, ValueError):
            page = 1
        try:
            limit = int(params.get('limit', 10))
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, 50))
        before = params.get('before')

        current_user_id, role, _, _ = _current_user_details()
        total, posts = TimelinePostHelper.list_feed(get_db(), role, current_user_id, page=page, limit=limit, before=before)
        serialized = [TimelinePostHelper.to_dict(post, current_user_id=current_user_id) for post in posts]
        has_more = page * limit < total
        return {
            'success': True,
            'page': page,
            'limit': limit,
            'total': total,
            'has_more': has_more,
            'next_page': page + 1 if has_more else None,
            'posts': serialized,
        }


@api.route('/post')
class TimelinePostCreate(Resource):
    """Create a new timeline post."""

    @api.expect(post_create_model, validate=False)
    @api.expect(media_upload_parser)
    @api.marshal_with(post_model)
    @jwt_required()
    def post(self):
        if request.content_type and 'multipart/form-data' in request.content_type:
            form = request.form
            media_files = request.files.getlist('media')
            payload = {
                'content': form.get('content'),
                'visibility': form.get('visibility'),
                'tags': _parse_json_field(form.get('tags')),
                'audience': _parse_json_field(form.get('audience')),
            }
        else:
            payload = request.get_json() or {}
            media_files = []

        content = (payload.get('content') or '').strip()
        visibility = (payload.get('visibility') or 'public').lower()
        if visibility not in {'public', 'campus', 'students', 'staff', 'private'}:
            visibility = 'public'

        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'timeline')
        media_items = []
        for media_file in media_files or []:
            if not media_file or not media_file.filename:
                continue
            try:
                media_items.append(build_media_metadata(media_file, upload_folder))
            except ValueError as exc:
                api.abort(400, str(exc))

        if not content and not media_items:
            api.abort(400, 'Post content or at least one media attachment is required.')

        current_user_id, role, name, avatar = _current_user_details()
        post = TimelinePostHelper.create_post(
            get_db(),
            author_id=current_user_id,
            author_name=name,
            author_role=role,
            content=content,
            media=media_items,
            visibility=visibility,
            tags=payload.get('tags') or [],
            audience=payload.get('audience') or [],
            author_avatar=avatar,
        )
        return TimelinePostHelper.to_dict(post, current_user_id=current_user_id), 201


@api.route('/<string:post_id>')
class TimelinePostDetail(Resource):
    """Retrieve, update, or delete a timeline post."""

    @api.marshal_with(post_model)
    @jwt_required()
    def get(self, post_id):
        post = TimelinePostHelper.find_by_id(get_db(), post_id)
        if not post:
            api.abort(404, 'Timeline post not found.')
        current_user_id, _, _, _ = _current_user_details()
        return TimelinePostHelper.to_dict(post, current_user_id=current_user_id)

    @api.expect(post_create_model, validate=False)
    @api.marshal_with(post_model)
    @jwt_required()
    def put(self, post_id):
        db = get_db()
        post = TimelinePostHelper.find_by_id(db, post_id)
        current_user_id, role, _, _ = _current_user_details()
        _ensure_post_permissions(post, current_user_id, role)

        data = request.get_json() or {}
        payload = {}
        if 'content' in data:
            payload['content'] = (data.get('content') or '').strip()
        if 'visibility' in data:
            visibility = (data.get('visibility') or 'public').lower()
            if visibility in {'public', 'campus', 'students', 'staff', 'private'}:
                payload['visibility'] = visibility
        if 'tags' in data and isinstance(data['tags'], list):
            payload['tags'] = data['tags']
        if 'audience' in data and isinstance(data['audience'], list):
            payload['audience'] = data['audience']

        updated = TimelinePostHelper.update_post(db, post_id, payload)
        return TimelinePostHelper.to_dict(updated, current_user_id=current_user_id)

    @jwt_required()
    def delete(self, post_id):
        db = get_db()
        post = TimelinePostHelper.find_by_id(db, post_id)
        current_user_id, role, _, _ = _current_user_details()
        _ensure_post_permissions(post, current_user_id, role)

        deleted, document = TimelinePostHelper.delete_post(db, post_id)
        if not deleted:
            api.abort(404, 'Timeline post not found.')

        upload_root = current_app.config['UPLOAD_FOLDER']
        for media in document.get('media', []):
            path = media.get('path')
            if not path or not path.startswith('/uploads/'):
                continue
            relative = path.replace('/uploads/', '')
            file_path = os.path.join(upload_root, relative)
            FileHandler.delete_file(file_path)

        return {'success': True, 'message': 'Timeline post deleted.'}, 200


@api.route('/<string:post_id>/like')
class TimelinePostLike(Resource):
    """Like or unlike a timeline post."""

    @api.marshal_with(post_model)
    @jwt_required()
    def post(self, post_id):
        db = get_db()
        current_user_id, _, _, _ = _current_user_details()
        post = TimelinePostHelper.find_by_id(db, post_id)
        if not post:
            api.abort(404, 'Timeline post not found.')
        already_liked = TimelinePostHelper.to_dict(post, current_user_id=current_user_id)['is_liked']
        updated = TimelinePostHelper.set_like(db, post_id, current_user_id, like=not already_liked)
        return TimelinePostHelper.to_dict(updated, current_user_id=current_user_id)

    @api.marshal_with(post_model)
    @jwt_required()
    def delete(self, post_id):
        db = get_db()
        current_user_id, _, _, _ = _current_user_details()
        post = TimelinePostHelper.find_by_id(db, post_id)
        if not post:
            api.abort(404, 'Timeline post not found.')
        updated = TimelinePostHelper.set_like(db, post_id, current_user_id, like=False)
        return TimelinePostHelper.to_dict(updated, current_user_id=current_user_id)


@api.route('/<string:post_id>/comment')
class TimelineCommentCreate(Resource):
    """Create a comment on a timeline post."""

    @api.expect(comment_create_model, validate=True)
    @api.marshal_with(comment_model)
    @jwt_required()
    def post(self, post_id):
        data = request.get_json() or {}
        content = (data.get('content') or '').strip()
        if not content:
            api.abort(400, 'Comment content is required.')

        db = get_db()
        post = TimelinePostHelper.find_by_id(db, post_id)
        if not post:
            api.abort(404, 'Timeline post not found.')

        current_user_id, role, name, _ = _current_user_details()
        comment = TimelineCommentHelper.create_comment(
            db,
            post_id=post_id,
            author_id=current_user_id,
            author_name=name,
            author_role=role,
            content=content,
        )
        return TimelineCommentHelper.to_dict(comment, current_user_id=current_user_id), 201


@api.route('/<string:post_id>/comments')
class TimelineCommentList(Resource):
    """List comments for a timeline post."""

    @api.doc(params={
        'page': 'Page number (default 1)',
        'limit': 'Items per page (default 20, max 100)',
    })
    @api.marshal_with(comment_list_model)
    @jwt_required()
    def get(self, post_id):
        try:
            page = int(request.args.get('page', 1))
        except (TypeError, ValueError):
            page = 1
        try:
            limit = int(request.args.get('limit', 20))
        except (TypeError, ValueError):
            limit = 20
        limit = max(1, min(limit, 100))

        db = get_db()
        post = TimelinePostHelper.find_by_id(db, post_id)
        if not post:
            api.abort(404, 'Timeline post not found.')

        current_user_id, _, _, _ = _current_user_details()
        total, comments = TimelineCommentHelper.list_comments(db, post_id, page=page, limit=limit)
        serialized = [TimelineCommentHelper.to_dict(comment, current_user_id=current_user_id) for comment in comments]
        return {
            'success': True,
            'page': page,
            'limit': limit,
            'total': total,
            'comments': serialized,
        }


@api.route('/comments/<string:comment_id>')
class TimelineCommentDetail(Resource):
    """Update or delete a comment."""

    @api.expect(comment_create_model, validate=False)
    @api.marshal_with(comment_model)
    @jwt_required()
    def put(self, comment_id):
        db = get_db()
        comment = TimelineCommentHelper.find_by_id(db, comment_id)
        if not comment:
            api.abort(404, 'Comment not found.')

        current_user_id, role, _, _ = _current_user_details()
        owner_id = comment.get('created_by')
        if str(owner_id) != str(current_user_id) and role not in {'staff', 'admin'}:
            api.abort(403, 'You do not have permission to edit this comment.')

        data = request.get_json() or {}
        payload = {}
        if 'content' in data:
            payload['content'] = (data.get('content') or '').strip()
        updated = TimelineCommentHelper.update_comment(db, comment_id, payload)
        return TimelineCommentHelper.to_dict(updated, current_user_id=current_user_id)

    @jwt_required()
    def delete(self, comment_id):
        db = get_db()
        comment = TimelineCommentHelper.find_by_id(db, comment_id)
        if not comment:
            api.abort(404, 'Comment not found.')

        current_user_id, role, _, _ = _current_user_details()
        owner_id = comment.get('created_by')
        if str(owner_id) != str(current_user_id) and role not in {'staff', 'admin'}:
            api.abort(403, 'You do not have permission to delete this comment.')

        TimelineCommentHelper.delete_comment(db, comment_id)
        return {'success': True, 'message': 'Comment deleted.'}, 200


@api.route('/comments/<string:comment_id>/like')
class TimelineCommentLike(Resource):
    """Toggle like on a comment."""

    @api.marshal_with(comment_model)
    @jwt_required()
    def post(self, comment_id):
        db = get_db()
        comment = TimelineCommentHelper.find_by_id(db, comment_id)
        if not comment:
            api.abort(404, 'Comment not found.')
        current_user_id, _, _, _ = _current_user_details()
        current_state = TimelineCommentHelper.to_dict(comment, current_user_id=current_user_id)['is_liked']
        updated = TimelineCommentHelper.set_like(db, comment_id, current_user_id, like=not current_state)
        return TimelineCommentHelper.to_dict(updated, current_user_id=current_user_id)
