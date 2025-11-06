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

        # Create indexes for notices collection
        db.notices.create_index('type')
        db.notices.create_index('status')
        db.notices.create_index('is_featured')
        db.notices.create_index('publish_start')
        db.notices.create_index([('is_featured', 1), ('publish_start', -1)])

        # Create indexes for materials collection
        db.materials.create_index('course_id')
        db.materials.create_index('subject_id')
        db.materials.create_index('semester')
        db.materials.create_index('title')
        db.materials.create_index([('created_at', -1)])

        # Create indexes for quizzes, questions, and attempts
        db.quizzes.create_index('course_id')
        db.quizzes.create_index('subject_id')
        db.quizzes.create_index('semester')
        db.quizzes.create_index('status')
        db.quizzes.create_index([('created_at', -1)])

        db.questions.create_index('quiz_id')

        db.quiz_attempts.create_index('quiz_id')
        db.quiz_attempts.create_index('student_id')
        db.quiz_attempts.create_index('percentage')

        # Create indexes for discussions and replies
        db.discussions.create_index('course_id')
        db.discussions.create_index('subject_id')
        db.discussions.create_index('semester')
        db.discussions.create_index([('updated_at', -1)])
        db.discussions.create_index([('title', 'text'), ('content', 'text')])

        db.discussion_replies.create_index('discussion_id')
        db.discussion_replies.create_index('parent_reply_id')
        db.discussion_replies.create_index([('created_at', 1)])

        # Create indexes for chat sessions and messages
        db.chat_sessions.create_index('participants')
        db.chat_sessions.create_index([('updated_at', -1)])
        db.group_chats.create_index('member_ids')
        db.group_chats.create_index([('updated_at', -1)])
        db.chat_messages.create_index('chat_id')
        db.chat_messages.create_index('group_id')
        db.chat_messages.create_index([('created_at', -1)])

        # Create indexes for timeline posts and comments
        db.timeline_posts.create_index([('created_at', -1)])
        db.timeline_posts.create_index('created_by')
        db.timeline_posts.create_index('visibility')
        db.timeline_comments.create_index('post_id')
        db.timeline_comments.create_index([('created_at', 1)])

        print("Database indexes created successfully")
