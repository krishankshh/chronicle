"""Chat REST endpoints."""
import json
import os
from datetime import datetime, timezone

from bson import ObjectId
from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.datastructures import FileStorage

from app.db import get_db
from app.extensions import socketio
from app.models import (
    ChatSessionHelper,
    GroupChatHelper,
    ChatMessageHelper,
    save_chat_attachment,
)
from app.utils.file_handler import FileHandler

api = Namespace('chats', description='Chat and messaging operations')


def _user_claims():
    claims = get_jwt()
    return claims.get('user_id'), claims.get('name') or claims.get('email'), claims.get('role')


def _chat_upload_folder():
    base = current_app.config['UPLOAD_FOLDER']
    folder = os.path.join(base, 'chat')
    os.makedirs(folder, exist_ok=True)
    return folder


def _oid(value):
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(value)
    except Exception:
        return None


def _chat_room(chat_id):
    return f'chat:{chat_id}'


def _group_room(group_id):
    return f'group:{group_id}'


def _parse_meta(meta):
    if isinstance(meta, dict):
        return meta
    if isinstance(meta, str) and meta:
        try:
            return json.loads(meta)
        except json.JSONDecodeError:
            return {}
    return {}


attachment_model = api.model('ChatAttachment', {
    'id': fields.String(),
    'name': fields.String(),
    'original_name': fields.String(),
    'file_url': fields.String(),
    'content_type': fields.String(),
    'file_size': fields.Integer(),
    'uploaded_at': fields.String(),
})

message_model = api.model('ChatMessage', {
    'id': fields.String(),
    'chat_id': fields.String(),
    'group_id': fields.String(),
    'sender_id': fields.String(),
    'content': fields.String(),
    'attachments': fields.List(fields.Nested(attachment_model)),
    'message_type': fields.String(),
    'meta': fields.Raw(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
    'read_by': fields.List(fields.String()),
})

chat_session_model = api.model('ChatSession', {
    'id': fields.String(),
    'participants': fields.List(fields.String()),
    'participant_meta': fields.List(fields.Raw()),
    'last_message': fields.Raw(),
    'last_message_at': fields.String(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
})

group_chat_model = api.model('GroupChat', {
    'id': fields.String(),
    'name': fields.String(),
    'description': fields.String(),
    'course_id': fields.String(),
    'subject_id': fields.String(),
    'semester': fields.Integer(),
    'member_ids': fields.List(fields.String()),
    'admins': fields.List(fields.String()),
    'last_message': fields.Raw(),
    'last_message_at': fields.String(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
})

message_create_model = api.model('MessageCreate', {
    'content': fields.String(),
    'message_type': fields.String(default='text'),
    'meta': fields.Raw(default={}),
})

chat_start_model = api.model('ChatStart', {
    'participant_id': fields.String(required=True),
    'participant_meta': fields.List(fields.Raw()),
})

group_create_model = api.model('GroupCreate', {
    'name': fields.String(required=True),
    'description': fields.String(),
    'member_ids': fields.List(fields.String, required=True),
    'course_id': fields.String(),
    'subject_id': fields.String(),
    'semester': fields.Integer(),
})

file_upload_parser = api.parser()
file_upload_parser.add_argument(
    'files',
    location='files',
    type=FileStorage,
    action='append',
    required=False,
)


def _handle_attachments(files):
    attachments = []
    upload_folder = _chat_upload_folder()
    for file_storage in files or []:
        if not file_storage or not file_storage.filename:
            continue
        if not FileHandler.allowed_file(file_storage.filename, file_type='document') and \
           not FileHandler.allowed_file(file_storage.filename, file_type='image'):
            api.abort(400, 'Unsupported file type. Allowed: images, pdf, doc, docx, rtf.')
        file_storage.stream.seek(0, os.SEEK_END)
        size_mb = file_storage.tell() / (1024 * 1024)
        file_storage.stream.seek(0)
        if size_mb > 25:
            api.abort(400, 'Attachment exceeds 25MB limit.')
        attachments.append(save_chat_attachment(file_storage, upload_folder))
    return attachments


@api.route('')
class ChatList(Resource):
    """List chat sessions for current user."""

    @api.marshal_list_with(chat_session_model)
    @jwt_required()
    def get(self):
        user_id, _, _ = _user_claims()
        sessions = ChatSessionHelper.list_for_user(get_db(), user_id)
        return [ChatSessionHelper.to_dict(session) for session in sessions]


@api.route('/participants')
class ChatParticipants(Resource):
    """Search participants (students/staff) for chat."""

    @jwt_required()
    def get(self):
        args = request.args
        search = (args.get('search') or '').strip()
        try:
            limit = int(args.get('limit', 10))
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, 20))

        regex = {'$regex': search, '$options': 'i'} if search else None

        db = get_db()
        participants = {}

        student_query = {}
        if regex:
            student_query['$or'] = [{'name': regex}, {'email': regex}]
        students = list(
            db.students.find(student_query, {'name': 1, 'email': 1, 'course': 1, 'semester': 1})
            .limit(limit)
        )
        for student in students:
            sid = str(student['_id'])
            participants[f'student:{sid}'] = {
                'id': sid,
                'name': student.get('name'),
                'email': student.get('email'),
                'role': 'student',
                'course': student.get('course'),
                'semester': student.get('semester'),
            }

        user_query = {}
        if regex:
            user_query['$or'] = [{'name': regex}, {'email': regex}, {'login_id': regex}]
        users = list(
            db.users.find(user_query, {'name': 1, 'email': 1, 'user_type': 1, 'login_id': 1})
            .limit(limit)
        )
        for user in users:
            uid = str(user['_id'])
            participants[f'staff:{uid}'] = {
                'id': uid,
                'name': user.get('name') or user.get('login_id'),
                'email': user.get('email'),
                'role': user.get('user_type') or 'staff',
            }

        return {'participants': list(participants.values())}


@api.route('/start')
class ChatStart(Resource):
    """Start or fetch a chat session."""

    @api.expect(chat_start_model)
    @api.marshal_with(chat_session_model)
    @jwt_required()
    def post(self):
        data = request.get_json() or {}
        participant_id = data.get('participant_id')
        if not participant_id:
            api.abort(400, 'participant_id is required.')
        user_id, name, role = _user_claims()
        participant_meta = data.get('participant_meta') or [
            {'user_id': user_id, 'name': name, 'role': role},
        ]
        session = ChatSessionHelper.find_or_create(
            get_db(),
            user_id,
            participant_id,
            participant_meta=participant_meta,
        )
        return ChatSessionHelper.to_dict(session), 201


@api.route('/<string:chat_id>')
class ChatDetail(Resource):
    """Retrieve or delete a chat session."""

    @api.marshal_with(chat_session_model)
    @jwt_required()
    def get(self, chat_id):
        session = ChatSessionHelper.find_by_id(get_db(), chat_id)
        if not session:
            api.abort(404, 'Chat not found.')
        user_id, _, _ = _user_claims()
        if _oid(user_id) not in session.get('participants', []):
            api.abort(403, 'You are not a participant of this chat.')
        return ChatSessionHelper.to_dict(session)

    @jwt_required()
    def delete(self, chat_id):
        user_id, _, _ = _user_claims()
        session = ChatSessionHelper.find_by_id(get_db(), chat_id)
        if not session:
            api.abort(404, 'Chat not found.')
        if _oid(user_id) not in session.get('participants', []):
            api.abort(403, 'You are not a participant of this chat.')
        ChatSessionHelper.delete(get_db(), chat_id)
        return {'success': True, 'message': 'Chat deleted.'}, 200


@api.route('/<string:chat_id>/messages')
class ChatMessages(Resource):
    """Fetch or send messages for a chat session."""

    @api.doc(params={'limit': 'Number of messages to return (default 50)'})
    @api.marshal_list_with(message_model)
    @jwt_required()
    def get(self, chat_id):
        user_id, _, _ = _user_claims()
        session = ChatSessionHelper.find_by_id(get_db(), chat_id)
        if not session:
            api.abort(404, 'Chat not found.')
        if _oid(user_id) not in session.get('participants', []):
            api.abort(403, 'You are not a participant of this chat.')

        try:
            limit = int(request.args.get('limit', 50))
        except (TypeError, ValueError):
            limit = 50
        limit = max(1, min(limit, 200))

        before_param = request.args.get('before')
        before_dt = None
        if before_param:
            try:
                before_dt = datetime.fromisoformat(before_param.replace('Z', '+00:00'))
            except ValueError:
                api.abort(400, 'Invalid before timestamp.')

        search = request.args.get('search')

        messages = ChatMessageHelper.list_messages(
            get_db(),
            chat_id=chat_id,
            limit=limit,
            before=before_dt,
            search=search,
        )
        return [ChatMessageHelper.to_dict(msg) for msg in messages]

    @api.expect(message_create_model, validate=False)
    @api.expect(file_upload_parser)
    @api.marshal_with(message_model)
    @jwt_required()
    def post(self, chat_id):
        session = ChatSessionHelper.find_by_id(get_db(), chat_id)
        if not session:
            api.abort(404, 'Chat not found.')

        user_id, name, role = _user_claims()
        if _oid(user_id) not in session.get('participants', []):
            api.abort(403, 'You are not a participant of this chat.')

        if request.content_type and 'multipart/form-data' in request.content_type:
            payload = request.form
            files = request.files.getlist('files')
        else:
            payload = request.get_json() or {}
            files = []

        attachments = _handle_attachments(files)
        meta = _parse_meta(payload.get('meta'))

        message = ChatMessageHelper.create_message(
            get_db(),
            sender_id=user_id,
            content=payload.get('content'),
            attachments=attachments,
            chat_id=chat_id,
            message_type=payload.get('message_type', 'text'),
            meta=meta or {'author': {'name': name, 'role': role}},
        )
        ChatSessionHelper.update_last_message(
            get_db(),
            chat_id,
            {
                'content': message.get('content'),
                'message_type': message.get('message_type'),
                'created_at': message.get('created_at'),
            }
        )
        message_payload = ChatMessageHelper.to_dict(message)
        socketio.emit('message_received', {**message_payload, 'room': _chat_room(chat_id)}, room=_chat_room(chat_id))
        return message_payload, 201


@api.route('/group-chats')
class GroupChatList(Resource):
    """List or create group chats."""

    @api.marshal_list_with(group_chat_model)
    @jwt_required()
    def get(self):
        user_id, _, _ = _user_claims()
        groups = GroupChatHelper.list_for_user(get_db(), user_id)
        return [GroupChatHelper.to_dict(group) for group in groups]

    @api.expect(group_create_model)
    @api.marshal_with(group_chat_model)
    @jwt_required()
    def post(self):
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            api.abort(400, 'Group name is required.')
        member_ids = data.get('member_ids') or []
        member_meta = data.get('member_meta') or []
        user_id, _, _ = _user_claims()
        group = GroupChatHelper.create_group(
            get_db(),
            name=name,
            created_by=user_id,
            member_ids=member_ids,
            description=data.get('description'),
            course_id=data.get('course_id'),
            subject_id=data.get('subject_id'),
            semester=data.get('semester'),
            member_meta=member_meta,
        )
        return GroupChatHelper.to_dict(group), 201


@api.route('/group-chats/<string:group_id>')
class GroupChatDetail(Resource):
    """Retrieve or delete a group chat."""

    @api.marshal_with(group_chat_model)
    @jwt_required()
    def get(self, group_id):
        group = GroupChatHelper.find_by_id(get_db(), group_id)
        if not group:
            api.abort(404, 'Group chat not found.')
        return GroupChatHelper.to_dict(group)

    @jwt_required()
    def delete(self, group_id):
        user_id, _, _ = _user_claims()
        group = GroupChatHelper.find_by_id(get_db(), group_id)
        if not group:
            api.abort(404, 'Group chat not found.')
        if _oid(user_id) not in group.get('admins', []):
            api.abort(403, 'Only group admins can delete the group.')
        GroupChatHelper.delete(get_db(), group_id)
        return {'success': True, 'message': 'Group chat deleted.'}, 200


@api.route('/group-chats/<string:group_id>/messages')
class GroupChatMessages(Resource):
    """Fetch or send messages in a group chat."""

    @api.doc(params={'limit': 'Number of messages to return (default 50)'})
    @api.marshal_list_with(message_model)
    @jwt_required()
    def get(self, group_id):
        group = GroupChatHelper.find_by_id(get_db(), group_id)
        if not group:
            api.abort(404, 'Group chat not found.')
        user_id, _, _ = _user_claims()
        if _oid(user_id) not in group.get('member_ids', []):
            api.abort(403, 'You are not a member of this group.')

        try:
            limit = int(request.args.get('limit', 50))
        except (TypeError, ValueError):
            limit = 50
        limit = max(1, min(limit, 200))

        before_param = request.args.get('before')
        before_dt = None
        if before_param:
            try:
                before_dt = datetime.fromisoformat(before_param.replace('Z', '+00:00'))
            except ValueError:
                api.abort(400, 'Invalid before timestamp.')

        search = request.args.get('search')

        messages = ChatMessageHelper.list_messages(
            get_db(),
            group_id=group_id,
            limit=limit,
            before=before_dt,
            search=search,
        )
        return [ChatMessageHelper.to_dict(msg) for msg in messages]

    @api.expect(message_create_model, validate=False)
    @api.expect(file_upload_parser)
    @api.marshal_with(message_model)
    @jwt_required()
    def post(self, group_id):
        group = GroupChatHelper.find_by_id(get_db(), group_id)
        if not group:
            api.abort(404, 'Group chat not found.')

        user_id, name, role = _user_claims()
        if _oid(user_id) not in group.get('member_ids', []):
            api.abort(403, 'You are not a member of this group.')

        if request.content_type and 'multipart/form-data' in request.content_type:
            payload = request.form
            files = request.files.getlist('files')
        else:
            payload = request.get_json() or {}
            files = []

        attachments = _handle_attachments(files)
        meta = _parse_meta(payload.get('meta'))
        message = ChatMessageHelper.create_message(
            get_db(),
            sender_id=user_id,
            content=payload.get('content'),
            attachments=attachments,
            group_id=group_id,
            message_type=payload.get('message_type', 'text'),
            meta=meta or {'author': {'name': name, 'role': role}},
        )
        GroupChatHelper.update_last_message(
            get_db(),
            group_id,
            {
                'content': message.get('content'),
                'message_type': message.get('message_type'),
                'created_at': message.get('created_at'),
            }
        )
        message_payload = ChatMessageHelper.to_dict(message)
        socketio.emit('message_received', {**message_payload, 'room': _group_room(group_id)}, room=_group_room(group_id))
        return message_payload, 201
