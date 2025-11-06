Chronicle (React + Flask + MongoDB)

This is a migration scaffold of the legacy PHP/MySQL Chronicle project into a modern stack:

- React (web)
- Flask API (Python) backed by MongoDB
- React Native (Expo) mobile app

Status: Initial scaffold with auth and notices endpoints + basic web/mobile screens. More features (discussions, quiz, chat, materials) are outlined and ready to implement.

Monorepo Layout

- api/ — Flask app (MongoDB, JWT auth, CORS)
- web/ — React + Vite app (JavaScript)
- mobile/ — React Native (Expo) app

Quick Start (Docker Compose)

1) Copy env templates and set secrets:
   - cp api/.env.example api/.env
   - cp web/.env.example web/.env

2) Start MongoDB and API:
   - docker compose up --build

   Services:
   - MongoDB on mongodb://localhost:27017
   - API on http://localhost:5000

3) Start the web app (in another terminal):
   - cd web
   - npm install
   - npm run dev
   - Open http://localhost:5173

4) Mobile app (Expo):
   - cd mobile
   - npm install
   - npx expo start
   - Use Expo Go to run on device, or use emulator

Environment Variables

- api/.env
  - MONGO_URI=mongodb://localhost:27017
  - MONGO_DB_NAME=chronicle
  - JWT_SECRET=change-me

- web/.env
  - VITE_API_BASE_URL=http://localhost:5000

Data Model (MongoDB Collections)

- students: { _id, name, rollNo, email, courseId, semester, about, avatarUrl, passwordHash, status }
- users: { _id, name, loginId, email, userType, passwordHash, status }
- notices: { _id, title, description, type, uploadsUrl, createdAt }
- discussions: { _id, courseId, semester, subjectId, title, description, createdAt, studentId, status }
- discussionReplies: { _id, discussionId, studentId, userId, message, uploadsUrl, createdAt }
- quizzes: { _id, title, courseId, subjectId, semester, status }
- questions: { _id, quizId, question, options: [..4], correctIndex }
- quizResults: { _id, quizId, studentId, questionId, selectedIndex, correctIndex, createdAt }
- chats: { _id, studentIds: [a,b] }
- chatMessages: { _id, chatId?, groupChatKey?, studentId, date, time, message }
- courses, subjects, materials, timelinePosts as needed

API Overview (initial)

- POST   /api/auth/student/register
- POST   /api/auth/student/login
- POST   /api/auth/staff/login
- GET    /api/notices
- GET    /api/notices/:id

Security

- JWT-based auth (access tokens)
- Password hashing using Werkzeug (PBKDF2)
- CORS enabled for web/mobile

Next Steps

- Implement discussions, quiz, timelines, chat endpoints.
- Add role-based authorization guards for admin/staff.
- File uploads via S3/Cloud storage or local sanitized storage.
- Migrate existing MySQL data using a one-off ETL script.
