"""Quiz management and assessment endpoints."""
import random
from datetime import datetime, timezone

from flask import request, current_app
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt

from app.db import get_db
from app.models.quiz import QuizHelper, QuestionHelper, QuizAttemptHelper, evaluate_answers
from app.utils.decorators import staff_required, student_required
from app.utils.email import send_quiz_published_email
from app.utils.notification_helpers import (
    resolve_course_name,
    resolve_subject_name,
    get_student_recipients,
)

api = Namespace('quizzes', description='Quiz management and assessment')


# Models
option_model = api.model('QuizOption', {
    'id': fields.String(description='Option identifier'),
    'text': fields.String(description='Option text'),
})

question_model = api.model('QuizQuestion', {
    'id': fields.String(),
    'quiz_id': fields.String(),
    'text': fields.String(),
    'options': fields.List(fields.Nested(option_model)),
    'correct_option': fields.String(),
    'explanation': fields.String(),
    'points': fields.Float(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
})

quiz_model = api.model('Quiz', {
    'id': fields.String(),
    'title': fields.String(),
    'description': fields.String(),
    'course_id': fields.String(),
    'subject_id': fields.String(),
    'semester': fields.Integer(),
    'duration_minutes': fields.Integer(),
    'total_marks': fields.Float(),
    'status': fields.String(),
    'is_randomized': fields.Boolean(),
    'allow_multiple_attempts': fields.Boolean(),
    'questions_count': fields.Integer(),
    'created_at': fields.String(),
    'updated_at': fields.String(),
    'created_by': fields.String(),
    'updated_by': fields.String(),
})

quiz_list_model = api.model('QuizList', {
    'success': fields.Boolean(),
    'page': fields.Integer(),
    'limit': fields.Integer(),
    'total': fields.Integer(),
    'quizzes': fields.List(fields.Nested(quiz_model)),
})

question_create_model = api.model('QuestionCreate', {
    'text': fields.String(required=True, description='Question text'),
    'options': fields.List(fields.String, required=True, description='Possible answers'),
    'correct_option': fields.String(required=True, description='Correct option text'),
    'explanation': fields.String(description='Explanation for correct answer'),
    'points': fields.Float(description='Points awarded for a correct answer'),
})

quiz_create_model = api.model('QuizCreate', {
    'title': fields.String(required=True),
    'description': fields.String(),
    'course_id': fields.String(),
    'subject_id': fields.String(),
    'semester': fields.Integer(),
    'duration_minutes': fields.Integer(),
    'status': fields.String(default='draft'),
    'is_randomized': fields.Boolean(default=False),
    'allow_multiple_attempts': fields.Boolean(default=False),
})

attempt_question_model = api.model('AttemptQuestion', {
    'id': fields.String(),
    'text': fields.String(),
    'options': fields.List(fields.Nested(option_model)),
    'points': fields.Float(),
})

start_attempt_model = api.model('StartAttempt', {
    'quiz': fields.Nested(quiz_model),
    'attempt_id': fields.String(),
    'expires_at': fields.String(),
    'duration_seconds': fields.Integer(),
    'questions': fields.List(fields.Nested(attempt_question_model)),
})

submit_answer_model = api.model('SubmitAnswer', {
    'question_id': fields.String(required=True),
    'selected_option': fields.String(required=True),
})

attempt_result_model = api.model('AttemptResult', {
    'attempt_id': fields.String(),
    'quiz_id': fields.String(),
    'score': fields.Float(),
    'total_points': fields.Float(),
    'percentage': fields.Float(),
    'answers': fields.List(fields.Raw),
})

analytics_model = api.model('QuizAnalytics', {
    'quiz_id': fields.String(),
    'attempts': fields.Integer(),
    'average_score': fields.Float(),
    'average_percentage': fields.Float(),
    'highest_score': fields.Float(),
    'lowest_score': fields.Float(),
    'median_percentage': fields.Float(),
})


def _get_claims():
    try:
        return get_jwt()
    except Exception:
        return {}


def _notify_quiz_publication(db, quiz):
    """Send notifications when a quiz becomes published."""
    if not quiz or quiz.get('status') != 'published':
        return

    course_name = resolve_course_name(db, quiz.get('course_id'))
    subject_name = resolve_subject_name(db, quiz.get('subject_id'))
    recipients = get_student_recipients(
        db,
        course_name=course_name,
        semester=quiz.get('semester'),
        fallback_to_all=True,
    )
    if not recipients:
        current_app.logger.info(
            'No student recipients found for quiz %s publication email.',
            str(quiz.get('_id')),
        )
        return

    subject_display = subject_name or course_name or 'your course'
    for student in recipients:
        send_quiz_published_email(
            student['email'],
            student.get('name', 'Student'),
            quiz.get('title', 'New Quiz'),
            subject_display,
        )


@api.route('')
@api.route('/')
class QuizList(Resource):
    """Quiz listings."""

    @api.doc(params={
        'page': 'Page number (default 1)',
        'limit': 'Items per page (default 20)',
        'status': 'Filter by status',
        'course_id': 'Filter by course',
        'subject_id': 'Filter by subject',
        'semester': 'Filter by semester',
        'search': 'Search string for quiz title/description',
        'include_drafts': 'Include drafts (staff only)',
    })
    @api.marshal_with(quiz_list_model)
    def get(self):
        args = request.args
        db = get_db()
        claims = _get_claims()
        role = claims.get('role')

        try:
            page = max(int(args.get('page', 1)), 1)
        except (TypeError, ValueError):
            page = 1

        try:
            limit = min(max(int(args.get('limit', 20)), 1), 100)
        except (TypeError, ValueError):
            limit = 20

        filters = {}
        status = args.get('status')
        include_drafts = args.get('include_drafts', 'false').lower() == 'true'

        if status:
            filters['status'] = status.lower()
        elif not include_drafts or role not in {'staff', 'admin'}:
            filters['status'] = 'published'

        course_id = args.get('course_id')
        subject_id = args.get('subject_id')
        semester = args.get('semester')

        if course_id:
            filters['course_id'] = QuizHelper._oid(course_id)
        if subject_id:
            filters['subject_id'] = QuizHelper._oid(subject_id)
        if semester:
            try:
                filters['semester'] = int(semester)
            except ValueError:
                api.abort(400, 'semester must be an integer.')

        filters = {k: v for k, v in filters.items() if v is not None}

        total, items = QuizHelper.list_quizzes(
            db,
            filters=filters,
            page=page,
            limit=limit,
            sort=[('created_at', -1)],
            search=args.get('search')
        )

        return {
            'success': True,
            'page': page,
            'limit': limit,
            'total': total,
            'quizzes': [QuizHelper.to_dict(item) for item in items],
        }

    @api.expect(quiz_create_model)
    @api.marshal_with(quiz_model)
    @jwt_required()
    @staff_required
    def post(self):
        data = request.get_json() or {}
        title = (data.get('title') or '').strip()
        if not title:
            api.abort(400, 'Title is required.')

        duration_minutes = data.get('duration_minutes') or 30
        if duration_minutes <= 0:
            api.abort(400, 'duration_minutes must be greater than zero.')

        claims = get_jwt()

        db = get_db()
        quiz = QuizHelper.create_quiz(
            db,
            title=title,
            description=data.get('description'),
            course_id=data.get('course_id'),
            subject_id=data.get('subject_id'),
            semester=data.get('semester'),
            duration_minutes=duration_minutes,
            status=data.get('status', 'draft'),
            is_randomized=data.get('is_randomized', False),
            allow_multiple_attempts=data.get('allow_multiple_attempts', False),
            created_by=claims.get('user_id')
        )
        _notify_quiz_publication(db, quiz)
        return QuizHelper.to_dict(quiz), 201


@api.route('/<string:quiz_id>')
class QuizDetail(Resource):
    """Quiz detail management."""

    @api.marshal_with(quiz_model)
    def get(self, quiz_id):
        quiz = QuizHelper.find_by_id(get_db(), quiz_id)
        if not quiz:
            api.abort(404, 'Quiz not found.')
        return QuizHelper.to_dict(quiz)

    @api.expect(quiz_create_model)
    @api.marshal_with(quiz_model)
    @jwt_required()
    @staff_required
    def put(self, quiz_id):
        data = request.get_json() or {}
        db = get_db()
        existing = QuizHelper.find_by_id(db, quiz_id)
        if not existing:
            api.abort(404, 'Quiz not found.')

        update_payload = {}
        for field in ['title', 'description', 'course_id', 'subject_id', 'semester',
                      'duration_minutes', 'status', 'is_randomized', 'allow_multiple_attempts']:
            if field in data:
                update_payload[field] = data[field]

        claims = get_jwt()
        try:
            updated = QuizHelper.update_quiz(db, quiz_id, update_payload, claims.get('user_id'))
        except ValueError as exc:
            api.abort(400, str(exc))

        if not updated:
            api.abort(404, 'Quiz not found.')

        if existing.get('status') != 'published' and updated.get('status') == 'published':
            _notify_quiz_publication(db, updated)

        return QuizHelper.to_dict(updated)

    @jwt_required()
    @staff_required
    def delete(self, quiz_id):
        success = QuizHelper.delete_quiz(get_db(), quiz_id)
        if not success:
            api.abort(404, 'Quiz not found.')
        return {'success': True, 'message': 'Quiz deleted successfully.'}, 200


@api.route('/<string:quiz_id>/questions')
class QuizQuestionList(Resource):
    """Manage questions for a quiz."""

    @api.marshal_list_with(question_model)
    @jwt_required()
    def get(self, quiz_id):
        db = get_db()
        quiz = QuizHelper.find_by_id(db, quiz_id)
        if not quiz:
            api.abort(404, 'Quiz not found.')
        questions = QuestionHelper.list_questions(db, quiz_id)
        return [QuestionHelper.to_dict(q) for q in questions]

    @api.expect(question_create_model)
    @api.marshal_with(question_model)
    @jwt_required()
    @staff_required
    def post(self, quiz_id):
        data = request.get_json() or {}
        text = (data.get('text') or '').strip()
        if not text:
            api.abort(400, 'Question text is required.')

        options = data.get('options') or []
        correct_option = data.get('correct_option')

        try:
            question = QuestionHelper.create_question(
                get_db(),
                quiz_id=quiz_id,
                text=text,
                options=options,
                correct_option=correct_option,
                explanation=data.get('explanation'),
                points=data.get('points', 1)
            )
        except ValueError as exc:
            api.abort(400, str(exc))

        return QuestionHelper.to_dict(question), 201


@api.route('/questions/<string:question_id>')
class QuestionDetail(Resource):
    """Modify an individual question."""

    @api.expect(question_create_model)
    @api.marshal_with(question_model)
    @jwt_required()
    @staff_required
    def put(self, question_id):
        data = request.get_json() or {}
        try:
            question = QuestionHelper.update_question(get_db(), question_id, data)
        except ValueError as exc:
            api.abort(400, str(exc))
        if not question:
            api.abort(404, 'Question not found.')
        return QuestionHelper.to_dict(question)

    @jwt_required()
    @staff_required
    def delete(self, question_id):
        success = QuestionHelper.delete_question(get_db(), question_id)
        if not success:
            api.abort(404, 'Question not found.')
        return {'success': True, 'message': 'Question deleted.'}, 200


@api.route('/<string:quiz_id>/start')
class QuizStart(Resource):
    """Begin a quiz attempt for a student."""

    @api.marshal_with(start_attempt_model)
    @jwt_required()
    @student_required
    def get(self, quiz_id):
        db = get_db()
        quiz = QuizHelper.find_by_id(db, quiz_id)
        if not quiz:
            api.abort(404, 'Quiz not found.')
        if quiz.get('status') != 'published':
            api.abort(403, 'Quiz is not available for attempting.')

        questions = QuestionHelper.list_questions(db, quiz_id)
        if not questions:
            api.abort(400, 'Quiz has no questions.')

        question_ids = [str(q['_id']) for q in questions]
        if quiz.get('is_randomized'):
            random.shuffle(question_ids)

        claims = get_jwt()
        attempt = QuizAttemptHelper.start_attempt(
            db,
            quiz_id=quiz_id,
            student_id=claims.get('user_id'),
            question_ids=question_ids,
            duration_minutes=quiz.get('duration_minutes', 30)
        )

        # Prepare questions for delivery
        question_map = {str(q['_id']): q for q in questions}
        ordered_questions = []
        for qid in attempt['question_order']:
            question = question_map.get(str(qid))
            if question:
                ordered_questions.append(QuestionHelper.sanitize_for_attempt(question))

        return {
            'quiz': QuizHelper.to_dict(quiz),
            'attempt_id': str(attempt['_id']),
            'duration_seconds': quiz.get('duration_minutes', 30) * 60,
            'expires_at': attempt['expires_at'].isoformat(),
            'questions': ordered_questions,
        }


@api.route('/<string:quiz_id>/submit')
class QuizSubmit(Resource):
    """Submit a quiz attempt."""

    @api.expect(api.model('SubmitPayload', {
        'attempt_id': fields.String(required=True),
        'answers': fields.List(fields.Nested(submit_answer_model), required=True),
        'time_spent_seconds': fields.Integer(),
    }))
    @api.marshal_with(attempt_result_model)
    @jwt_required()
    @student_required
    def post(self, quiz_id):
        data = request.get_json() or {}
        attempt_id = data.get('attempt_id')
        answers = data.get('answers') or []

        if not attempt_id:
            api.abort(400, 'attempt_id is required.')

        db = get_db()
        attempt = QuizAttemptHelper.find_by_id(db, attempt_id)
        if not attempt or str(attempt['quiz_id']) != quiz_id:
            api.abort(404, 'Attempt not found.')

        if attempt.get('status') == 'completed':
            api.abort(400, 'Attempt already submitted.')

        now = datetime.now(timezone.utc)
        if attempt.get('expires_at') and now > attempt['expires_at']:
            api.abort(400, 'Time limit exceeded for this attempt.')

        questions = QuestionHelper.list_questions(db, quiz_id)
        if not questions:
            api.abort(400, 'Quiz has no questions defined.')

        score, total_points, percentage, feedback = evaluate_answers(questions, answers)

        if data.get('time_spent_seconds') is not None:
            QuizAttemptHelper.record_time_spent(db, attempt_id, data['time_spent_seconds'])

        updated_attempt = QuizAttemptHelper.update_result(
            db,
            attempt_id,
            score=score,
            total_points=total_points,
            answers=feedback,
            submitted_at=now
        )

        return {
            'attempt_id': str(updated_attempt['_id']),
            'quiz_id': str(updated_attempt['quiz_id']),
            'score': updated_attempt.get('score', 0),
            'total_points': updated_attempt.get('total_points', 0),
            'percentage': updated_attempt.get('percentage', 0),
            'answers': feedback,
        }


@api.route('/<string:quiz_id>/results')
class QuizResults(Resource):
    """Fetch attempt results."""

    @api.doc(params={'attempt_id': 'Optional attempt id to fetch a specific result.'})
    @jwt_required()
    def get(self, quiz_id):
        db = get_db()
        claims = get_jwt()
        role = claims.get('role')
        attempt_id = request.args.get('attempt_id')

        if attempt_id:
            attempt = QuizAttemptHelper.find_by_id(db, attempt_id)
            if not attempt or str(attempt['quiz_id']) != quiz_id:
                api.abort(404, 'Attempt not found.')

            if role != 'admin' and str(attempt['student_id']) != claims.get('user_id'):
                api.abort(403, 'Not authorized to view this attempt.')

            quiz = QuizHelper.find_by_id(db, quiz_id)
            return {
                'quiz': QuizHelper.to_dict(quiz),
                'attempt': QuizAttemptHelper.to_dict(attempt, include_answers=True),
            }

        # Otherwise return all attempts for staff/admin
        if role not in {'staff', 'admin'}:
            api.abort(403, 'Not authorized to view quiz results.')

        attempts = QuizAttemptHelper.list_for_quiz(db, quiz_id)
        return {
            'attempts': [QuizAttemptHelper.to_dict(attempt, include_answers=True) for attempt in attempts],
        }


@api.route('/students/quiz-history')
class QuizHistory(Resource):
    """Return quiz attempt history for current student."""

    @jwt_required()
    @student_required
    def get(self):
        claims = get_jwt()
        attempts = QuizAttemptHelper.list_for_student(get_db(), claims.get('user_id'))
        return {
            'attempts': [QuizAttemptHelper.to_dict(attempt) for attempt in attempts]
        }


@api.route('/<string:quiz_id>/analytics')
class QuizAnalytics(Resource):
    """High-level quiz analytics for staff/admin."""

    @api.marshal_with(analytics_model)
    @jwt_required()
    @staff_required
    def get(self, quiz_id):
        db = get_db()
        attempts = QuizAttemptHelper.list_for_quiz(db, quiz_id)
        if not attempts:
            return {
                'quiz_id': quiz_id,
                'attempts': 0,
                'average_score': 0,
                'average_percentage': 0,
                'highest_score': 0,
                'lowest_score': 0,
                'median_percentage': 0,
            }

        scores = [attempt.get('score', 0) for attempt in attempts]
        percentages = [attempt.get('percentage', 0) for attempt in attempts]

        scores_sorted = sorted(percentages)
        mid = len(scores_sorted) // 2
        if len(scores_sorted) % 2 == 0:
            median = (scores_sorted[mid - 1] + scores_sorted[mid]) / 2
        else:
            median = scores_sorted[mid]

        return {
            'quiz_id': quiz_id,
            'attempts': len(attempts),
            'average_score': sum(scores) / len(scores),
            'average_percentage': sum(percentages) / len(percentages),
            'highest_score': max(scores),
            'lowest_score': min(scores),
            'median_percentage': median,
        }


@api.route('/<string:quiz_id>/student-results')
class QuizStudentResults(Resource):
    """List attempts for a quiz with student breakdown."""

    @jwt_required()
    @staff_required
    def get(self, quiz_id):
        attempts = QuizAttemptHelper.list_for_quiz(get_db(), quiz_id)
        return {
            'attempts': [
                {
                    **QuizAttemptHelper.to_dict(attempt),
                    'student_id': str(attempt['student_id']),
                }
                for attempt in attempts
            ]
        }


@api.route('/students/<string:student_id>/quiz-performance')
class StudentQuizPerformance(Resource):
    """Aggregated analytics for a single student."""

    @jwt_required()
    @staff_required
    def get(self, student_id):
        db = get_db()
        attempts = QuizAttemptHelper.list_for_student(db, student_id)
        total_attempts = len(attempts)
        if not total_attempts:
            return {
                'student_id': student_id,
                'attempts': 0,
                'average_score': 0,
                'average_percentage': 0,
                'quizzes_attempted': [],
            }

        average_score = sum(attempt.get('score', 0) for attempt in attempts) / total_attempts
        average_percentage = sum(attempt.get('percentage', 0) for attempt in attempts) / total_attempts

        quizzes_attempted = {}
        for attempt in attempts:
            quiz_id = str(attempt['quiz_id'])
            quizzes_attempted.setdefault(quiz_id, {'attempts': 0, 'best_percentage': 0})
            quizzes_attempted[quiz_id]['attempts'] += 1
            quizzes_attempted[quiz_id]['best_percentage'] = max(
                quizzes_attempted[quiz_id]['best_percentage'],
                attempt.get('percentage', 0)
            )

        return {
            'student_id': student_id,
            'attempts': total_attempts,
            'average_score': average_score,
            'average_percentage': average_percentage,
            'quizzes_attempted': [
                {'quiz_id': quiz_id, **stats}
                for quiz_id, stats in quizzes_attempted.items()
            ],
        }
