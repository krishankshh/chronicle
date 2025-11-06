"""User management endpoints."""
from flask_restx import Namespace, Resource

api = Namespace('users', description='User management operations')


@api.route('/')
class UserList(Resource):
    """User list endpoint (to be implemented in Phase 2)."""

    def get(self):
        """Get all users."""
        return {'message': 'User list endpoint - to be implemented in Phase 2'}, 200
