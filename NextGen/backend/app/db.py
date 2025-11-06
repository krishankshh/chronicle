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

        print("Database indexes created successfully")
