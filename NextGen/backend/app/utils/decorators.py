"""Custom decorators for authentication and authorization."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def student_required(fn):
    """Decorator to require student role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'student':
            return jsonify({'success': False, 'message': 'Student access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def staff_required(fn):
    """Decorator to require staff role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') not in ['staff', 'admin']:
            return jsonify({'success': False, 'message': 'Staff access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    """Decorator to require admin role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper
