"""Discussion forum endpoints."""
import io
import os

from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.datastructures import FileStorage

from app.db import get_db
from app.models.discussion import (
    DiscussionHelper,
    DiscussionReplyHelper,
    build_attachment_metadata,
)
from app.utils.file_handler import FileHandler

api = Namespace('discussions', description='Discussion forum operations')


attachment_model = api.model('DiscussionAttachment', {
    'id': fields.String(),
    'name': fields.String(),
    'original_name': fields.String(),
    'file_url': fields.String(),
    'content_type': fields.String(),
    'file_size': fields.Integer(),
    'uploaded_at': fields.String(),
})

discussion_model = api.model('Discussion', {
    'id': fields.String(),
    'title': fields.String(),
    'content': fields.String(),
    'course_id': fields.String(),
    'subject_id': fields.String(),
    'semester': fields.Integer(),
    'attachments': fields.List(fields.Nested(attachment_model)),
    'likes_count': fields.Integer(),
    'reply_count': fields.Integer(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
    'created_by': fields.String(),
    'author_name': fields.String(),
    'author_role': fields.String(),
})

discussion_list_model = api.model('DiscussionList', {
    'success': fields.Boolean(),
    'page': fields.Integer(),
    'limit': fields.Integer(),
    'total': fields.Integer(),
    'discussions': fields.List(fields.Nested(discussion_model)),
})

reply_model = api.model('DiscussionReply', {
    'id': fields.String(),
    'discussion_id': fields.String(),
    'parent_reply_id': fields.String(),
    'content': fields.String(),
    'attachments': fields.List(fields.Nested(attachment_model)),
    'likes_count': fields.Integer(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
    'created_by': fields.String(),
    'author_name': fields.String(),
    'author_role': fields.String(),
    'children': fields.List(fields.Raw),
})

discussion_create_model = api.model('DiscussionCreate', {
    'title': fields.String(required=True),
    'content': fields.String(required=True),
    'course_id': fields.String(),
    'subject_id': fields.String(),
    'semester': fields.Integer(),
})

reply_create_model = api.model('ReplyCreate', {
    'content': fields.String(required=True),
    'parent_reply_id': fields.String(),
})

file_upload_parser = api.parser()
file_upload_parser.add_argument(
    'files',
    location='files',
    type=FileStorage,
    action='append',
    required=False,
)


def _current_user():
    claims = get_jwt()
    return claims.get('user_id'), claims.get('role'), claims.get('name') or claims.get('email')


def _validate_content(data):
    title = (data.get('title') or '').strip()
    content = (data.get('content') or '').strip()
    if not title:
        api.abort(400, 'Title is required.')
    if not content:
        api.abort(400, 'Content is required.')
    return title, content


def _handle_attachments(files):
    attachments = []
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'discussions')
    os.makedirs(upload_folder, exist_ok=True)
    for file_storage in files or []:
        if not file_storage or not file_storage.filename:
            continue
        valid, error = FileHandler.allowed_file(file_storage.filename, file_type='document'), None
        if not valid:
            error = 'Unsupported attachment type. Allowed: pdf, doc, docx, rtf.'
        file_storage.stream.seek(0, os.SEEK_END)
        size_mb = file_storage.tell() / (1024 * 1024)
        file_storage.stream.seek(0)
        if size_mb > 20:
            error = 'Attachment size exceeds 20MB limit.'
        if error:
            api.abort(400, error)
        attachments.append(build_attachment_metadata(file_storage, upload_folder))
    return attachments


@api.route('')
@api.route('/')
class DiscussionList(Resource):
    """List or create discussions."""

    @api.doc(params={
        'page': 'Page number (default 1)',
        'limit': 'Items per page (default 20)',
        'course_id': 'Filter by course id',
        'subject_id': 'Filter by subject id',
        'semester': 'Filter by semester',
        'search': 'Search in title/content',
    })
    @api.marshal_with(discussion_list_model)
    def get(self):
        args = request.args
        db = get_db()
        try:
            page = max(int(args.get('page', 1)), 1)
        except (TypeError, ValueError):
            page = 1

        try:
            limit = min(max(int(args.get('limit', 20)), 1), 100)
        except (TypeError, ValueError):
            limit = 20

        filters = {}
        if args.get('course_id'):
            filters['course_id'] = DiscussionHelper._oid(args['course_id'])
        if args.get('subject_id'):
            filters['subject_id'] = DiscussionHelper._oid(args['subject_id'])
        if args.get('semester'):
            try:
                filters['semester'] = int(args['semester'])
            except ValueError:
                api.abort(400, 'semester must be an integer.')

        filters = {k: v for k, v in filters.items() if v is not None}

        total, discussions = DiscussionHelper.list_discussions(
            db,
            filters=filters,
            page=page,
            limit=limit,
            search=args.get('search')
        )

        return {
            'success': True,
            'page': page,
            'limit': limit,
            'total': total,
            'discussions': [DiscussionHelper.to_dict(item) for item in discussions],
        }

    @api.expect(discussion_create_model, validate=False)
    @api.expect(file_upload_parser)
    @api.marshal_with(discussion_model)
    @jwt_required()
    def post(self):
        if request.content_type and 'multipart/form-data' in request.content_type:
            form = request.form
            files = request.files.getlist('files')
            payload = {
                'title': form.get('title'),
                'content': form.get('content'),
                'course_id': form.get('course_id'),
                'subject_id': form.get('subject_id'),
                'semester': form.get('semester'),
            }
        else:
            payload = request.get_json() or {}
            files = []

        title, content = _validate_content(payload)

        attachments = _handle_attachments(files)
        claims = get_jwt()
        discussion = DiscussionHelper.create_discussion(
            get_db(),
            title=title,
            content=content,
            author_id=claims.get('user_id'),
            author_name=claims.get('name') or claims.get('email'),
            author_role=claims.get('role'),
            course_id=payload.get('course_id'),
            subject_id=payload.get('subject_id'),
            semester=int(payload['semester']) if payload.get('semester') else None,
            attachments=attachments
        )
        return DiscussionHelper.to_dict(discussion), 201


@api.route('/<string:discussion_id>')
class DiscussionDetail(Resource):
    """Retrieve, update, or delete a discussion."""

    @api.marshal_with(discussion_model)
    def get(self, discussion_id):
        discussion = DiscussionHelper.find_by_id(get_db(), discussion_id)
        if not discussion:
            api.abort(404, 'Discussion not found.')
        return DiscussionHelper.to_dict(discussion)

    @api.expect(discussion_create_model)
    @api.marshal_with(discussion_model)
    @jwt_required()
    def put(self, discussion_id):
        data = request.get_json() or {}
        db = get_db()
        current_user_id, role, _ = _current_user()
        discussion = DiscussionHelper.find_by_id(db, discussion_id)
        if not discussion:
            api.abort(404, 'Discussion not found.')
        if str(discussion.get('created_by')) != current_user_id and role not in {'staff', 'admin'}:
            api.abort(403, 'You do not have permission to edit this discussion.')

        update_payload = {}
        if 'title' in data:
            update_payload['title'] = data['title']
        if 'content' in data:
            update_payload['content'] = data['content']
        if 'course_id' in data:
            update_payload['course_id'] = data['course_id']
        if 'subject_id' in data:
            update_payload['subject_id'] = data['subject_id']
        if 'semester' in data:
            update_payload['semester'] = data['semester']

        updated = DiscussionHelper.update_discussion(db, discussion_id, update_payload)
        return DiscussionHelper.to_dict(updated)

    @jwt_required()
    def delete(self, discussion_id):
        db = get_db()
        discussion = DiscussionHelper.find_by_id(db, discussion_id)
        if not discussion:
            api.abort(404, 'Discussion not found.')
        current_user_id, role, _ = _current_user()
        if str(discussion.get('created_by')) != current_user_id and role not in {'staff', 'admin'}:
            api.abort(403, 'You do not have permission to delete this discussion.')

        # remove attachment files
        for attachment in discussion.get('attachments', []):
            path = attachment.get('path')
            if path and path.startswith('/uploads/'):
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path.replace('/uploads/', ''))
                FileHandler.delete_file(file_path)

        success = DiscussionHelper.delete_discussion(db, discussion_id)
        if not success:
            api.abort(404, 'Discussion not found.')
        return {'success': True, 'message': 'Discussion deleted.'}, 200


@api.route('/<string:discussion_id>/replies')
class DiscussionReplies(Resource):
    """List replies for a discussion."""

    @api.marshal_list_with(reply_model)
    def get(self, discussion_id):
        db = get_db()
        if not DiscussionHelper.find_by_id(db, discussion_id):
            api.abort(404, 'Discussion not found.')
        replies = DiscussionReplyHelper.list_by_discussion(db, discussion_id)
        thread = DiscussionReplyHelper.build_thread(replies)
        return thread


@api.route('/<string:discussion_id>/reply')
class DiscussionReplyCreate(Resource):
    """Create a reply for a discussion."""

    @api.expect(reply_create_model, validate=False)
    @api.expect(file_upload_parser)
    @api.marshal_with(reply_model)
    @jwt_required()
    def post(self, discussion_id):
        db = get_db()
        discussion = DiscussionHelper.find_by_id(db, discussion_id)
        if not discussion:
            api.abort(404, 'Discussion not found.')

        if request.content_type and 'multipart/form-data' in request.content_type:
            form = request.form
            files = request.files.getlist('files')
            payload = {
                'content': form.get('content'),
                'parent_reply_id': form.get('parent_reply_id'),
            }
        else:
            payload = request.get_json() or {}
            files = []

        content = (payload.get('content') or '').strip()
        if not content:
            api.abort(400, 'Reply content is required.')

        attachments = _handle_attachments(files)
        user_id, role, name = _current_user()

        reply = DiscussionReplyHelper.create_reply(
            db,
            discussion_id=discussion_id,
            author_id=user_id,
            author_name=name,
            author_role=role,
            content=content,
            parent_reply_id=payload.get('parent_reply_id'),
            attachments=attachments
        )
        return DiscussionReplyHelper.to_dict(reply)


@api.route('/replies/<string:reply_id>')
class ReplyDetail(Resource):
    """Update or delete a reply."""

    @api.expect(reply_create_model)
    @api.marshal_with(reply_model)
    @jwt_required()
    def put(self, reply_id):
        db = get_db()
        reply = DiscussionReplyHelper.find_by_id(db, reply_id)
        if not reply:
            api.abort(404, 'Reply not found.')

        current_user_id, role, _ = _current_user()
        if str(reply.get('created_by')) != current_user_id and role not in {'staff', 'admin'}:
            api.abort(403, 'You do not have permission to edit this reply.')

        data = request.get_json() or {}
        payload = {}
        if 'content' in data:
            payload['content'] = data['content']
        updated = DiscussionReplyHelper.update_reply(db, reply_id, payload)
        return DiscussionReplyHelper.to_dict(updated)

    @jwt_required()
    def delete(self, reply_id):
        db = get_db()
        reply = DiscussionReplyHelper.find_by_id(db, reply_id)
        if not reply:
            api.abort(404, 'Reply not found.')

        current_user_id, role, _ = _current_user()
        if str(reply.get('created_by')) != current_user_id and role not in {'staff', 'admin'}:
            api.abort(403, 'You do not have permission to delete this reply.')

        for attachment in reply.get('attachments', []):
            path = attachment.get('path')
            if path and path.startswith('/uploads/'):
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path.replace('/uploads/', ''))
                FileHandler.delete_file(file_path)

        DiscussionReplyHelper.delete_reply(db, reply_id)
        return {'success': True, 'message': 'Reply deleted.'}, 200


@api.route('/<string:discussion_id>/like')
class DiscussionLike(Resource):
    """Toggle like on a discussion."""

    @jwt_required()
    def post(self, discussion_id):
        db = get_db()
        discussion = DiscussionHelper.find_by_id(db, discussion_id)
        if not discussion:
            api.abort(404, 'Discussion not found.')

        user_id, _, _ = _current_user()
        updated = DiscussionHelper.toggle_like(db, discussion_id, user_id)
        return DiscussionHelper.to_dict(updated, include_internal=True)


@api.route('/replies/<string:reply_id>/like')
class ReplyLike(Resource):
    """Toggle like on a reply."""

    @jwt_required()
    def post(self, reply_id):
        db = get_db()
        reply = DiscussionReplyHelper.find_by_id(db, reply_id)
        if not reply:
            api.abort(404, 'Reply not found.')
        user_id, _, _ = _current_user()
        updated = DiscussionReplyHelper.toggle_like(db, reply_id, user_id)
        return DiscussionReplyHelper.to_dict(updated)
