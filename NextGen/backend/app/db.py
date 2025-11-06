"""MongoDB database connection."""
from pymongo import MongoClient
from flask import current_app, g


def get_db():
    """Get database connection from Flask g object or create new one."""
    if 'db' not in g:
        client = MongoClient(current_app.config['MONGO_URI'])
        g.db = client[current_app.config['MONGO_DB_NAME']]
        g.client = client
    return g.db


def close_db(e=None):
    """Close database connection."""
    client = g.pop('client', None)
    if client is not None:
        client.close()


def init_db(app):
    """Initialize database indexes."""
    with app.app_context():
        db = get_db()

        # Create indexes for students collection
        db.students.create_index('roll_no', unique=True)
        db.students.create_index('email', unique=True)

        # Create indexes for users collection
        db.users.create_index('login_id', unique=True)
        db.users.create_index('email', unique=True)

        # Create indexes for courses collection
        db.courses.create_index('course_code', unique=True)
        db.courses.create_index('course_name', unique=True)

        # Create indexes for subjects collection
        db.subjects.create_index('subject_code')
        db.subjects.create_index('course_id')
        db.subjects.create_index('semester')
        db.subjects.create_index([('course_id', 1), ('subject_code', 1)], unique=True)

        print("Database indexes created successfully")
