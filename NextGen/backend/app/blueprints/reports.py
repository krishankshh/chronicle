"""Reporting endpoints for CSV/PDF generation."""
import os
from datetime import datetime, timezone

from flask import current_app, request, send_file
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from bson import ObjectId

from app.db import get_db
from app.tasks.background import enqueue_report_generation
from app.utils.pdf_generator import generate_student_report_pdf

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


@api.route('/student/<string:student_id>/performance-report')
class StudentPerformanceReport(Resource):
    """Generate PDF performance report for a student."""

    @jwt_required()
    def get(self, student_id):
        _ensure_staff()
        db = get_db()
        try:
            oid = ObjectId(student_id)
        except Exception:
            api.abort(400, 'Invalid student id.')

        student = db.students.find_one({'_id': oid})
        if not student:
            api.abort(404, 'Student not found.')

        quiz_results = list(db.quiz_attempts.aggregate([
            {'$match': {'student_id': oid}},
            {'$lookup': {
                'from': 'quizzes',
                'localField': 'quiz_id',
                'foreignField': '_id',
                'as': 'quiz'
            }},
            {'$unwind': '$quiz'},
            {'$project': {
                'quiz_title': '$quiz.title',
                'score': 1,
                'total_marks': '$quiz.total_marks',
                'percentage': 1,
                'date': '$submitted_at'
            }}
        ]))

        formatted_results = []
        for result in quiz_results:
            submitted_at = result.get('date')
            if isinstance(submitted_at, datetime):
                submitted_str = submitted_at.strftime('%Y-%m-%d')
            else:
                submitted_str = str(submitted_at)
            formatted_results.append({
                'quiz_title': result.get('quiz_title'),
                'score': result.get('score', 0),
                'total_marks': result.get('total_marks', 0),
                'percentage': result.get('percentage', 0),
                'date': submitted_str,
            })

        student_payload = {
            'name': student.get('name'),
            'roll_no': student.get('roll_no'),
            'course': student.get('course'),
            'semester': student.get('semester'),
            'batch': student.get('batch', 'N/A'),
        }

        upload_folder = current_app.config['UPLOAD_FOLDER']
        reports_dir = os.path.join(upload_folder, 'reports')
        os.makedirs(reports_dir, exist_ok=True)

        pdf_filename = f"report_{student_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
        pdf_path = os.path.join(reports_dir, pdf_filename)

        generate_student_report_pdf(student_payload, formatted_results, None, pdf_path)

        return send_file(pdf_path, as_attachment=True, download_name=pdf_filename)
