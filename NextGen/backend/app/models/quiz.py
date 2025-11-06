"""Quiz, question, and attempt helpers for MongoDB."""
import random
import uuid
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId


class QuizHelper:
    """Helper methods for the quizzes collection."""

    STATUSES = {'draft', 'published'}

    @staticmethod
    def _collection(db):
        return db.quizzes

    @staticmethod
    def _questions_collection(db):
        return db.questions

    @staticmethod
    def _attempts_collection(db):
        return db.quiz_attempts

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @staticmethod
    def _oid(value):
        if not value:
            return None
        if isinstance(value, ObjectId):
            return value
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @classmethod
    def create_quiz(cls, db, title, description=None, course_id=None, subject_id=None,
                    semester=None, duration_minutes=30, total_marks=0, status='draft',
                    is_randomized=False, allow_multiple_attempts=False, created_by=None):
        """Create a new quiz document."""
        status = (status or 'draft').lower()
        if status not in cls.STATUSES:
            raise ValueError('Invalid status. Expected draft or published.')

        now = cls._now()
        quiz = {
            'title': title,
            'description': description,
            'course_id': cls._oid(course_id),
            'subject_id': cls._oid(subject_id),
            'semester': semester,
            'duration_minutes': duration_minutes,
            'total_marks': total_marks,
            'status': status,
            'is_randomized': bool(is_randomized),
            'allow_multiple_attempts': bool(allow_multiple_attempts),
            'questions_count': 0,
            'created_at': now,
            'updated_at': now,
            'created_by': cls._oid(created_by),
            'updated_by': cls._oid(created_by),
        }

        result = cls._collection(db).insert_one(quiz)
        quiz['_id'] = result.inserted_id
        return quiz

    @classmethod
    def update_quiz(cls, db, quiz_id, update_data, updated_by=None):
        """Update quiz metadata."""
        oid = cls._oid(quiz_id)
        if oid is None:
            return None

        payload = update_data.copy()
        if 'course_id' in payload:
            payload['course_id'] = cls._oid(payload.get('course_id'))
        if 'subject_id' in payload:
            payload['subject_id'] = cls._oid(payload.get('subject_id'))

        if 'status' in payload:
            status = payload['status'].lower()
            if status not in cls.STATUSES:
                raise ValueError('Invalid status. Expected draft or published.')
            payload['status'] = status

        payload['updated_at'] = cls._now()
        if updated_by:
            payload['updated_by'] = cls._oid(updated_by)

        cls._collection(db).update_one({'_id': oid}, {'$set': payload})
        return cls.find_by_id(db, oid)

    @classmethod
    def find_by_id(cls, db, quiz_id):
        """Return a quiz by id."""
        oid = cls._oid(quiz_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def delete_quiz(cls, db, quiz_id):
        """Remove quiz and associated questions."""
        oid = cls._oid(quiz_id)
        if oid is None:
            return False
        cls._questions_collection(db).delete_many({'quiz_id': oid})
        cls._attempts_collection(db).delete_many({'quiz_id': oid})
        result = cls._collection(db).delete_one({'_id': oid})
        return result.deleted_count > 0

    @classmethod
    def list_quizzes(cls, db, filters=None, page=1, limit=20, sort=None, search=None):
        """Return paginated quizzes."""
        collection = cls._collection(db)
        query = filters.copy() if filters else {}

        if search:
            regex = {'$regex': search, '$options': 'i'}
            query['$or'] = [{'title': regex}, {'description': regex}]

        skip = max(page - 1, 0) * limit
        cursor = collection.find(query)
        if sort:
            cursor = cursor.sort(sort)

        total = collection.count_documents(query)
        items = list(cursor.skip(skip).limit(limit))
        return total, items

    @classmethod
    def recalc_question_count(cls, db, quiz_id):
        """Recalculate the questions_count and total_marks for the quiz."""
        oid = cls._oid(quiz_id)
        if oid is None:
            return
        questions = list(cls._questions_collection(db).find({'quiz_id': oid}))
        total_points = sum(q.get('points', 1) for q in questions)
        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$set': {
                    'questions_count': len(questions),
                    'total_marks': total_points,
                    'updated_at': cls._now()
                }
            }
        )

    @staticmethod
    def _serialize_datetime(value):
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat()
        return None

    @classmethod
    def to_dict(cls, quiz):
        """Serialize quiz document."""
        if not quiz:
            return None
        return {
            'id': str(quiz['_id']),
            'title': quiz.get('title'),
            'description': quiz.get('description'),
            'course_id': str(quiz.get('course_id')) if quiz.get('course_id') else None,
            'subject_id': str(quiz.get('subject_id')) if quiz.get('subject_id') else None,
            'semester': quiz.get('semester'),
            'duration_minutes': quiz.get('duration_minutes'),
            'total_marks': quiz.get('total_marks', 0),
            'status': quiz.get('status'),
            'is_randomized': quiz.get('is_randomized', False),
            'allow_multiple_attempts': quiz.get('allow_multiple_attempts', False),
            'questions_count': quiz.get('questions_count', 0),
            'created_at': cls._serialize_datetime(quiz.get('created_at')),
            'updated_at': cls._serialize_datetime(quiz.get('updated_at')),
            'created_by': str(quiz.get('created_by')) if quiz.get('created_by') else None,
            'updated_by': str(quiz.get('updated_by')) if quiz.get('updated_by') else None,
        }


class QuestionHelper:
    """Helper methods for quiz questions."""

    @staticmethod
    def _collection(db):
        return db.questions

    @staticmethod
    def _oid(value):
        if not value:
            return None
        if isinstance(value, ObjectId):
            return value
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @classmethod
    def create_question(cls, db, quiz_id, text, options, correct_option,
                        explanation=None, points=1):
        if not options or len(options) < 2:
            raise ValueError('A question requires at least two options.')

        if correct_option not in options:
            raise ValueError('Correct option must be one of the options.')

        oid = cls._oid(quiz_id)
        if oid is None:
            raise ValueError('Invalid quiz id.')

        now = datetime.now(timezone.utc)
        question = {
            'quiz_id': oid,
            'text': text,
            'options': [{'id': str(uuid.uuid4()), 'text': option} for option in options],
            'correct_text': correct_option,
            'explanation': explanation,
            'points': points,
            'created_at': now,
            'updated_at': now,
        }

        # Map correct_text to the generated option id
        correct_option_entry = next(opt for opt in question['options'] if opt['text'] == correct_option)
        question['correct_option'] = correct_option_entry['id']

        result = cls._collection(db).insert_one(question)
        question['_id'] = result.inserted_id

        QuizHelper.recalc_question_count(db, oid)
        return question

    @classmethod
    def update_question(cls, db, question_id, data):
        oid = cls._oid(question_id)
        if oid is None:
            return None

        existing = cls._collection(db).find_one({'_id': oid})
        if not existing:
            return None

        update_data = data.copy()
        if 'options' in update_data:
            options = update_data['options']
            if not options or len(options) < 2:
                raise ValueError('A question requires at least two options.')
            normalized_options = []
            for opt in options:
                if isinstance(opt, dict) and 'id' in opt and 'text' in opt:
                    normalized_options.append({'id': opt['id'], 'text': opt['text']})
                else:
                    normalized_options.append({'id': str(uuid.uuid4()), 'text': str(opt)})
            update_data['options'] = normalized_options

        if 'correct_option' in update_data:
            options_list = update_data.get('options')
            if options_list:
                option_ids = {opt['id'] for opt in options_list}
                provided = update_data['correct_option']
                if provided not in option_ids:
                    # allow passing option text
                    match = next((opt['id'] for opt in options_list if opt['text'] == provided), None)
                    if not match:
                        raise ValueError('correct_option must be one of the option ids or texts.')
                    update_data['correct_option'] = match
                    update_data['correct_text'] = next((opt['text'] for opt in options_list if opt['id'] == match), None)
                else:
                    update_data['correct_text'] = next((opt['text'] for opt in options_list if opt['id'] == provided), None)
            else:
                # reuse existing options to validate
                existing_options = existing.get('options', [])
                option_ids = {opt['id'] for opt in existing_options}
                provided = update_data['correct_option']
                if provided not in option_ids:
                    match = next((opt['id'] for opt in existing_options if opt['text'] == provided), None)
                    if not match:
                        raise ValueError('correct_option must be one of the existing option ids or texts.')
                    update_data['correct_option'] = match
                    update_data['correct_text'] = next((opt['text'] for opt in existing_options if opt['id'] == match), None)
                else:
                    update_data['correct_text'] = next((opt['text'] for opt in existing_options if opt['id'] == provided), None)

        update_data['updated_at'] = datetime.now(timezone.utc)

        cls._collection(db).update_one({'_id': oid}, {'$set': update_data})
        question = cls._collection(db).find_one({'_id': oid})
        if question:
            QuizHelper.recalc_question_count(db, question['quiz_id'])
        return question

    @classmethod
    def delete_question(cls, db, question_id):
        oid = cls._oid(question_id)
        if oid is None:
            return False

        question = cls._collection(db).find_one({'_id': oid})
        if not question:
            return False

        cls._collection(db).delete_one({'_id': oid})
        QuizHelper.recalc_question_count(db, question['quiz_id'])
        return True

    @classmethod
    def list_questions(cls, db, quiz_id):
        oid = cls._oid(quiz_id)
        if oid is None:
            return []
        return list(cls._collection(db).find({'quiz_id': oid}))

    @classmethod
    def find_by_id(cls, db, question_id):
        oid = cls._oid(question_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @staticmethod
    def sanitize_for_attempt(question):
        """Return question payload safe for delivery to students."""
        return {
            'id': str(question['_id']),
            'text': question.get('text'),
            'options': [{'id': option['id'], 'text': option['text']} for option in question.get('options', [])],
            'points': question.get('points', 1),
        }

    @staticmethod
    def to_dict(question):
        if not question:
            return None
        return {
            'id': str(question['_id']),
            'quiz_id': str(question['quiz_id']),
            'text': question.get('text'),
            'options': question.get('options', []),
            'correct_option': question.get('correct_option'),
            'explanation': question.get('explanation'),
            'points': question.get('points', 1),
            'created_at': question.get('created_at').isoformat() if question.get('created_at') else None,
            'updated_at': question.get('updated_at').isoformat() if question.get('updated_at') else None,
        }


class QuizAttemptHelper:
    """Helper methods for quiz attempts."""

    @staticmethod
    def _collection(db):
        return db.quiz_attempts

    @staticmethod
    def _oid(value):
        if not value:
            return None
        if isinstance(value, ObjectId):
            return value
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)

    @classmethod
    def start_attempt(cls, db, quiz_id, student_id, question_ids, duration_minutes):
        now = cls._now()
        attempt = {
            'quiz_id': cls._oid(quiz_id),
            'student_id': cls._oid(student_id),
            'status': 'in_progress',
            'started_at': now,
            'expires_at': now + timedelta(minutes=duration_minutes or 30),
            'submitted_at': None,
            'score': 0,
            'total_points': 0,
            'percentage': 0,
            'answers': [],
            'question_order': [cls._oid(qid) for qid in question_ids],
            'time_spent_seconds': 0,
        }
        result = cls._collection(db).insert_one(attempt)
        attempt['_id'] = result.inserted_id
        return attempt

    @classmethod
    def find_by_id(cls, db, attempt_id):
        oid = cls._oid(attempt_id)
        if oid is None:
            return None
        return cls._collection(db).find_one({'_id': oid})

    @classmethod
    def update_result(cls, db, attempt_id, score, total_points, answers, submitted_at=None):
        oid = cls._oid(attempt_id)
        if oid is None:
            return None
        existing = cls._collection(db).find_one({'_id': oid})
        if not existing:
            return None

        submitted_time = submitted_at or cls._now()
        percentage = (score / total_points * 100) if total_points else 0
        time_spent = int((submitted_time - existing.get('started_at', submitted_time)).total_seconds())

        cls._collection(db).update_one(
            {'_id': oid},
            {
                '$set': {
                    'score': score,
                    'total_points': total_points,
                    'percentage': percentage,
                    'answers': answers,
                    'status': 'completed',
                    'submitted_at': submitted_time,
                    'time_spent_seconds': max(time_spent, 0)
                }
            }
        )
        return cls.find_by_id(db, oid)

    @classmethod
    def record_time_spent(cls, db, attempt_id, seconds):
        oid = cls._oid(attempt_id)
        if oid is None:
            return
        cls._collection(db).update_one(
            {'_id': oid},
            {'$set': {'time_spent_seconds': seconds}}
        )

    @classmethod
    def list_for_student(cls, db, student_id, limit=50):
        return list(cls._collection(db).find(
            {'student_id': cls._oid(student_id)}
        ).sort('submitted_at', -1).limit(limit))

    @classmethod
    def list_for_quiz(cls, db, quiz_id):
        return list(cls._collection(db).find({'quiz_id': cls._oid(quiz_id)}))

    @staticmethod
    def to_dict(attempt, include_answers=False):
        if not attempt:
            return None
        data = {
            'id': str(attempt['_id']),
            'quiz_id': str(attempt['quiz_id']),
            'student_id': str(attempt['student_id']),
            'status': attempt.get('status'),
            'score': attempt.get('score', 0),
            'total_points': attempt.get('total_points', 0),
            'percentage': attempt.get('percentage', 0),
            'started_at': attempt.get('started_at').isoformat() if attempt.get('started_at') else None,
            'expires_at': attempt.get('expires_at').isoformat() if attempt.get('expires_at') else None,
            'submitted_at': attempt.get('submitted_at').isoformat() if attempt.get('submitted_at') else None,
            'time_spent_seconds': attempt.get('time_spent_seconds', 0),
        }
        if include_answers:
            answers = attempt.get('answers', [])
            data['answers'] = []
            for answer in answers:
                answer_copy = answer.copy()
                if isinstance(answer_copy.get('question_id'), ObjectId):
                    answer_copy['question_id'] = str(answer_copy['question_id'])
                data['answers'].append(answer_copy)
        return data


def evaluate_answers(questions, submitted_answers):
    """Evaluate submitted answers against question set."""
    total_points = sum(q.get('points', 1) for q in questions)
    earned_points = 0
    answer_feedback = []

    answers_lookup = {answer['question_id']: answer for answer in submitted_answers}

    for question in questions:
        qid = str(question['_id'])
        expected_option = question.get('correct_option')
        points = question.get('points', 1)
        option_lookup = {opt['id']: opt['text'] for opt in question.get('options', [])}

        submitted = answers_lookup.get(qid, {})
        selected = submitted.get('selected_option')

        is_correct = selected == expected_option
        earned = points if is_correct else 0
        earned_points += earned

        answer_feedback.append({
            'question_id': str(question['_id']),
            'question_text': question.get('text'),
            'selected_option': selected,
            'selected_option_text': option_lookup.get(selected),
            'correct_option': expected_option,
            'correct_option_text': option_lookup.get(expected_option, question.get('correct_text')),
            'is_correct': is_correct,
            'points_awarded': earned,
            'points_possible': points,
            'explanation': question.get('explanation'),
        })

    percentage = (earned_points / total_points * 100) if total_points else 0

    return earned_points, total_points, percentage, answer_feedback
