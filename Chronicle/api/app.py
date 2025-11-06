import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from utils import json_response
from db import init_db
from blueprints.auth import auth_bp
from blueprints.notices import notices_bp


def create_app() -> Flask:
    # Load .env if present (useful in local dev)
    load_dotenv()

    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET", "dev-secret")

    # DB init
    init_db()

    # CORS (allow web and mobile dev ports)
    CORS(
        app,
        resources={r"/api/*": {"origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8081",
            "http://localhost:19006",
            "http://localhost:19000",
        ]}},
        supports_credentials=True,
    )

    JWTManager(app)

    @app.route("/api/health", methods=["GET"])
    def health():
        return json_response({"ok": True})

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(notices_bp, url_prefix="/api/notices")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)

