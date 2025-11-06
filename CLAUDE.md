# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chronicle is a college social network/learning management system undergoing migration from a legacy PHP/MySQL stack to a modern architecture. The repository contains both:

1. **Legacy PHP Application** (root directory) - Original monolithic PHP application with MySQL backend
2. **Modern Stack Migration** (`Chronicle/` directory) - React + Flask + MongoDB microservices architecture

The modern stack is organized as a monorepo with three components:
- `Chronicle/api/` - Flask REST API with MongoDB
- `Chronicle/web/` - React web application (Vite)
- `Chronicle/mobile/` - React Native mobile app (Expo)

## Development Commands

### Full Stack Development (Docker)

```bash
# Start MongoDB and Flask API
cd Chronicle
docker compose up --build

# In another terminal, start web app
cd Chronicle/web
npm install
npm run dev
# Access at http://localhost:5173

# Start mobile app (in another terminal)
cd Chronicle/mobile
npm install
npx expo start
```

### API Development (Flask)

```bash
cd Chronicle/api

# Install dependencies
pip install -r requirements.txt

# Run API directly (without Docker)
python app.py
# API runs on http://localhost:5000

# Seed sample data
python seed.py
```

### Web Development

```bash
cd Chronicle/web

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Mobile Development

```bash
cd Chronicle/mobile

# Start Expo development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Architecture

### Modern Stack Architecture

**API Layer (Flask)**
- Blueprint-based modular routing in `Chronicle/api/blueprints/`
  - `auth.py` - Student and staff authentication (JWT-based)
  - `notices.py` - Notice CRUD operations
- MongoDB integration via PyMongo (`db.py`)
- JWT authentication using flask-jwt-extended
- CORS configured for local development ports (5173, 8081, 19006, 19000)
- Utility functions in `utils.py` for serialization and response formatting

**Data Model (MongoDB Collections)**
- `students` - Student profiles with authentication
- `users` - Staff/admin accounts
- `notices` - Announcements categorized by type (Events, News and Updates, Meeting)
- `discussions` - Forum threads by course/subject
- `discussionReplies` - Threaded discussion responses
- `quizzes` - Quiz metadata
- `questions` - Quiz questions with multiple choice options
- `quizResults` - Student quiz submissions and scores
- `chats` - One-on-one chat sessions
- `chatMessages` - Chat message history

**Web Application (React + Vite)**
- Centralized API client in `web/src/api/client.js` using axios
- Environment-based configuration via `VITE_API_BASE_URL`
- Simple routing structure in `App.jsx`
- Token-based authentication with Bearer tokens

**Mobile Application (Expo)**
- React Native with Expo SDK 51
- Similar API client pattern to web app
- Shared authentication flow with web

### Legacy PHP Application

The root directory contains a traditional PHP application with direct MySQL database access:
- Database connection in `dbconnection.php` (database: `college_social_network`)
- Monolithic page-based architecture (each PHP file is a route)
- Features include: timeline/wallposts, discussions, quizzes, chat, study materials, notices
- Uses DataTables library for table rendering
- PHPMailer for email functionality
- Rich text editor integration (TinyMCE)

## Key Implementation Patterns

### API Response Format

All API responses follow a consistent structure:
```python
{"data": payload, "status": status_code}
```

### MongoDB Document Serialization

ObjectId fields are automatically converted to strings and `_id` is renamed to `id` via the `serialize()` utility.

### Authentication Flow

1. Student/Staff login returns JWT token and user/student object
2. Token stored client-side and sent as `Authorization: Bearer <token>` header
3. JWT identity contains `{"role": "student"|"Staff"|"Admin", "id": "<user_id>"}`

### API Blueprint Registration

New API modules should:
1. Create blueprint in `Chronicle/api/blueprints/`
2. Register in `app.py` with appropriate URL prefix
3. Use `json_response()` for consistent response formatting
4. Use `serialize()` when returning MongoDB documents

## Environment Configuration

### API Environment Variables

Create `Chronicle/api/.env`:
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chronicle
JWT_SECRET=<strong-secret-key>
```

### Web Environment Variables

Create `Chronicle/web/.env`:
```
VITE_API_BASE_URL=http://localhost:5000
```

## Migration Status

The modern stack currently implements:
- ✅ Student/Staff authentication
- ✅ Basic notices functionality
- ⏳ Discussions (data model defined, endpoints pending)
- ⏳ Quizzes (data model defined, endpoints pending)
- ⏳ Chat (data model defined, endpoints pending)
- ⏳ Timeline/wall posts (pending)
- ⏳ Study materials (pending)

Future endpoints should follow the existing blueprint pattern in `Chronicle/api/blueprints/`.
