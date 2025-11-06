import datetime as dt
from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash

from db import get_db
from utils import json_response, serialize


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/student/register")
def student_register():
    db = get_db()
    data = request.get_json(force=True)
    required = ["name", "rollNo", "password"]
    for r in required:
        if not data.get(r):
            return json_response({"error": f"Missing field: {r}"}, 400)

    if db.students.find_one({"rollNo": data["rollNo"]}):
        return json_response({"error": "Roll number already exists"}, 409)

    doc = {
        "name": data.get("name"),
        "rollNo": data.get("rollNo"),
        "email": data.get("email"),
        "courseId": data.get("courseId"),
        "semester": data.get("semester"),
        "about": data.get("about"),
        "avatarUrl": data.get("avatarUrl"),
        "status": "Active",
        "passwordHash": generate_password_hash(data["password"]),
        "createdAt": dt.datetime.utcnow(),
    }
    res = db.students.insert_one(doc)
    student = db.students.find_one({"_id": res.inserted_id})
    token = create_access_token(identity={"role": "student", "id": str(student["_id"])})
    return json_response({"token": token, "student": serialize(student)}, 201)


@auth_bp.post("/student/login")
def student_login():
    db = get_db()
    data = request.get_json(force=True)
    roll_no = data.get("rollNo")
    password = data.get("password")
    if not roll_no or not password:
        return json_response({"error": "rollNo and password are required"}, 400)
    stu = db.students.find_one({"rollNo": roll_no, "status": "Active"})
    if not stu or not check_password_hash(stu.get("passwordHash", ""), password):
        return json_response({"error": "Invalid credentials"}, 401)
    token = create_access_token(identity={"role": "student", "id": str(stu["_id"])})
    return json_response({"token": token, "student": serialize(stu)})


@auth_bp.post("/staff/login")
def staff_login():
    db = get_db()
    data = request.get_json(force=True)
    login_id = data.get("loginId")
    password = data.get("password")
    if not login_id or not password:
        return json_response({"error": "loginId and password are required"}, 400)
    user = db.users.find_one({"loginId": login_id, "status": "Active"})
    if not user or not check_password_hash(user.get("passwordHash", ""), password):
        return json_response({"error": "Invalid credentials"}, 401)
    token = create_access_token(identity={"role": user.get("userType", "Staff"), "id": str(user["_id"])})
    return json_response({"token": token, "user": serialize(user)})

