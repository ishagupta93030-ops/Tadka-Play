# TadkaPlay production deployment

TadkaPlay is three pieces that must be reachable over HTTPS:

1. **React frontend** (`client/`) — Vite production build
2. **Node.js / Express API** (`server/`) — `node server/server.js`
3. **MySQL** — managed database; in-memory fallback is **disabled** when `NODE_ENV=production`

Virtual coins have no real-world value. Do not add payment, UPI, or withdrawal features.

---

## What must be true in production

| Piece | Requirement |
| --- | --- |
| Frontend | Built with Vite; if the API is on another host, rebuild after setting `VITE_API_URL` |
| Backend | Listens on `0.0.0.0` and `PORT` from the host; CORS limited to `CLIENT_ORIGIN` |
| Database | Real MySQL (or `DATABASE_URL`); SSL on most managed providers |
| Secrets | Only in the host’s env UI or a private `.env` that is never committed |

---

## Environment variables

### Backend (set on the API host)

Copy from `.env.example` / `server/.env.example`. Replace every placeholder. Never commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Must be `production` |
| `PORT` | Usually | Host often sets this automatically |
| `JWT_SECRET` | Yes | Random string, **32+ characters**. Signs login tokens |
| `CLIENT_ORIGIN` | Yes | Frontend origin(s), comma-separated, **no trailing slash**. Example: `https://app.example.com` |
| `SERVE_CLIENT` | No | Default: serve `client/dist` when that folder exists. Set `false` for API-only |
| `DATABASE_URL` | One of URL **or** fields | `mysql://USER:PASSWORD@HOST:3306/DB_NAME` |
| `DB_HOST` | If no URL | MySQL hostname |
| `DB_PORT` | No | Default `3306` |
| `DB_USER` | If no URL | MySQL user |
| `DB_PASSWORD` | If no URL | MySQL password (may be empty only if the server allows it) |
| `DB_NAME` | If no URL | Database name created in the provider panel |
| `DB_SSL` | Often yes | `true` for Aiven, PlanetScale, Railway, RDS, etc. |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | Default `true`. Set `false` only if the provider uses a private CA and you cannot supply it |
| `DB_POOL_SIZE` | No | Default `10` |
| `ADMIN_EMAIL` | Seed only | Email for the first admin user |
| `ADMIN_PASSWORD` | Seed only | Password for the first admin user (**required** when seeding in production) |

### Frontend (set **before** `npm run build`)

Vite bakes `VITE_*` into the JS bundle at build time.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | If API is a different origin | Public API origin, no trailing slash, e.g. `https://api.example.com`. Leave empty when Express serves `client/dist` on the same domain |

---

## Files that were prepared for production

| File | Why it changed |
| --- | --- |
| `server/config.js` | **New.** Loads env files, parses DB URL, production validation |
| `server/server.js` | Restricted CORS, bind `0.0.0.0`, optional static SPA, no stack traces to clients |
| `server/database/db.js` | SSL + pool options; **no memory fallback in production**; no `CREATE DATABASE` on managed hosts |
| `server/middleware/auth.js` | JWT secret from env (no hardcoded production secret) |
| `server/database/seed.js` | Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; password is not logged |
| `server/database/schema.sql` | Notes for importing on managed MySQL |
| `client/src/utils/api.js` | Uses `VITE_API_URL` when the API is hosted separately |
| `client/vite.config.js` | Unchanged proxy for local `/api` |
| `client/.env.example` | Frontend build-time variable template |
| `.env.example` and `server/.env.example` | Backend templates with placeholders only |
| `.gitignore` | Ignores `.env`, `client/dist`, secrets |
| `package.json` | `start` / `build` / `install:prod` for hosts; Node `>=18` |
| `client/public/_redirects` | SPA fallback for Netlify |
| `client/vercel.json` | SPA fallback for Vercel |

---

## Database setup

1. Create an empty MySQL database in your provider (name it to match `DB_NAME`).
2. Import tables from `server/database/schema.sql`. If `CREATE DATABASE` is not allowed, skip the first two SQL statements and import from `CREATE TABLE`.
3. Point the API at that database with `DATABASE_URL` **or** `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`.
4. Enable `DB_SSL=true` unless the provider documents that SSL is off.
5. From a machine that can reach the database:

```bash
cd server
# Use the same env vars as production (or a tunnel)
npm run seed
```

Seed creates achievements, demo matches, and one admin user. Change `ADMIN_PASSWORD` immediately after first login.

---

## Option A — one web service (Express + React)

Best for Render, Railway, Fly.io, or a VPS.

1. Install: `npm run install:prod`
2. Build: `npm run build`
3. Start: `npm start` (`node server/server.js`)
4. Set backend env vars. Leave `VITE_API_URL` empty so the browser calls `/api` on the same host.
5. Set `CLIENT_ORIGIN` to the public site URL (example: `https://your-app.onrender.com`).
6. Set `SERVE_CLIENT=true` (default). Ensure the build step produced `client/dist`.

Health check: `GET https://your-app.example.com/api/health`

---

## Option B — split frontend and API

Example: Vercel/Netlify for React, Render/Railway for Express, managed MySQL.

### API host

- Root directory: repository root (or `server/` if you start with `node server.js` and install `server` deps there)
- Start: `node server/server.js` or `npm start`
- `SERVE_CLIENT=false`
- `CLIENT_ORIGIN=https://your-frontend.example.com`
- MySQL env vars as above

### Frontend host

- Root directory: `client`
- Build: `npm install && npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://your-api.example.com`
- SPA rewrite: all routes → `index.html` (`_redirects` / `vercel.json` already added)

Rebuild the frontend whenever `VITE_API_URL` changes.

---

## Local production-like check (optional)

```bash
npm run install:all
npm run build
set NODE_ENV=production
# PowerShell: $env:NODE_ENV="production"
# Plus the required env vars from the table above
npm start
```

Open the URL your host prints, or `http://localhost:5000` if Express is serving `client/dist`.

---

## Security checklist

- [ ] No `.env` files in git
- [ ] `JWT_SECRET` is unique and long; not the old development fallback
- [ ] CORS origins are exact `https://` URLs, not `*`
- [ ] MySQL user is not `root` if the provider gives you an app user
- [ ] Admin password is not the local demo password
- [ ] Health endpoint does not return secrets
