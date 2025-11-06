"""Student management endpoints."""
from flask_restx import Namespace, Resource

api = Namespace('students', description='Student management operations')


@api.route('/')
class StudentList(Resource):
    """Student list endpoint (to be implemented in Phase 2)."""

    def get(self):
        """Get all students."""
        return {'message': 'Student list endpoint - to be implemented in Phase 2'}, 200
