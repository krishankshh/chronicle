#!/usr/bin/env python
"""Simple script to run the Flask backend."""
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

def main():
    """Run the Flask application."""
    print("=" * 60)
    print("Chronicle Backend - Starting...")
    print("=" * 60)

    app = create_app('development')

    print("\n✅ Backend Configuration:")
    print(f"   MongoDB: {app.config['MONGO_URI']}")
    print(f"   Database: {app.config['MONGO_DB_NAME']}")
    print(f"   Redis: {app.config['REDIS_URL']}")
    print(f"\n🚀 Starting server on http://localhost:5000")
    print(f"📚 API Documentation: http://localhost:5000/api/docs")
    print(f"💚 Health Check: http://localhost:5000/api/health")
    print("\nPress CTRL+C to stop the server\n")
    print("=" * 60)

    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down server...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
