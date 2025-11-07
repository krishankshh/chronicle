"""Administrative dashboard and analytics endpoints."""
from datetime import datetime, timedelta, timezone

from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt

from app.db import get_db

api = Namespace('admin', description='Administrative dashboard, analytics, and monitoring')


def _serialize_datetime(value):
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return None


def _ensure_staff_access():
    claims = get_jwt()
    role = claims.get('role')
    if role not in {'staff', 'admin'}:
        api.abort(403, 'Staff or admin access required.')
    return role


def _safe_collection(db, name):
    """Return collection reference even if it has not been created yet."""
    return getattr(db, name, db[name])


def _timeseries_for_collection(db, collection_name, field='created_at', days=7, limit=500):
    """Build a simple time-series for the last N days."""
    collection = _safe_collection(db, collection_name)
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days - 1)).date()
    day_order = []
    counts = {}
    for offset in range(days):
        day = start_date + timedelta(days=offset)
        key = day.isoformat()
        day_order.append(key)
        counts[key] = 0

    cursor = collection.find({}, {field: 1, 'updated_at': 1}).sort(field, -1).limit(limit)
    for doc in cursor:
        ts = doc.get(field) or doc.get('updated_at')
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            day_key = ts.date().isoformat()
            if day_key in counts:
                counts[day_key] += 1
    return [{'day': key, 'count': counts[key]} for key in day_order]


def _recent_activity(db, limit=20):
    """Collect recent events from different collections."""
    sources = [
        ('notice', 'notices', 'title'),
        ('discussion', 'discussions', 'title'),
        ('timeline', 'timeline_posts', 'content'),
        ('quiz', 'quizzes', 'title'),
        ('material', 'materials', 'title'),
    ]
    events = []
    for kind, collection_name, title_field in sources:
        collection = _safe_collection(db, collection_name)
        cursor = collection.find(
            {},
            {title_field: 1, 'created_at': 1, 'updated_at': 1, 'author_name': 1, 'created_by': 1},
        ).sort('updated_at', -1).limit(limit)
        for doc in cursor:
            ts = doc.get('updated_at') or doc.get('created_at')
            events.append({
                'type': kind,
                'title': doc.get(title_field) or 'Untitled',
                'author': doc.get('author_name'),
                'created_by': str(doc.get('created_by')) if doc.get('created_by') else None,
                'timestamp': _serialize_datetime(ts),
            })
    events.sort(key=lambda item: item['timestamp'] or '', reverse=True)
    return events[:limit]


summary_model = api.model('AdminSummary', {
    'students': fields.Integer(),
    'staff': fields.Integer(),
    'courses': fields.Integer(),
    'subjects': fields.Integer(),
    'notices': fields.Integer(),
    'materials': fields.Integer(),
    'discussions': fields.Integer(),
    'quizzes': fields.Integer(),
    'timeline_posts': fields.Integer(),
    'chat_messages': fields.Integer(),
})

activity_model = api.model('AdminActivity', {
    'type': fields.String(),
    'title': fields.String(),
    'author': fields.String(),
    'created_by': fields.String(),
    'timestamp': fields.String(),
})

dashboard_model = api.model('AdminDashboard', {
    'summary': fields.Nested(summary_model),
    'trends': fields.Raw(),
    'recent_activity': fields.List(fields.Nested(activity_model)),
    'quick_actions': fields.List(fields.Raw()),
})

statistics_model = api.model('AdminStatistics', {
    'timeseries': fields.Raw(),
})

activity_list_model = api.model('AdminActivityList', {
    'count': fields.Integer(),
    'logs': fields.List(fields.Nested(activity_model)),
})

user_analytics_model = api.model('UserAnalytics', {
    'per_course': fields.List(fields.Raw()),
    'per_semester': fields.List(fields.Raw()),
    'monthly_growth': fields.Raw(),
    'total_students': fields.Integer(),
})

content_analytics_model = api.model('ContentAnalytics', {
    'notices_by_type': fields.List(fields.Raw()),
    'discussions': fields.Raw(),
    'timeline': fields.Raw(),
    'quizzes': fields.Raw(),
})


@api.route('/dashboard')
class AdminDashboard(Resource):
    """High-level summary for administrators."""

    @api.marshal_with(dashboard_model)
    @jwt_required()
    def get(self):
        role = _ensure_staff_access()
        db = get_db()
        summary = {
            'students': _safe_collection(db, 'students').count_documents({}),
            'staff': _safe_collection(db, 'users').count_documents({'user_type': {'$in': ['Staff', 'Admin']}}),
            'courses': _safe_collection(db, 'courses').count_documents({}),
            'subjects': _safe_collection(db, 'subjects').count_documents({}),
            'notices': _safe_collection(db, 'notices').count_documents({}),
            'materials': _safe_collection(db, 'materials').count_documents({}),
            'discussions': _safe_collection(db, 'discussions').count_documents({}),
            'quizzes': _safe_collection(db, 'quizzes').count_documents({}),
            'timeline_posts': _safe_collection(db, 'timeline_posts').count_documents({}),
            'chat_messages': _safe_collection(db, 'chat_messages').count_documents({}),
        }

        trends = {
            'students': _timeseries_for_collection(db, 'students', days=7),
            'notices': _timeseries_for_collection(db, 'notices', days=7),
            'timeline_posts': _timeseries_for_collection(db, 'timeline_posts', days=7),
        }

        quick_actions = [
            {'label': 'Create notice', 'href': '/admin/notices/new', 'description': 'Publish an announcement'},
            {'label': 'Add quiz', 'href': '/admin/quizzes/new', 'description': 'Schedule a new quiz'},
            {'label': 'Upload material', 'href': '/admin/materials/new', 'description': 'Share study resources'},
        ]

        return {
            'summary': summary,
            'trends': trends,
            'recent_activity': _recent_activity(db, limit=15),
            'quick_actions': quick_actions,
            'role': role,
        }


@api.route('/statistics')
class AdminStatistics(Resource):
    """Aggregate statistics for charts."""

    @api.marshal_with(statistics_model)
    @jwt_required()
    def get(self):
        _ensure_staff_access()
        db = get_db()
        timeseries = {
            'students': _timeseries_for_collection(db, 'students', days=10),
            'discussions': _timeseries_for_collection(db, 'discussions', days=10),
            'timeline_posts': _timeseries_for_collection(db, 'timeline_posts', days=10),
            'chat_messages': _timeseries_for_collection(db, 'chat_messages', days=10),
        }
        return {'timeseries': timeseries}


@api.route('/activity-logs')
class ActivityLogs(Resource):
    """Recent activity feed."""

    @api.marshal_with(activity_list_model)
    @jwt_required()
    def get(self):
        _ensure_staff_access()
        try:
            limit = int(request.args.get('limit', 25))
        except (TypeError, ValueError):
            limit = 25
        limit = max(5, min(limit, 100))
        db = get_db()
        logs = _recent_activity(db, limit=limit)
        return {'count': len(logs), 'logs': logs}


@api.route('/user-analytics')
class UserAnalytics(Resource):
    """Breakdown of the student body."""

    @api.marshal_with(user_analytics_model)
    @jwt_required()
    def get(self):
        _ensure_staff_access()
        db = get_db()
        per_course = []
        pipeline = [
            {'$group': {'_id': '$course', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
        ]
        for item in _safe_collection(db, 'students').aggregate(pipeline):
            per_course.append({'course': item['_id'] or 'Unknown', 'count': item['count']})

        per_semester = []
        pipeline = [
            {'$group': {'_id': '$semester', 'count': {'$sum': 1}}},
            {'$sort': {'_id': 1}},
        ]
        for item in _safe_collection(db, 'students').aggregate(pipeline):
            per_semester.append({'semester': item['_id'] or 'N/A', 'count': item['count']})

        now = datetime.now(timezone.utc)
        last_30 = now - timedelta(days=30)
        prev_30 = last_30 - timedelta(days=30)

        recent = _safe_collection(db, 'students').count_documents({'created_at': {'$gte': last_30}})
        previous = _safe_collection(db, 'students').count_documents({
            'created_at': {'$gte': prev_30, '$lt': last_30}
        })
        growth = {
            'recent': recent,
            'previous': previous,
            'trend': recent - previous,
        }

        total_students = _safe_collection(db, 'students').count_documents({})

        return {
            'per_course': per_course,
            'per_semester': per_semester,
            'monthly_growth': growth,
            'total_students': total_students,
        }


@api.route('/content-analytics')
class ContentAnalytics(Resource):
    """Content engagement metrics."""

    @api.marshal_with(content_analytics_model)
    @jwt_required()
    def get(self):
        _ensure_staff_access()
        db = get_db()
        notices_by_type = []
        pipeline = [
            {'$group': {'_id': '$type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
        ]
        for item in _safe_collection(db, 'notices').aggregate(pipeline):
            notices_by_type.append({'type': item['_id'] or 'general', 'count': item['count']})

        discussion_agg = _safe_collection(db, 'discussions').aggregate([
            {'$group': {
                '_id': None,
                'total': {'$sum': 1},
                'reply_count': {'$sum': '$reply_count'},
                'likes_count': {'$sum': {'$ifNull': ['$likes_count', 0]}},
            }}
        ])
        discussion_stats = next(discussion_agg, {'total': 0, 'reply_count': 0, 'likes_count': 0})

        timeline_agg = _safe_collection(db, 'timeline_posts').aggregate([
            {'$group': {
                '_id': None,
                'total': {'$sum': 1},
                'likes': {'$sum': '$likes_count'},
                'comments': {'$sum': '$comments_count'},
            }}
        ])
        timeline_stats = next(timeline_agg, {'total': 0, 'likes': 0, 'comments': 0})

        quiz_agg = _safe_collection(db, 'quizzes').aggregate([
            {'$group': {
                '_id': '$status',
                'count': {'$sum': 1},
            }}
        ])
        quiz_stats = [{'status': item['_id'] or 'draft', 'count': item['count']} for item in quiz_agg]

        return {
            'notices_by_type': notices_by_type,
            'discussions': {
                'threads': discussion_stats.get('total', 0),
                'replies': discussion_stats.get('reply_count', 0),
                'likes': discussion_stats.get('likes_count', 0),
            },
            'timeline': {
                'posts': timeline_stats.get('total', 0),
                'likes': timeline_stats.get('likes', 0),
                'comments': timeline_stats.get('comments', 0),
            },
            'quizzes': quiz_stats,
        }
