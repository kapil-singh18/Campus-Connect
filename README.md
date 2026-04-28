# CAMPUS CONNECT - College Event & Club Manager

A clean, production-ready MERN minor project with role-based access, event and club workflows, registration tracking, and a campus chatbot.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT + bcrypt
- AI: Wit.ai (free) intent routing + Gemini (optional) + safe local fallback mode

## Features Implemented

1. Authentication
- Signup/Login with JWT
- Roles: `admin`, `manager`, `student`

2. Event Management
- Create, edit, delete events
- Event fields: title, description, date, venue, poster URL

3. Club Management
- Create club (admin/manager)
- View club profile
- Join club (student)

4. Event Registration
- Student register/unregister
- Registration modal collects optional phone + department + year details
- Participant data stored in `Registration`

5. Dashboards
- Role-specific dashboard APIs and UI cards/activity
- Managers can view participant details on event detail pages
- Managers can view club member list on club detail pages

6. Search & Filter
- Search by event title
- Filter by event category and date

7. Standout Feature: AI Chatbot
- Floating chatbot widget
- Dedicated `Ask Doubt` page
- Wit.ai integration (free tier) for intent-aware responses
- Gemini integration (optional) with event/club context
- Shared session history between floating bot and Ask Doubt page
- Clean plain-text assistant replies (short, practical, context-aware)
- Safe fallback response if external AI providers are unavailable

8. Experience Enhancements
- Landing page with subtle color accents and animated hero layout
- Unique Campus Connect logo integrated into landing and header
- Header profile panel with role/email/member-since details
- Icon-first controls for theme toggle, notifications, and logout
- Notification center for:
  - club join / leave
  - event register / unregister
  - unread count + detail expansion with student info and counts

## Project Structure

```text
.
|- client/   # React + Vite + Tailwind frontend
|- server/   # Express + MongoDB backend
|- package.json  # root scripts
```

## Environment Variables

### Backend (`server/.env`)

Use `server/.env.example` as reference:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
WIT_API_TOKEN=your_wit_server_token
WIT_API_VERSION=20230215
```

### Frontend (`client/.env`)

Use `client/.env.example` as reference:

```env
VITE_API_URL=http://localhost:5000/api
```

## Setup & Run

From repo root:

1. Install dependencies
```powershell
npm.cmd install
npm.cmd install --prefix server
npm.cmd install --prefix client
```

2. Seed database (after setting `MONGODB_URI`)
```powershell
npm.cmd run seed
```

3. Run full stack
```powershell
npm.cmd run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## Demo Credentials (after seed)

Password for all users: `Campus@123`

- `admin@campusconnect.test` (Admin)
- `manager1@campusconnect.test` (Club Manager)
- `manager2@campusconnect.test` (Club Manager)
- `manager3@campusconnect.test` (Club Manager)
- `student1@campusconnect.test` (Student)
- `student2@campusconnect.test` (Student)
- `student3@campusconnect.test` (Student)
- `student4@campusconnect.test` (Student)

## Tests

Backend smoke tests:

```powershell
npm.cmd run test --prefix server
```

Covered:
- Auth signup/login/me
- RBAC protection for manager scope
- Register/unregister flow
- Chatbot fallback behavior

## Deployment (Free Tier)

### Frontend on Vercel (Hobby)
- Import `client/` as project root
- Build command: `npm run build`
- Output dir: `dist`
- Env: `VITE_API_URL=https://<your-render-service>.onrender.com/api`

### Backend on Render (Free Web Service)
- Root directory: `server/`
- Build command: `npm install`
- Start command: `npm start`
- Set `NODE_ENV=production`
- Add `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` or `CORS_ORIGINS`
- Leave `GEMINI_API_KEY` and `WIT_API_TOKEN` empty unless you actually use those integrations

### Database on MongoDB Atlas (M0)
- Create free M0 cluster
- Add Render IP access rule or allow all for demo
- Set `MONGODB_URI` in Render env

## Notes

- Render free services can spin down after idle periods.
- Gemini integration is server-side only (API key is never exposed to client).
- Wit.ai integration is server-side only (token is never exposed to client).
