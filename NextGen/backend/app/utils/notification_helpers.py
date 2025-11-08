"""Helper utilities for assembling notification recipient lists."""
from __future__ import annotations

from typing import Dict, List, Optional

from bson import ObjectId

from app.models.course import CourseHelper
from app.models.subject import SubjectHelper


def _to_object_id(value):
    if not value:
        return None
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(value)
    except Exception:  # pragma: no cover - defensive
        return None


def resolve_course_name(db, course_id) -> Optional[str]:
    """Return human-friendly course name for the given course ID."""
    oid = _to_object_id(course_id)
    if not oid:
        return None
    course = CourseHelper.find_by_id(db, oid)
    if not course:
        return None
    return course.get('course_name') or course.get('course_code')


def resolve_subject_name(db, subject_id) -> Optional[str]:
    """Return subject name for the given subject ID."""
    oid = _to_object_id(subject_id)
    if not oid:
        return None
    subject = SubjectHelper.find_by_id(db, oid)
    if not subject:
        return None
    return subject.get('subject_name') or subject.get('subject_code')


def _student_query(course_name=None, semester=None) -> Dict:
    query = {'status': 'Active'}
    if course_name:
        query['course'] = course_name
    if semester is not None:
        query['semester'] = semester
    return query


def _extract_recipient(doc, fallback_name='Member') -> Optional[Dict[str, str]]:
    email = doc.get('email')
    if not email:
        return None
    name = doc.get('name') or doc.get('login_id') or fallback_name
    return {'email': email, 'name': name}


def get_student_recipients(db, course_name=None, semester=None, fallback_to_all=False) -> List[Dict[str, str]]:
    """Return active students filtered by course/semester."""
    recipients = []
    projection = {'email': 1, 'name': 1, 'course': 1, 'semester': 1}
    query = _student_query(course_name, semester)

    for student in db.students.find(query, projection):
        contact = _extract_recipient(student, fallback_name='Student')
        if contact:
            recipients.append(contact)

    if not recipients and (course_name or semester) and fallback_to_all:
        for student in db.students.find({'status': 'Active'}, projection):
            contact = _extract_recipient(student, fallback_name='Student')
            if contact:
                recipients.append(contact)

    return recipients


def get_staff_recipients(db) -> List[Dict[str, str]]:
    """Return active staff/admin users with email addresses."""
    recipients = []
    projection = {'email': 1, 'name': 1, 'login_id': 1}
    for user in db.users.find({'status': 'Active'}, projection):
        contact = _extract_recipient(user, fallback_name='Staff')
        if contact:
            recipients.append(contact)
    return recipients


def get_account_contact(db, user_id, role) -> Optional[Dict[str, str]]:
    """Return contact info (email/name) for a user based on role."""
    oid = _to_object_id(user_id)
    if not oid:
        return None

    if role == 'student':
        collection = db.students
        fallback = 'Student'
    else:
        collection = db.users
        fallback = 'Staff'

    doc = collection.find_one({'_id': oid}, {'email': 1, 'name': 1, 'login_id': 1})
    if not doc:
        return None
    return _extract_recipient(doc, fallback_name=fallback)


def combine_recipients(*recipient_lists: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Merge multiple recipient lists while keeping emails unique."""
    combined: List[Dict[str, str]] = []
    seen = set()
    for recipient_list in recipient_lists:
        for recipient in recipient_list or []:
            email = recipient.get('email')
            if not email or email in seen:
                continue
            seen.add(email)
            combined.append(recipient)
    return combined
