# TadkaPlay 🏏⚽🎾🏀 - Free-to-Play Virtual Coin Sports Prediction Game

**TadkaPlay** is a production-quality, mobile-first sports prediction web app inspired by modern Indian sports applications. Players predict match winners across Cricket, Football, Tennis, and Basketball using virtual coins.

> ⚠️ **IMPORTANT COMPLIANCE & SAFETY NOTICE**:
> This is strictly a **FREE-TO-PLAY** virtual coin prediction game.
> Virtual coins have **ZERO real-world monetary value**.
> There are NO payment gateways, UPI, deposits, withdrawals, cash prizes, cryptocurrency, or real-money redemption features.

---

## 🌟 Key Features

1. **Strictly Free-to-Play Virtual Wallet**:
   - 🪙 **1,000,000 FREE Virtual Coins** welcome bonus for new user registrations.
   - 🎁 **7-Day Daily Login Streak Bonus** (Up to 600 FREE coins daily).
   - 🏆 Virtual coin rewards for winning predictions & achievement unlocks.

2. **Mobile-First Responsive UI**:
   - Production-grade white theme with coordinated orange, amber, and slate accents.
   - Dynamic mobile bottom navigation bar (`Home`, `Live`, `Sports`, `Leaderboard`, `Account`).
   - Glassmorphism cards, glowing status badges, and smooth countdown timers.

3. **🔴 Live Match Experience**:
   - Real-time match scores & simulated commentary feed (`DEMO LIVE DATA`).
   - In-play prediction drawers for live matches.

4. **Prediction System**:
   - Select match winner with quick virtual coin chips (`[10]`, `[25]`, `[50]`, `[100]`, `[250]`).
   - 1.9x potential reward calculator.
   - Double-confirmation safety drawer.
   - Animated coin deduction & confetti celebration on win.

5. **Gamification & Leaderboards**:
   - XP system and player leveling (Rookie, Pro, Master).
   - Achievement badges (First Prediction, 5 Correct Predictions, 5-Win Streak, 80% Accuracy, Top 10 Leaderboard).
   - Weekly & All-Time global leaderboards with top 3 podium highlights (🥇, 🥈, 🥉).

6. **Admin Control Center**:
   - Dashboard analytics (Total users, active users, total predictions, coins in circulation).
   - Add / Edit / Delete matches.
   - Live score simulator & event feed manager.
   - **Declare Winner**: Automatically settles all pending user predictions and credits virtual coin rewards instantly.
   - User account management (suspend/activate users, grant support coins).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Canvas Confetti
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose schemas, numeric IDs, indexes, transaction-backed wallet/prediction flows, and a MySQL-to-Mongo migration utility. MySQL remains supported as the migration source.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing.

---

## 🚀 Quick Setup & Execution

### 1. Install Dependencies
Run from project root:
```bash
npm run install:all
```
*(This automatically installs root, server, and client packages)*

### 2. Environment Setup
Copy `server/.env.example` to `server/.env` and replace placeholders (never commit `.env`):
```bash
copy server\.env.example server\.env
```

Required keys are documented in `.env.example` and `DEPLOYMENT.md`. Do not use example values in production.

For a **split** frontend/API deploy, also copy `client/.env.example` to `client/.env` and set `VITE_API_URL` before building.

MongoDB is the production runtime database. Use MongoDB Atlas or a replica-set deployment because wallet, prediction, daily reward, and settlement flows use transactions.

### 3. Database Migration
Set these server variables in `server/.env`:

```env
DB_DRIVER=mongodb
MONGODB_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0
MONGODB_DB=tadkaplay_db
```

For an existing MySQL installation, keep the legacy MySQL variables available and preview the migration:

```bash
cd server
npm run migrate:mysql-to-mongo:dry-run
```

After taking a backup and pausing writes, run the idempotent migration:

```bash
npm run migrate:mysql-to-mongo
```

It preserves numeric IDs, timestamps, JSON fields, roles, wallet history, and relationships. Keep the MySQL backup until verification is complete.

For a new MongoDB installation, seed the database directly:

```bash
cd server && npm run seed
```

### 4. Run Development Application
To launch both client and server concurrently:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

### 5. Production deployment
See **[DEPLOYMENT.md](DEPLOYMENT.md)** for MongoDB transactions, migration, environment variables, and host setup.

---

## 🔑 Local demo admin (development only)

After `cd server && npm run seed` (or the in-memory fallback):

- **Email**: `admin@tadkaplay.com`
- **Password**: set via `ADMIN_PASSWORD` in `server/.env` (local seed default exists only when `NODE_ENV` is not `production`)

Never reuse local demo credentials in production. Set a strong `ADMIN_PASSWORD` when seeding the live database.

---

## 📁 Project Structure

```
TadkaPlay/
├── package.json
├── README.md
├── DEPLOYMENT.md
├── .env.example
├── .gitignore
├── server/
│   ├── .env.example
│   ├── config.js
│   ├── server.js
│   ├── database/
│   │   ├── schema.sql
│   │   ├── models.js
│   │   ├── db.js
│   │   ├── mongo.js
│   │   ├── migrate-mysql-to-mongo.js
│   │   └── seed.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── admin.js
│   └── routes/
│       ├── auth.js
│       ├── matches.js
│       ├── predictions.js
│       ├── wallet.js
│       ├── leaderboard.js
│       ├── achievements.js
│       └── admin.js
└── client/
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Header.jsx
        │   ├── MobileBottomNav.jsx
        │   ├── MatchCard.jsx
        │   ├── PredictionModal.jsx
        │   ├── DailyRewardModal.jsx
        │   ├── AuthModal.jsx
        │   └── CoinDisclaimer.jsx
        └── pages/
            ├── HomePage.jsx
            ├── LiveMatchesPage.jsx
            ├── SportsPage.jsx
            ├── WalletPage.jsx
            ├── LeaderboardPage.jsx
            ├── ProfilePage.jsx
            ├── HistoryPage.jsx
            ├── MatchDetailPage.jsx
            └── AdminDashboardPage.jsx
```
