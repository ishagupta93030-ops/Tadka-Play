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
   - Modern Indian sports app theme (Dark navy background `#0A0D14` with vibrant orange & golden yellow accents).
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
- **Database**: MySQL (`mysql2/promise`) with pure `schema.sql` + Zero-Config fallback engine for immediate execution out-of-the-box.
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

MySQL is optional only in local development (in-memory fallback). Production requires MySQL.

### 3. Database Import (MySQL)
To run with a local MySQL server, create the database and import `server/database/schema.sql`:
```bash
mysql -u root -p < server/database/schema.sql
```
Then run the seed script:
```bash
cd server && npm run seed
```

*Note: If MySQL is not running on your machine, TadkaPlay automatically initializes its internal high-performance data store so you can test all features instantly without configuration.*

### 4. Run Development Application
To launch both client and server concurrently:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

### 5. Production deployment
See **[DEPLOYMENT.md](DEPLOYMENT.md)** for CORS, MySQL, environment variables, and host setup.

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
│   │   ├── db.js
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
