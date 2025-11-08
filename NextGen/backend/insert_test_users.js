// MongoDB Shell Script to Insert Test Users
// Run this in MongoDB Compass or MongoDB Atlas UI

// ============================================================
// 1. INSERT ADMIN USER (users collection)
// ============================================================
db.users.insertOne({
  "login_id": "admin",
  "name": "Admin User",
  "email": "admin@chronicle.com",
  "password_hash": "$2b$12$3pFZxFo/0B9K8WtdYXZ3B.IKxA95jZgScMxiI6zNwcc0J.RYcOJji",
  "user_type": "Admin",
  "user_img": null,
  "status": "Active",
  "created_at": new Date(),
  "updated_at": new Date()
});

print("✅ Admin user created - Login: admin / Password: admin123");

// ============================================================
// 2. INSERT TEACHER USER (users collection)
// ============================================================
db.users.insertOne({
  "login_id": "teacher",
  "name": "Teacher User",
  "email": "teacher@chronicle.com",
  "password_hash": "$2b$12$S6kEMRfDTSrWUdhn4nZrfe7z4kYoVoT2zOtE7IsKV881HrennBywu",
  "user_type": "Staff",
  "user_img": null,
  "status": "Active",
  "created_at": new Date(),
  "updated_at": new Date()
});

print("✅ Teacher user created - Login: teacher / Password: teacher123");

// ============================================================
// 3. INSERT STUDENT USER (students collection)
// ============================================================
db.students.insertOne({
  "roll_no": "STU001",
  "name": "Student User",
  "email": "student@chronicle.com",
  "password_hash": "$2b$12$G6b7cT2Go7/xeXeDQhsiC.LE8pUm5mTzIzjIXMdCoIOZQiP5xN.Ju",
  "course": "Computer Science",
  "semester": 5,
  "batch": "2023",
  "student_img": null,
  "about_student": "Test student account for Chronicle",
  "mob_no": "1234567890",
  "status": "Active",
  "email_verified": true,
  "created_at": new Date(),
  "updated_at": new Date()
});

print("✅ Student user created - Roll No: STU001 / Password: student123");

print("\n" + "=".repeat(60));
print("ALL TEST USERS CREATED SUCCESSFULLY!");
print("=".repeat(60));
print("\nCredentials:");
print("1. Admin - Login: admin, Password: admin123");
print("2. Teacher - Login: teacher, Password: teacher123");
print("3. Student - Roll No: STU001, Password: student123");
print("\nLogin Endpoints:");
print("- Admin/Teacher: POST /api/auth/staff/login");
print("- Student: POST /api/auth/student/login");
print("=".repeat(60));
