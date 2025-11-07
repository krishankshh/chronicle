"""Reporting endpoints for CSV/PDF generation."""
from datetime import datetime, timezone

from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt

from app.db import get_db
from app.tasks.background import enqueue_report_generation

api = Namespace('reports', description='Reporting and export endpoints')


def _serialize_dt(value):
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return None


def _ensure_staff():
    claims = get_jwt()
    role = claims.get('role')
    if role not in {'staff', 'admin'}:
        api.abort(403, 'Staff or admin access required.')
    return role


report_model = api.model('ReportResponse', {
    'generated_at': fields.String(),
    'records': fields.Integer(),
    'rows': fields.List(fields.Raw()),
    'queued': fields.Boolean(),
    'message': fields.String(),
})


@api.route('/students')
class StudentReport(Resource):
    """Export student roster data."""

    @api.marshal_with(report_model)
    @jwt_required()
    def get(self):
        _ensure_staff()
        async_mode = request.args.get('async') == 'true'
        if async_mode:
            enqueue_report_generation('students', request.args.to_dict())
            return {
                'generated_at': _serialize_dt(datetime.now(timezone.utc)),
                'records': 0,
                'rows': [],
                'queued': True,
                'message': 'Student report queued for background generation.',
            }, 202

        db = get_db()
        projection = {
            '_id': 1,
            'roll_no': 1,
            'name': 1,
            'email': 1,
            'course': 1,
            'semester': 1,
            'batch': 1,
            'created_at': 1,
        }
        rows = []
        for student in db.students.find({}, projection).sort('created_at', -1):
            rows.append({
                'id': str(student['_id']),
                'roll_no': student.get('roll_no'),
                'name': student.get('name'),
                'email': student.get('email'),
                'course': student.get('course'),
                'semester': student.get('semester'),
                'batch': student.get('batch'),
                'created_at': _serialize_dt(student.get('created_at')),
            })
        return {
            'generated_at': _serialize_dt(datetime.now(timezone.utc)),
            'records': len(rows),
            'rows': rows,
            'queued': False,
            'message': 'Student roster generated.',
        }


@api.route('/quizzes')
class QuizReport(Resource):
    """Export quiz performance summary."""

    @api.marshal_with(report_model)
    @jwt_required()
    def get(self):
        _ensure_staff()
        db = get_db()
        rows = []
        projection = {
            '_id': 1,
            'title': 1,
            'course_id': 1,
            'subject_id': 1,
            'status': 1,
            'created_at': 1,
            'updated_at': 1,
        }
        quizzes = db.quizzes.find({}, projection).sort('created_at', -1)
        for quiz in quizzes:
            attempt_count = db.quiz_attempts.count_documents({'quiz_id': quiz['_id']})
            rows.append({
                'id': str(quiz['_id']),
                'title': quiz.get('title'),
                'course_id': str(quiz.get('course_id')) if quiz.get('course_id') else None,
                'subject_id': str(quiz.get('subject_id')) if quiz.get('subject_id') else None,
                'status': quiz.get('status'),
                'attempts': attempt_count,
                'created_at': _serialize_dt(quiz.get('created_at')),
                'updated_at': _serialize_dt(quiz.get('updated_at')),
            })
        return {
            'generated_at': _serialize_dt(datetime.now(timezone.utc)),
            'records': len(rows),
            'rows': rows,
            'queued': False,
            'message': 'Quiz report ready.',
        }


@api.route('/discussions')
class DiscussionReport(Resource):
    """Export discussion participation metrics."""

    @api.marshal_with(report_model)
    @jwt_required()
    def get(self):
        _ensure_staff()
        db = get_db()
        rows = []
        projection = {
            '_id': 1,
            'title': 1,
            'course_id': 1,
            'subject_id': 1,
            'reply_count': 1,
            'likes_count': 1,
            'created_at': 1,
            'updated_at': 1,
        }
        discussions = db.discussions.find({}, projection).sort('updated_at', -1)
        for discussion in discussions:
            rows.append({
                'id': str(discussion['_id']),
                'title': discussion.get('title'),
                'course_id': str(discussion.get('course_id')) if discussion.get('course_id') else None,
                'subject_id': str(discussion.get('subject_id')) if discussion.get('subject_id') else None,
                'reply_count': discussion.get('reply_count', 0),
                'likes_count': discussion.get('likes_count', 0),
                'created_at': _serialize_dt(discussion.get('created_at')),
                'updated_at': _serialize_dt(discussion.get('updated_at')),
            })
        return {
            'generated_at': _serialize_dt(datetime.now(timezone.utc)),
            'records': len(rows),
            'rows': rows,
            'queued': False,
            'message': 'Discussion report ready.',
        }
