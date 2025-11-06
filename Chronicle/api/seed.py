"""Quick seed helper to insert sample data into MongoDB.
Run: python seed.py
"""
import datetime as dt

from db import init_db


def run():
    db = init_db()

    if db.notices.count_documents({}) == 0:
        db.notices.insert_many(
            [
                {
                    "title": "Welcome to Chronicle",
                    "description": "This is a seeded welcome notice.",
                    "type": "News and Updates",
                    "createdAt": dt.datetime.utcnow(),
                },
                {
                    "title": "Annual Sports Meet",
                    "description": "Join the sports meet this weekend!",
                    "type": "Events",
                    "createdAt": dt.datetime.utcnow(),
                },
            ]
        )
        print("Seeded notices.")
    else:
        print("Notices already present, skipping.")


if __name__ == "__main__":
    run()

