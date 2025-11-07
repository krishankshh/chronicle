"""API blueprints."""
from app.blueprints import (
    auth,
    students,
    users,
    courses,
    subjects,
    notices,
    materials,
    quizzes,
    discussions,
    chats,
    timeline,
    admin_dashboard,
    reports,
)

__all__ = [
    'auth',
    'students',
    'users',
    'courses',
    'subjects',
    'notices',
    'materials',
    'quizzes',
    'discussions',
    'chats',
    'timeline',
    'admin_dashboard',
    'reports',
]
