from datetime import datetime
from bson.objectid import ObjectId
from flask import jsonify


def oid(value):
    if isinstance(value, ObjectId):
        return str(value)
    try:
        return str(ObjectId(value))
    except Exception:
        return value


def serialize(doc):
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out


def json_response(payload=None, status=200):
    return jsonify({"data": payload, "status": status}), status

