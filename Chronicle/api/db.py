import os
from pymongo import MongoClient

_client = None
db = None


def init_db():
    global _client, db
    if _client is not None:
        return db
    uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    name = os.environ.get("MONGO_DB_NAME", "chronicle")
    _client = MongoClient(uri)
    db = _client[name]
    return db


def get_db():
    if db is None:
        return init_db()
    return db

