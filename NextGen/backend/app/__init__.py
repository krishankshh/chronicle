"""Flask application factory."""
import os
from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager
from flask_cors import CORS
# from flask_mail import Mail
# from flask_limiter import Limiter
# from flask_limiter.util import get_remote_address
from flask_restx import Api

from app.config import config
from app.db import close_db, init_db
from app.extensions import socketio
from app.socketio_handlers import register_socketio_events

# Initialize extensions
jwt = JWTManager()
# mail = Mail()
# limiter = Limiter(key_func=get_remote_address)


def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Create upload folders if they don't exist
    upload_folder = app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'avatars'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'documents'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'notices'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'materials'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'discussions'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'chat'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'timeline'), exist_ok=True)

    # Initialize extensions with app
    jwt.init_app(app)
    # mail.init_app(app)  # Disabled for Phase 2 testing
    # limiter.init_app(app)  # Disabled for Phase 2 testing

    # Register database teardown
    app.teardown_appcontext(close_db)

    # Configure CORS (allow file uploads)
    CORS(app, resources={
        r"/api/*": {"origins": app.config['CORS_ORIGINS']},
        r"/uploads/*": {"origins": app.config['CORS_ORIGINS']}
    })

    # Initialize API documentation
    api = Api(
        app,
        version=app.config['API_VERSION'],
        title=app.config['API_TITLE'],
        description=app.config['API_DESCRIPTION'],
        doc='/api/docs',
        prefix='/api'
    )

    # Register blueprints
    from app.blueprints import auth, students, users, courses, subjects, notices, materials, quizzes, discussions, chats, timeline

    api.add_namespace(auth.api, path='/auth')
    api.add_namespace(students.api, path='/students')
    api.add_namespace(users.api, path='/users')
    api.add_namespace(courses.api, path='/courses')
    api.add_namespace(subjects.api, path='/subjects')
    api.add_namespace(notices.api, path='/notices')
    api.add_namespace(materials.api, path='/materials')
    api.add_namespace(quizzes.api, path='/quizzes')
    api.add_namespace(discussions.api, path='/discussions')
    api.add_namespace(chats.api, path='/chats')
    api.add_namespace(timeline.api, path='/timeline')

    # Health check endpoint
    @app.route('/api/health')
    def health():
        return {'status': 'healthy', 'message': 'Chronicle API is running'}

    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        """Serve uploaded files."""
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Initialize database indexes
    with app.app_context():
        try:
            init_db(app)
        except Exception as e:
            print(f"Warning: Could not initialize database: {e}")

    socketio.init_app(app, cors_allowed_origins=app.config.get('CORS_ORIGINS', ['*']))
    register_socketio_events(socketio)

    return app
