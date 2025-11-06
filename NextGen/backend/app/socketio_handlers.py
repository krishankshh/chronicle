"""Socket.IO event registrations for chat."""
import os
from collections import defaultdict

from flask import request, current_app
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room

from app.db import get_db
from app.models import ChatMessageHelper, ChatSessionHelper, GroupChatHelper

connected_users = {}
user_rooms = defaultdict(set)


def _authenticate_socket(token):
    if not token:
        return None, None
    try:
        decoded = decode_token(token, allow_expired=False)
    except Exception:
        return None, None
    identity = decoded.get('sub')
    claims = decoded.get('claims') or {}
    return identity, claims


def _room_for_chat(chat_id):
    return f'chat:{chat_id}'


def _room_for_group(group_id):
    return f'group:{group_id}'


def register_socketio_events(socketio):
    """Register Socket.IO event handlers."""

    @socketio.on('connect')
    def handle_connect():
        token = request.args.get('token')
        user_id, claims = _authenticate_socket(token)
        if not user_id:
            return False  # disconnect
        connected_users[request.sid] = {'user_id': user_id, 'claims': claims}
        online_user_ids = [session['user_id'] for session in connected_users.values()]
        emit('connected', {'user_id': user_id, 'online_users': online_user_ids})
        emit('status', {'event': 'online', 'user_id': user_id}, broadcast=True, include_self=False)

    @socketio.on('disconnect')
    def handle_disconnect():
        session = connected_users.pop(request.sid, None)
        if not session:
            return
        uid = session['user_id']
        if uid in user_rooms:
            for room in list(user_rooms[uid]):
                leave_room(room)
            user_rooms.pop(uid, None)
        emit('status', {'event': 'offline', 'user_id': uid}, broadcast=True)

    @socketio.on('join_chat')
    def handle_join_chat(data):
        session = connected_users.get(request.sid)
        if not session:
            return
        chat_id = data.get('chat_id')
        if not chat_id:
            return
        join_room(_room_for_chat(chat_id))
        user_rooms[session['user_id']].add(_room_for_chat(chat_id))
        emit('joined_chat', {'chat_id': chat_id})

    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        session = connected_users.get(request.sid)
        if not session:
            return
        chat_id = data.get('chat_id')
        if not chat_id:
            return
        leave_room(_room_for_chat(chat_id))
        user_rooms[session['user_id']].discard(_room_for_chat(chat_id))
        emit('left_chat', {'chat_id': chat_id})

    @socketio.on('join_group')
    def handle_join_group(data):
        session = connected_users.get(request.sid)
        if not session:
            return
        group_id = data.get('group_id')
        if not group_id:
            return
        join_room(_room_for_group(group_id))
        user_rooms[session['user_id']].add(_room_for_group(group_id))
        emit('joined_group', {'group_id': group_id})

    @socketio.on('leave_group')
    def handle_leave_group(data):
        session = connected_users.get(request.sid)
        if not session:
            return
        group_id = data.get('group_id')
        if not group_id:
            return
        leave_room(_room_for_group(group_id))
        user_rooms[session['user_id']].discard(_room_for_group(group_id))
        emit('left_group', {'group_id': group_id})

    @socketio.on('typing_indicator')
    def handle_typing_indicator(data):
        session = connected_users.get(request.sid)
        if not session:
            return
        room = data.get('room')
        emit('typing_indicator', {
            'room': room,
            'user_id': session['user_id'],
            'is_typing': data.get('is_typing', False),
        }, room=room, include_self=False)

    @socketio.on('send_message')
    def handle_send_message(data):
        session = connected_users.get(request.sid)
        if not session:
            return

        user_id = session['user_id']
        content = data.get('content')
        chat_id = data.get('chat_id')
        group_id = data.get('group_id')
        message_type = data.get('message_type', 'text')
        meta = data.get('meta') or {}

        if not chat_id and not group_id:
            emit('error', {'message': 'chat_id or group_id is required'})
            return

        attachments = []
        files = data.get('files') or []
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'chat')
        os.makedirs(upload_folder, exist_ok=True)
        for file_data in files:
            # Expecting the frontend to upload via REST; sockets receive metadata only
            attachments.append(file_data)

        message = ChatMessageHelper.create_message(
            get_db(),
            sender_id=user_id,
            content=content,
            attachments=attachments,
            chat_id=chat_id,
            group_id=group_id,
            message_type=message_type,
            meta=meta
        )

        message_payload = ChatMessageHelper.to_dict(message)
        if chat_id:
            ChatSessionHelper.update_last_message(
                get_db(),
                chat_id,
                {
                    'content': message.get('content'),
                    'message_type': message.get('message_type'),
                    'created_at': message.get('created_at'),
                }
            )
            room = _room_for_chat(chat_id)
        else:
            GroupChatHelper.update_last_message(
                get_db(),
                group_id,
                {
                    'content': message.get('content'),
                    'message_type': message.get('message_type'),
                    'created_at': message.get('created_at'),
                }
            )
            room = _room_for_group(group_id)

        message_payload['room'] = room
        emit('message_received', message_payload, room=room)

    @socketio.on('read_receipt')
    def handle_read_receipt(data):
        session = connected_users.get(request.sid)
        if not session:
            return
        message_ids = data.get('message_ids') or []
        if not message_ids:
            return
        ChatMessageHelper.mark_read(get_db(), message_ids, session['user_id'])
        emit('read_receipt', {
            'message_ids': message_ids,
            'user_id': session['user_id'],
        }, room=data.get('room'), include_self=False)
