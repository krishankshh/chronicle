"""Flask application factory."""
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_restx import Api

from app.config import config
from app.db import close_db, init_db

# Initialize extensions
jwt = JWTManager()
mail = Mail()
limiter = Limiter(key_func=get_remote_address)


def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # Register database teardown
    app.teardown_appcontext(close_db)

    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

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
    from app.blueprints import auth, students, users

    api.add_namespace(auth.api, path='/auth')
    api.add_namespace(students.api, path='/students')
    api.add_namespace(users.api, path='/users')

    # Health check endpoint
    @app.route('/api/health')
    def health():
        return {'status': 'healthy', 'message': 'Chronicle API is running'}

    # Initialize database indexes
    with app.app_context():
        try:
            init_db(app)
        except Exception as e:
            print(f"Warning: Could not initialize database: {e}")

    return app
