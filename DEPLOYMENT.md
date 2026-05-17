# Campus Connect — Deployment Guide

## Architecture
- **Frontend**: React + Vite → deploys to **Vercel** (or Netlify)
- **Backend**: Express + MongoDB → deploys to **Render** (or Railway)
- **Database**: MongoDB Atlas

---

## 1 · Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB Atlas account | — |
| Gemini API key | — |

---

## 2 · Local Development

```bash
# Clone
git clone https://github.com/your-username/campus-connect.git
cd campus-connect

# Install all dependencies
npm run install:all

# Configure server
cp server/.env.example server/.env
# Fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEY

# Configure client (optional — defaults to /api proxy)
cp client/.env.example client/.env

# Seed the database (optional)
npm run seed

# Run dev (client + server concurrently)
npm run dev
```

Ports:
- Client: http://localhost:5173
- Server: http://localhost:5000

---

## 3 · Deploy Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** → `server`
4. Set **Build Command** → `npm install`
5. Set **Start Command** → `npm start`
6. Add Environment Variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your Atlas connection string>
JWT_SECRET=<long random secret, 64+ chars>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
GEMINI_API_KEY=<your Gemini key>
GEMINI_MODEL=gemini-2.5-flash-lite
```

---

## 4 · Deploy Frontend (Vercel)

1. Import your repo on [Vercel](https://vercel.com)
2. Set **Root Directory** → `client`
3. **Framework Preset** → Vite
4. **Build Command** → `npm run build`
5. **Output Directory** → `dist`
6. Add Environment Variable:

```
VITE_API_URL=https://your-server.onrender.com/api
```

7. Create `client/public/_redirects` (already included) for SPA routing

> **Important**: After deploying the server, update `VITE_API_URL` to your Render URL and redeploy the frontend.

---

## 5 · Build Frontend Locally

```bash
npm run build
# Output: client/dist/
```

Preview the production build:
```bash
cd client && npm run preview
```

---

## 6 · Environment Variables Reference

### Server (`server/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✓ | `production` or `development` |
| `PORT` | ✓ | Server port (default 5000) |
| `MONGODB_URI` | ✓ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✓ | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | ✓ | Token expiry (e.g. `7d`) |
| `CLIENT_URL` | ✓ | Frontend origin URL for CORS |
| `CORS_ORIGINS` | ✓ | Comma-separated allowed origins |
| `GEMINI_API_KEY` | ✓ | Google Gemini API key (for Ask Doubt AI) |
| `GEMINI_MODEL` | — | Model name (default: `gemini-2.5-flash-lite`) |

### Client (`client/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✓ in prod | Backend API base URL (e.g. `https://xxx.onrender.com/api`) |

---

## 7 · Production Checklist

- [ ] `NODE_ENV=production` set on server
- [ ] `JWT_SECRET` is a random 64+ char string
- [ ] MongoDB Atlas IP whitelist configured (or `0.0.0.0/0` for Render)
- [ ] `CLIENT_URL` / `CORS_ORIGINS` point to your Vercel domain
- [ ] `VITE_API_URL` points to your Render server
- [ ] Frontend build (`npm run build`) completes without errors
- [ ] Database seeded if needed (`npm run seed`)

---

## 8 · User Roles

| Role | Capabilities |
|------|-------------|
| **Student** | Browse clubs/events, join clubs, register for events, use AI assistant |
| **Manager** | All student capabilities + create/edit/delete events for managed clubs |
| **Admin** | Full platform access — manage all clubs, events, users |

---

## 9 · Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, TailwindCSS 4 |
| Backend | Express 5, Node.js 18+, JWT auth |
| Database | MongoDB 9 (Mongoose) |
| AI | Google Gemini (Ask Doubt feature) |
| Fonts | Inter + Outfit (Google Fonts) |
