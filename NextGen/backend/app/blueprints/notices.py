"""Notice management endpoints."""
import os
from datetime import datetime, timezone

from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from werkzeug.datastructures import FileStorage

from app.db import get_db
from app.models.notice import NoticeHelper
from app.utils.decorators import staff_required
from app.utils.file_handler import FileHandler
from app.utils.email import send_notice_email
from app.utils.notification_helpers import (
    get_student_recipients,
    get_staff_recipients,
    combine_recipients,
)

api = Namespace('notices', description='Notice management operations')


notice_attachment_model = api.model('NoticeAttachment', {
    'id': fields.String(description='Attachment identifier'),
    'name': fields.String(description='Attachment display name'),
    'url': fields.String(description='Attachment URL'),
    'uploaded_at': fields.String(description='Upload timestamp (ISO8601)'),
    'type': fields.String(description='Attachment MIME type'),
    'size': fields.Integer(description='Attachment size in bytes'),
})

notice_model = api.model('Notice', {
    'id': fields.String(description='Notice ID'),
    'title': fields.String(description='Notice title'),
    'summary': fields.String(description='Short summary'),
    'content': fields.String(description='Rich text HTML content'),
    'type': fields.String(description='Notice type (news/events/meetings)'),
    'status': fields.String(description='Publication status'),
    'is_featured': fields.Boolean(description='Featured flag'),
    'publish_start': fields.String(description='Publish start datetime (ISO8601)'),
    'publish_end': fields.String(description='Publish end datetime (ISO8601)'),
    'cover_image': fields.String(description='Cover image path'),
    'cover_image_url': fields.String(description='Cover image absolute URL'),
    'attachments': fields.List(fields.Nested(notice_attachment_model)),
    'created_at': fields.String(description='Created timestamp'),
    'updated_at': fields.String(description='Updated timestamp'),
    'created_by': fields.String(description='Creator user ID'),
    'updated_by': fields.String(description='Last modifier user ID'),
})

notice_create_model = api.model('NoticeCreate', {
    'title': fields.String(required=True, description='Notice title'),
    'summary': fields.String(description='Short summary'),
    'content': fields.String(required=True, description='Rich text HTML content'),
    'type': fields.String(required=True, description='Notice type (news/events/meetings)'),
    'status': fields.String(description='Status (draft/published)'),
    'is_featured': fields.Boolean(description='Mark as featured'),
    'publish_start': fields.String(description='Publish start datetime (ISO8601)'),
    'publish_end': fields.String(description='Publish end datetime (ISO8601)'),
})

notice_update_model = api.clone('NoticeUpdate', notice_create_model)

notice_list_model = api.model('NoticeList', {
    'success': fields.Boolean(),
    'count': fields.Integer(),
    'notices': fields.List(fields.Nested(notice_model)),
})

upload_parser = api.parser()
upload_parser.add_argument('file', location='files', type=FileStorage, required=True, help='Image file')


def _parse_bool(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def _parse_iso_datetime(value, field_name):
    if value is None or value == '':
        return None, None

    if isinstance(value, datetime):
        return value.astimezone(timezone.utc), None

    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned.endswith('Z'):
            cleaned = cleaned[:-1] + '+00:00'
        try:
            parsed = datetime.fromisoformat(cleaned)
        except ValueError:
            return None, f'Invalid datetime format for {field_name}. Use ISO 8601.'

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        else:
            parsed = parsed.astimezone(timezone.utc)
        return parsed, None

    return None, f'Invalid datetime value for {field_name}.'


def _get_claims(optional=False):
    try:
        verify_jwt_in_request(optional=optional)
        return get_jwt()
    except Exception:
        return None


def _is_staff_or_admin(claims):
    if not claims:
        return False
    return claims.get('role') in {'staff', 'admin'}


def _notify_notice_publication(db, notice):
    if not notice or notice.get('status') != 'published':
        return

    student_recipients = get_student_recipients(db, fallback_to_all=True)
    staff_recipients = get_staff_recipients(db)
    recipients = combine_recipients(student_recipients, staff_recipients)

    if not recipients:
        current_app.logger.info('No recipients available for notice "%s".', notice.get('title'))
        return

    notice_type = (notice.get('type') or 'Notice').title()
    title = notice.get('title', 'New Notice')

    for recipient in recipients:
        send_notice_email(
            recipient['email'],
            recipient.get('name', 'Chronicle Member'),
            title,
            notice_type,
        )


def _apply_public_filters(filters):
    now = datetime.now(timezone.utc)
    filters.setdefault('status', 'published')
    filters.setdefault('publish_start', {'$lte': now})
    filters.setdefault('$or', [
        {'publish_end': {'$exists': False}},
        {'publish_end': None},
        {'publish_end': {'$gte': now}},
    ])
    return filters


def _serialize_notice(notice):
    return NoticeHelper.to_dict(notice)


@api.route('')
class NoticeList(Resource):
    """List or create notices."""

    @api.doc('list_notices', params={
        'type': 'Filter by notice type (news/events/meetings)',
        'status': 'Filter by status (draft/published) [staff only for draft]',
        'featured': 'Filter featured notices (true/false)',
        'include_drafts': 'Include draft notices (staff only)',
        'include_inactive': 'Include notices outside publish window (staff only)',
        'limit': 'Limit number of results',
    })
    @api.marshal_with(notice_list_model)
    def get(self):
        """Get list of notices."""
        db = get_db()
        args = request.args
        claims = _get_claims(optional=True)
        is_staff = _is_staff_or_admin(claims)

        filters = {}

        notice_type = args.get('type')
        if notice_type:
            notice_type = notice_type.lower()
            if notice_type not in NoticeHelper.ALLOWED_TYPES:
                api.abort(400, 'Invalid notice type. Allowed: news, events, meetings.')
            filters['type'] = notice_type

        status = args.get('status')
        if status:
            status = status.lower()
            if status not in NoticeHelper.ALLOWED_STATUS:
                api.abort(400, 'Invalid status. Allowed: draft, published.')
            if status != 'published' and not is_staff:
                api.abort(403, 'Only staff members can view non-published notices.')
            filters['status'] = status

        featured = args.get('featured')
        if featured is not None:
            filters['is_featured'] = bool(_parse_bool(featured))

        include_drafts = bool(_parse_bool(args.get('include_drafts')))
        include_inactive = bool(_parse_bool(args.get('include_inactive')))

        if include_drafts and not is_staff:
            api.abort(403, 'Only staff members can include draft notices.')
        if include_inactive and not is_staff:
            api.abort(403, 'Only staff members can include inactive notices.')

        if not status and not include_drafts:
            # Default to published notices
            filters.setdefault('status', 'published')

        if not include_inactive:
            filters = _apply_public_filters(filters)

        try:
            limit = int(args.get('limit', 0))
            if limit <= 0:
                limit = None
        except (TypeError, ValueError):
            limit = None

        notices = NoticeHelper.list_notices(
            db,
            filters=filters,
            limit=limit,
            sort=[('publish_start', -1), ('created_at', -1)]
        )

        return {
            'success': True,
            'count': len(notices),
            'notices': [_serialize_notice(notice) for notice in notices]
        }

    @api.expect(notice_create_model)
    @api.marshal_with(notice_model)
    @jwt_required()
    @staff_required
    def post(self):
        """Create a new notice (staff/admin only)."""
        data = request.get_json() or {}
        db = get_db()

        title = (data.get('title') or '').strip()
        content = data.get('content')
        notice_type = (data.get('type') or '').strip().lower()
        status = (data.get('status') or 'draft').strip().lower()

        if not title:
            api.abort(400, 'Title is required.')
        if not content:
            api.abort(400, 'Content is required.')
        if notice_type not in NoticeHelper.ALLOWED_TYPES:
            api.abort(400, 'Invalid notice type. Allowed: news, events, meetings.')
        if status not in NoticeHelper.ALLOWED_STATUS:
            api.abort(400, 'Invalid status. Allowed: draft, published.')

        publish_start, error = _parse_iso_datetime(data.get('publish_start'), 'publish_start')
        if error:
            api.abort(400, error)

        publish_end, error = _parse_iso_datetime(data.get('publish_end'), 'publish_end')
        if error:
            api.abort(400, error)

        if publish_start and publish_end and publish_end < publish_start:
            api.abort(400, 'publish_end must be greater than publish_start.')

        claims = get_jwt()
        created_by = claims.get('user_id')

        notice = NoticeHelper.create_notice(
            db,
            title=title,
            content=content,
            notice_type=notice_type,
            status=status,
            summary=data.get('summary'),
            publish_start=publish_start,
            publish_end=publish_end,
            is_featured=bool(data.get('is_featured')),
            attachments=data.get('attachments') or [],
            created_by=created_by
        )

        _notify_notice_publication(db, notice)

        return _serialize_notice(notice), 201


@api.route('/<string:notice_id>')
class NoticeDetail(Resource):
    """Retrieve, update, or delete a notice."""

    @api.marshal_with(notice_model)
    def get(self, notice_id):
        """Get notice by ID."""
        notice = NoticeHelper.find_by_id(get_db(), notice_id)
        if not notice:
            api.abort(404, 'Notice not found.')

        return _serialize_notice(notice)

    @api.expect(notice_update_model)
    @api.marshal_with(notice_model)
    @jwt_required()
    @staff_required
    def put(self, notice_id):
        """Update an existing notice (staff/admin only)."""
        db = get_db()
        notice = NoticeHelper.find_by_id(db, notice_id)
        if not notice:
            api.abort(404, 'Notice not found.')

        data = request.get_json() or {}
        update_data = {}

        if 'title' in data:
            title = (data.get('title') or '').strip()
            if not title:
                api.abort(400, 'Title cannot be empty.')
            update_data['title'] = title

        if 'summary' in data:
            update_data['summary'] = data.get('summary')

        if 'content' in data:
            content = data.get('content')
            if not content:
                api.abort(400, 'Content cannot be empty.')
            update_data['content'] = content

        if 'type' in data:
            notice_type = (data.get('type') or '').strip().lower()
            if notice_type not in NoticeHelper.ALLOWED_TYPES:
                api.abort(400, 'Invalid notice type. Allowed: news, events, meetings.')
            update_data['type'] = notice_type

        if 'status' in data:
            status = (data.get('status') or '').strip().lower()
            if status not in NoticeHelper.ALLOWED_STATUS:
                api.abort(400, 'Invalid status. Allowed: draft, published.')
            update_data['status'] = status

        if 'is_featured' in data:
            update_data['is_featured'] = bool(data.get('is_featured'))

        if 'publish_start' in data:
            publish_start, error = _parse_iso_datetime(data.get('publish_start'), 'publish_start')
            if error:
                api.abort(400, error)
            update_data['publish_start'] = publish_start

        if 'publish_end' in data:
            publish_end, error = _parse_iso_datetime(data.get('publish_end'), 'publish_end')
            if error:
                api.abort(400, error)
            update_data['publish_end'] = publish_end

        publish_start = update_data.get('publish_start') or notice.get('publish_start')
        publish_end = update_data.get('publish_end') if 'publish_end' in update_data else notice.get('publish_end')
        if publish_start and publish_end and publish_end < publish_start:
            api.abort(400, 'publish_end must be greater than publish_start.')

        claims = get_jwt()
        updated_by = claims.get('user_id')

        updated_notice = NoticeHelper.update_notice(db, notice_id, update_data, updated_by=updated_by)
        if not updated_notice:
            api.abort(404, 'Notice not found.')

        return _serialize_notice(updated_notice)

    @jwt_required()
    @staff_required
    def delete(self, notice_id):
        """Delete a notice (staff/admin only)."""
        db = get_db()
        notice = NoticeHelper.find_by_id(db, notice_id)
        if not notice:
            api.abort(404, 'Notice not found.')

        # Delete cover image if present
        cover_image = notice.get('cover_image')
        if cover_image and cover_image.startswith('/uploads/'):
            upload_folder = current_app.config['UPLOAD_FOLDER']
            filepath = os.path.join(upload_folder, cover_image.replace('/uploads/', ''))
            FileHandler.delete_file(filepath)

        success = NoticeHelper.delete_notice(db, notice_id)
        if not success:
            api.abort(404, 'Notice not found.')

        return {'success': True, 'message': 'Notice deleted successfully.'}, 200


@api.route('/type/<string:notice_type>')
class NoticeByType(Resource):
    """Get notices by type."""

    @api.marshal_with(notice_list_model)
    def get(self, notice_type):
        """List notices filtered by type."""
        notice_type = notice_type.lower()
        if notice_type not in NoticeHelper.ALLOWED_TYPES:
            api.abort(400, 'Invalid notice type. Allowed: news, events, meetings.')

        filters = _apply_public_filters({'type': notice_type})
        notices = NoticeHelper.list_notices(
            get_db(),
            filters=filters,
            sort=[('publish_start', -1), ('created_at', -1)]
        )

        return {
            'success': True,
            'count': len(notices),
            'notices': [_serialize_notice(notice) for notice in notices]
        }


@api.route('/latest')
class NoticeLatest(Resource):
    """Get latest published notices."""

    @api.doc('latest_notices', params={'limit': 'Number of notices to return (default 5)'})
    @api.marshal_with(notice_list_model)
    def get(self):
        """List latest notices."""
        try:
            limit = int(request.args.get('limit', 5))
            if limit <= 0:
                limit = 5
        except (TypeError, ValueError):
            limit = 5

        filters = _apply_public_filters({})
        notices = NoticeHelper.list_notices(
            get_db(),
            filters=filters,
            limit=limit,
            sort=[('publish_start', -1), ('created_at', -1)]
        )

        return {
            'success': True,
            'count': len(notices),
            'notices': [_serialize_notice(notice) for notice in notices]
        }


@api.route('/featured')
class NoticeFeatured(Resource):
    """Get featured notices."""

    @api.doc('featured_notices', params={'limit': 'Number of featured notices (default 5)'})
    @api.marshal_with(notice_list_model)
    def get(self):
        """List featured notices."""
        try:
            limit = int(request.args.get('limit', 5))
            if limit <= 0:
                limit = 5
        except (TypeError, ValueError):
            limit = 5

        filters = _apply_public_filters({'is_featured': True})
        notices = NoticeHelper.list_notices(
            get_db(),
            filters=filters,
            limit=limit,
            sort=[('publish_start', -1), ('created_at', -1)]
        )

        return {
            'success': True,
            'count': len(notices),
            'notices': [_serialize_notice(notice) for notice in notices]
        }


@api.route('/<string:notice_id>/image')
class NoticeImageUpload(Resource):
    """Upload or replace notice cover image."""

    @api.expect(upload_parser)
    @api.marshal_with(notice_model)
    @jwt_required()
    @staff_required
    def post(self, notice_id):
        """Upload a cover image for the notice."""
        db = get_db()
        notice = NoticeHelper.find_by_id(db, notice_id)
        if not notice:
            api.abort(404, 'Notice not found.')

        file = request.files.get('file')
        if not file or not file.filename:
            api.abort(400, 'Image file is required.')

        if not FileHandler.allowed_file(file.filename, file_type='image'):
            api.abort(400, 'Invalid file type. Allowed: png, jpg, jpeg, gif.')

        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'notices')

        # Delete existing image if present
        existing_image = notice.get('cover_image')
        if existing_image and existing_image.startswith('/uploads/'):
            existing_path = os.path.join(current_app.config['UPLOAD_FOLDER'], existing_image.replace('/uploads/', ''))
            FileHandler.delete_file(existing_path)

        try:
            filename = FileHandler.save_image(file, upload_folder, max_size=(1600, 1600))
        except ValueError as exc:
            api.abort(400, str(exc))

        public_path = f"/uploads/notices/{filename}"
        updated_notice = NoticeHelper.set_cover_image(db, notice_id, public_path)
        if not updated_notice:
            api.abort(404, 'Notice not found.')

        return _serialize_notice(updated_notice)
