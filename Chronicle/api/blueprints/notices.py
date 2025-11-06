import datetime as dt
from bson import ObjectId
from flask import Blueprint, request

from db import get_db
from utils import json_response, serialize


notices_bp = Blueprint("notices", __name__)


@notices_bp.get("")
def list_notices():
    db = get_db()
    notice_type = request.args.get("type")  # e.g., "Events" | "News and Updates" | "Meeting"
    query = {}
    if notice_type:
        query["type"] = notice_type
    docs = list(db.notices.find(query).sort("createdAt", -1).limit(100))
    return json_response([serialize(d) for d in docs])


@notices_bp.get("/<id>")
def get_notice(id: str):
    db = get_db()
    try:
        doc = db.notices.find_one({"_id": ObjectId(id)})
    except Exception:
        return json_response({"error": "Invalid id"}, 400)
    if not doc:
        return json_response({"error": "Not found"}, 404)
    return json_response(serialize(doc))


@notices_bp.post("")
def create_notice():
    db = get_db()
    data = request.get_json(force=True)
    required = ["title", "description", "type"]
    for r in required:
        if not data.get(r):
            return json_response({"error": f"Missing field: {r}"}, 400)
    doc = {
        "title": data["title"],
        "description": data["description"],
        "type": data["type"],
        "uploadsUrl": data.get("uploadsUrl"),
        "createdAt": dt.datetime.utcnow(),
    }
    res = db.notices.insert_one(doc)
    created = db.notices.find_one({"_id": res.inserted_id})
    return json_response(serialize(created), 201)

